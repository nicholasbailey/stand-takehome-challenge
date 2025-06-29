# STAND exercise, Nick Bailey, June 2025


## Stack overview

### Assessment critiera

When chosing technology for a full stack application, I typically evaluate the software on the following metrics in rough order of priority

1. Does the tool solve the problem reasonably well? Note that this is a 'satisfying' not an 'optimizing' crierion. Given two tools that both solve the problem reasonably well criteria 2-4 tend to dominate.
2. What tools are we already using? Each new tool or technology adds substantial mainteance overhead, so we should strongly prioritize tools we already use.
3. How widely used is the technology? Widely used tools supported by large open source foundations or major corporations are stabler than tools maintained by individual developers. Developers are alos more likely to be familiar with industry standard tools.
4. How good is the tool's history of stability. How long has it been maintained. Does it have a history of major defects?
5. How well does the tool solve the problem?


### What tools do we need

Looking at the requirements for our application we need:

1. A mechanism for taking human readable decision rules writen by applied sciences and executing the *deterministically* against input data. There are a number of ways we could do this, but the best option is likely a restricted expression parsing tool that can turn simple code-like expressions into an executable Abstract Syntax Tree. I'll talk more about why this is the right tool moving forward.
2. A mechanism for storing and retrieving rules for evalauation.
3. An API that exposes both CRUD operation for rules and evalaution of rules
4. A framework for building user-facing applications to manage and evaluate rules.

### Decision rules

The core of this appliation is an engine that processes rules written by our applied sciences team. We would like them to be able to write these rules in a syntax that is both intuitive and flexible. 

That team is technical enough to work with simple programs. This means we should have no trouble training them on a DSL for writing expresion rules. There are a couple of different styles of DSL we could adopt

1. JSON/YAML based DSLs, which essentially have you wr"iting out part of all of the syntax tree. A rule in this might look like `{"and": [{"<": [1, 2]}, {"=", [1, 1]}]}`
2. Expression style DLS, that simulate the syntax of most programming languages, with rules looking like `1 < 2 AND 1 = 1`
3. Spreadsheet/functional DSLs, that simulate the syntax of a spreadsheet expression, with rules looking like `AND(LT(1,2), EQUALS(1, 1))`

Of these three expression style DSLs are generally the most user friendly, followed by spreadsheet sytle DSLs and finally markup based DSLs.

In my original implementation, I overindexed on demonstrating an understanding of how such a system works under the hood, and so chose to focus on handrolling a markup-based DSL. This was a misalignment on the goal of our exercise here. So this new iteration focuses on an expression based DSL for decision rules. We should *not* maintain such a tool ourselves. While building one is simpler than you might think, the maintenance cost is really high.

Some options here include:

1. Google's [Common Expression Langauge](). CEL is a robust expression lnaguage This has the huge pro of being free and open source, and backed by Google. It has the huge downside of only having official Go and Java bindings. There is a reasonably robust Python implementation by a company named 'Cloud Custodian' [link](https://github.com/cloud-custodian). The community Javascript bindings are not production ready. 
2. Language specific options. These vary widely by language. Javascript has Math.js and expr-eval, both of which have been around and are wildely use, but each of which is maintained by a single developer. 

This gives us the following options:

1. Build a backend in Golang or Java in order to be able to leverage CEL. 
2. Build a backend in Python, and leverage the Cloud Custodian CEL implementation.
3. Use a langauge specific expression-parser

In a production context, the fundamental question would be: 'what languages does our ecosystem support already?' The cost of introducing a new language is very, very high. The long term congnitive and operational overhead of code-switching brutal. Yes, we want to chose the right tool for the problem. But interopability is a huge part of what makes a tool right. 

With that in mind, my evaluation logic would run roughly as follows

1. If we already support or plan to support Go or Java services, we would absolutely use Google backed CEL in one of those languages.
2. If we support Python, we should use Cloud Custodian backed CEL. Their implementation is pretty robust, as it seems to be core to their business as a SaaS rules engine.
3. If we do not support any of those languages (say, only Node/typescript), things get a bit more complicated. I think I would still prioritize 'do not introduce a new language' over 'be able to use CEL', and would pick another, well established tool.

In the JS ecosystem math.js is the most robust option for this kind of work. While it is not maintained by a large organization, it does have widespread production use, with over a million weekly npm downloads, and is actively maintained. 

For my solution, I chose to continue act 'as if' we were in scenario 3. This was driven by practical considerations. Timelines are tight for this second take on the problem, and I want to focus on solving the problems rather than getting a new stack in place.


### Other tooling

Outside of the decision rule tooling, no part of our problem requires us to use anything but the most industry standard basic tools.

Datascale is fairly small. A single decision rule takes up perhaps 100-200 characters max for less than half a kilobyte of data. With 10,000 decision rules that's 50 MB or so. This is small enough to be stored in a *single* Postgres JSONB document, let alone 

Maintaining version history adds scale, but not that much. Even if we tracked every single edit, we have applied sciences folks editing rules a few times a day. Back of the envelope we probably have less than 10000 edits a year. So even if we copied the entire ruleset on every single modification and kept full history of every edit, we would still be talking about a dataset in the tens-to-hundreds of thousands of rows and a full data set in the 500 GB range. This is well within the capacity of a standard postgres setup. And that's if we are incredibly lazy in how we store data.

With that in mind, there is no reason to pick a database other than Postgres. It's the most widely used relational database, has excellent suport for document or structured data and handles everything we want to do here.

As for API and UI frameworks, there is nothing special about our needs for either. Our total traffic is likely to be extremely low. I cannot imagine we are dealing with more than perhaps a few hundered concurrent users accross applied sciences and underwriting. The actual logic of our application is not going to be especially compute intensive. And our UI doesn't do anything all that special - it's basic forms and tabular data display. I chose React and Express.js for this prototype, because those are industry standard tools that can be iterated with extremely rapidly, but this decision would be guided heavily by what tooling we already had in place.

## Architecture Overview

The solution consists of three applications, a backend which stores rules and executes the evaluation logic, and two UIs one for Applied Sciences users and one for underwriters.

Additionally there's a shared model library that holds pure data model classes. These serve as the interface between the backend and frontends, as well application state within the logic of both the front end and the backend. I'm not sure, as the application evolves, if this will stay the case - application state on the UI side could certainly diverge quite a bit over time. 

There's also a shared component library that allows reuse of UI components.

Finally, there's a small suite of Playwright e2e tests that allow me to refactor aggressively without breaking the core features

### Domain Terms

The domain has a few core concepts that will help discussing features.
- Inspection: The data about a property we use to evaluate rules.
- MitigationRule: A rule that can be evalauted against property data to determine if there are issues with the property and recommend mitigations
- Check: A simplified program that can be evaluated against an input to produce a boolean output. Used to check if a given property passes of fails a mitigation rule
- RuleSetVersion: A snapshot of a set of rules at a particular point in time. A rule set version can be evaluated against an Inspection
- RuleSet: A sequence of RuleSetVersions over time. At any time there is one 'main' rule set and any number of 'draft' rule sets.

### Backend

The backend is an Express app broken into:
- The persistence layer, which uses TypeORM and postgres, and stores rules as JSONB documents. This layer supports versioning of sets of rules
- The engine itself, which leverages the Math.js expression parser to execute mitigation rules.
- The application layer, which manages requests to create and update rule, as well as requests to execute rules using the engine.

#### Persistence Layer

The current iteration has only two entities - RuleSet and RuleSetVersion.

A RuleSet represents a collection of rules that changes over time. At any given time, there is exactly one 'main' RuleSet and an arbitrary number of 'draft' rulesets. 

Each RuleSet has many RuleSetVersions. Right now, all rules for a given version are stored on in the rule_set_versions table in JSON. 

This means that there is no tracking of individual rules as entities independent of rule sets. 

I chose this approach for its simplicity. Managing one sequence of versioned entities is easy. Managing multiple versioned entities in a one to many relationship with other versioned entities is much more complex.

The main downside of this approach is it duplicates a lot of data. In our current approach, the full ruleset is copied for every single edit. This shouldn't be a query performance problem, as the total number of records is still going to be small. Even at 40 edits a day, we'd still only have 14,600 records a year, which is chump change, especially as we never query on the data in the rule blob itself, only on the indexed fields. 

From a storage perspective, it's also not a big deal. 15000 edits of 10000 rules each at .5 KB is a mere 75GB of data. Again, for Postgres, that is really not very much. We have several years of runway to implement a more space-efficient storage layer (if we ever decided to)

RuleSetVersions are timestamped, allowing any RuleSet to be evaluated 'as of' a particular point in time. Note that this also opens us to scheduling 'future' changes to a rule set if we want, though the functionality is not there and the API layer would require minor tweaks.

The benefit of this domain is that even though the current system doesn't support evaluating 'prospective' or draft RuleSets, the logic to do so already exists at a domain level, any time we want to build a UI. This means experimentation is built into the domain. Similarly our model could easily be updated to allow viewing version history, audit use cases (provided of course basic user management), reverting to previous versions, diffing rule versions, side by side experiments of different rule sets or versions of the same rule set and more. A fairly simple history structure supports an huge set of key business features in one go.

Another benefit of storing rule-sets as semi-structured data is it allows us to freely extend or modify how rules are defined as long as we maintain backwards compatibility


#### Engine
The engine uses the [math.js](https://mathjs.org/) expression language library to evaluate rules against property inspection data. Rules are written as code-like

For example, a rule might look like:
```
each(vegetagion, f(v) = ((v.type == "Tree" and windowType == "TemperedGlass" and v.distanceToWindowInFeet <= 30) or (v.type == "Tree" and windowType == "DoublePane" and v.distanceToWindowInFeet <= 60)))
```

Decision rules are stored as simple expression strings and evaluated dynamically against inspection contexts. This allows for powerful rule logic while keeping the data model clean and the user interface manageable.

We have slightly extended the existing math.js library to support our use case. In particular, we wanted to support a mechanism for evaluating a boolean rule against a sequence of data points, while also keeping track of which data point maps to which result. For example, we might apply a rule to each piece of vegetation on the property, and show the user the results for each piece of vegetation. This is accomplished via the `each` function we have added through math.js's plugin system. We have also changed the behavior of equality comparisons to use strict equality.


#### Application Layer
The application layer is fairly straightforward. Routes delegate to a service which handles DB access. It exposes the following operations

* **GET /api/rulesets** – List every rule-set in the system (id, name, main/draft flag).  

* **GET /api/rulesets/main** – Return the main rule-set. If asOf is set as a query parameter, get the rule-set version as of that point in time, otherwise, return the lastest version

* **GET /api/rulesets/:id** – Same as the main endpoint, but for an arbitrary rule set id

* **POST /api/rulesets** – Create a draft rule-set and seed it with an initial set of rules sent in the request body.  Responds with the first `RuleSetVersion` that was created.

* **POST /api/rulesets/:id/versions** – Persist a new version (snapshot) of an existing rule-set.  The caller supplies a complete set of rules and receives the newly-created `RuleSetVersion` back.

* **POST /api/rulesets/:id/publish** – Publish the latest version of a draft rule-set to the main rule-set by copying its rules into a new version of the main rule-set.  Responds with that new main version.

* **POST /api/rulesets/main/evaluate** – Evaluate the main rule-set, possibly as of a a snapshot time against a set of property observations supplied in the body and return pass/fail results plus any mitigations.

* **POST /api/rulesets/:id/evaluate** - Exactly the same as the main endpoint, but evaluates an arbitrary ruleset.

This API is a sort of pseudo-REST, not strictly mapping to any paradigm. That's deliberate, as this service isn't *just* a data store, it's a rules engine. The API is designed to closely mirror our business workflows of creating editing and executing rules.

### Applied Sciences UI

The Applied Sciences UI is a React application with two pages, one for editing rule sets, and one for evaluating them. I could see a case for these two components being in the same page, or in some sort of wizard flow, but this is a good 'first pass' approach.

Edits are done via a classic multi-row edit form. When a user starts editing, a new draft is created. The rules can be freely edited, with each save creating a new RuleVersion for that draft. The publish option calls the publish endpoint, causing the draft to be copied as a new version of the main rule set. This creates an editing experience more like other modern content production tools where changes to drafts not need to be explicitly saved, but there is often a 'publish' that makes the data available more publicly.

The evaluation page allows you to pick any rule set (draft or main version) and test it. One thing that should be added here is context tracking shared between pages, so that if you are currently editing a draft set, that set is the default option when you toggle to the evaluation page. 


### Underwiting the UI
Underwriting UI is another simple React app with a single form that allows the user to evaluate inspections against the rules engine, with an optional date paramenter. 

Both UIs are extremely minimal. This is deliberate. UIs are much more likely to radically change between prototype, initial 'MVP' design, and final delivered design than APIs. Overstructing a prototype UI can lead to you having much more code to refactor down the road. 


## User flow
The flow is pretty simple in its current iteration. Applied sciences leverage their app to develop a set of rules, through the draft editing functionality, and then publish. Underwriters can then test against their app.

As the application develops, there's likely a lot of things we would layer in. Given our underlying API, the UI could easily be extended to support:

- Editing of multiple different drafts
- Viewing old drafts
- Comparing rule executions between drafts
- Running many evaluations in a batch (say, via file upload)
- Saving and displaying history of rule evaluations
- Tying rule evaluations to specific properties allowing the user to see a history of how rule evaluations have changed for a property

And much much more. 

## Future Works

### General functionality

There's a lot that's omitted in this prototype that would be necessary for any kind of go live product including:

- User management
- Authentication and authorization (distinguishing between applied sciences)
- Any kind of setup for production deployment

### Robustness

This application has limited validation and error handling. Users can pretty easily get things into a bad state with a simple typo. It was described as a proof of concept/spike, so I made no real attempt to harden the application. 

### Tests

I cared above all about getting a working prototype up, so I did something I almost never ever ever do and limited written unit tests in favor of implementing a fuller set of functionality. This runs counter to every development instinct I have. The application obviously has to be retrofitted with unit tests throughout.

### Usability

The applied sciences UI edit form could use some design attention. Mitigations in particular are a bit wonky - they are currently managed by  a free form field with newline separation. That's a terrible UI, but it serves to illustrate the premise and is something that we aren't 'locked in to' design wise.


### Applied Sciences UI Extensions

The applied sciences UI should be extended to support a host of use cases:
- Managing different drafts
- Comparing results for different drafts or versions of the same draft
- Viewing rule history


### Underwriting UI Extensions

The underwiting UI has less jank than applied sciences by a long shot, but there's still some. There are a few weird UI interactions, that are not exactly breaking, but are visually odd. 

The selects are a bit janky with their combo of custom sytling and default browser behavior.

The UI for multi-item rules, like the vegetation rule in the example feels clunky.

