# STAND exercise, Nick Bailey, June 2025


### Stack overview

#### Assessment critiera

When chosing technology for a full stack application, I typically evaluate the software on the following metrics in rough order of priority

1. Does the tool solve the problem reasonably well? Note that this is a 'satisfying' not an 'optimizing' crierion. Given two tools that both solve the problem reasonably well criteria 2-4 tend to dominate.
2. What tools are we already using? Each new tool or technology adds substantial mainteance overhead, so we should strongly prioritize tools we already use.
3. How widely used is the technology? Widely used tools supported by large open source foundations or major corporations are stabler than tools maintained by individual developers. Developers are alos more likely to be familiar with industry standard tools.
4. How good is the tool's history of stability. How long has it been maintained. Does it have a history of major defects?
5. How well does the tool solve the problem?


#### What tools do we need

Looking at the requirements for our application we need:

1. A mechanism for taking human readable decision rules writen by applied sciences and executing the *deterministically* against input data. There are a number of ways we could do this, but the best option is likely a restricted expression parsing tool that can turn simple code-like expressions into an executable Abstract Syntax Tree. I'll talk more about why this is the right tool moving forward.
2. A mechanism for storing and retrieving rules for evalauation.
3. An API that exposes both CRUD operation for rules and evalaution of rules
4. A framework for building user-facing applications to manage and evaluate rules.

#### Decision rules

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

In a production context, the fundamental question would be: 'what languages does our ecosystem support already?' The cost of introducing a new language is very, very high. The long term congnitive and operational overhead of code-switching is very high. Yes, we want to chose the right tool for the problem. But interopability is a huge part of what makes a tool right. 

With that in mind, my evaluation logic would run roughly as follows

1. If we already support or plan to support Go or Java services, we would absolutely use Google backed CEL in one of those languages.
2. If we support Python, we should use Cloud Custodian backed CEL. Their implementation is pretty robust, as it seems to be core to their business as a SaaS rules engine.
3. If we do not support any of those languages (say, only Node/typescript), things get a bit more complicated. I think I would still prioritize 'do not introduce a new language' over 'be able to use CEL', and would pick another, well established tool. In the JS ecosystem math.js is the most robust.

For my solution, I chose to continue act 'as if' we were in scenario 3. This was driven by practical considerations. Timelines are tight, and I want us to focus on the user experience rather than on spinning up and getting a stable Python service.

If not, I do not personally believe the benefits of using an official Google implementation of CEL would come close to outweighing the constant cognitive cost of adding a new language to our stack. Yes, using a well maintained, portable expression language is really valuable. But so is ensuring high developer productivity by minimizing the number of stacks we need to maintain. Long term, that overhead is almost certainly worse. We should use the right tool for the job, but interoperability is a huge part of what makes a tool right.

So the decision of what tool to use would come down to supported languages in our ecosystem. I'm going to operate under the made up rule that our already-supported languages are Python and Typescript. This let's me both leverage languages I'm fastest in, while also illustrate the way we'd make a tradeoff decision like this. 


## Stack overview

The problem presented here doesn't apply a lot of pressures for picking any particular language, framework or tooling.

The application is likely to have *relatively* few concurrent users. Total load is going to be low. Computational complexity is also pretty low. This means we are free to pick a web application stack without serious concern for speed. In a vacuum a more efficient web stack usually means lower hosting costs, but at our scale, hosting costs will be dwarfed by development costs, so we should optimize for development speed.

Working in a company, I would just use whatever web UI and backend frameworks were the default for that organization. Consistency dwarfs other considerations in this case where there are no complex feature or performance constraints.

With that in mind, I picked Typescript + Node + Express + React + CSS Modules + Postgres + Docker Compose, because that's a set of tools I personally can work quickly in without having to code-switch between two different languages, and it's a stack LLMs execute on pretty well, which is valuable when iterating rapidly.

## Architecture Overview

The solution consists of three applications, a backend which stores rules and executes the evaluation logic, and two UIs one for Applied Sciences users and one for underwriters.

Additionally there's a shared model library that holds pure data model classes. These serve as the interface between the backend and frontends, as well application state within the logic of both the front end and the backend. I'm not sure, as the application evolves, if this will stay the case - application state on the UI side could certainly diverge quite a bit over time. 

Fortunately, making the models the interface of the web API itself means that they are pretty rigid, meaning that if application state does start to diverge in the UI it shouldn't leak back into the model library.

### Domain Terms

The domain has a few core concepts that will help discussing features.
- Inspection: The data about a property we use to evaluate rules.
- MitigationRule: A rule that can be evalauted against property data to determine if there are issues with the property and recommend mitigations
- RuleSetVersion: A snapshot of a set of rules at a particular point in time. A rule set version can be evaluated against an Inspection
- RuleSet: A sequence of RuleSetVersions over time. At any time there is one 'main' rule set and any number of 'draft' rule sets.
- DecisionRule: A simplified program that can be evaluated against an input to produce a boolean output. I dont' love the name because it's overloaded with MitigationRule, but I couldn't come up with a better one off the top of my head. Decision rules consist of a sequence of 'variable' evaluations that allow users to set context variables, then a conditional evaluation of the rule itself. They are stored as JSON representations of ASTs, one per variable and one for the condition.

### Backend

The backend is an Express app broken into:
- The persistence layer, which uses TypeORM and postgres, and stores rules as JSONB documents. This layer supports versioning of sets of rules
- The engine itself, which converts those JSON documents into executable Abstract Syntax Trees, and executes the tree given a context object (the set of observations about a property)
- The application layer, which manages requests to create and update rule, as well as requests to execute rules using the engine

#### Persistence Layer

The current iteration has only two entities - RuleSet and RuleSetVersion.

A RuleSet represents a collection of rules that changes over time. At any given time, there is exactly one 'main' RuleSet and an arbitrary number of 'draft' rulesets. 

Each RuleSet has many RuleSetVersions. Right now, all rules for a given version are stored on in the rule_set_versions table in JSON. This means that there is no tracking of individual rules as entities independent of rule sets. I chose this approach for its simplicity. Managing one sequence of versioned entities is easy. Managing multiple versioned entities in a one to many relationship with other versioned entities is much more complex. RuleSetVersions are timestamped, allowing any RuleSet to be evaluated 'as of' a particular point in time. Note that this also opens us to scheduling 'future' changes to a rule set if we want, though the functoinality is not there and the API layer would require minor tweaks.

The benefit of this domain is that even though the current system doesn't support evaluating 'prospective' or draft RuleSets, the logic to do so already exists at a domain level, any time we want to build a UI. This means experimentation is built into the domain. Similarly our model could easily be updated to allow viewing version history, audit use cases (provided of course basic user management), reverting to previous versions, diffing rule versions, side by side experiments of different rule sets or versions of the same rule set and more. A fairly simple history structure supports an huge set of key business features in one go.

Another benefit of storing rule-sets as unstructured data is it allows us to freely extend or modify our abstract syntax trees as long as we maintain backwards compatibility. Right now our AST only supports a few kinds of node (AND, OR, EQUALS, VARIABLE, VALUE), but we could add aribtrary new node types.


#### Engine
The engine uses the `expr-eval` expression language library to evaluate rules against property inspection data. Rules are written as JavaScript-like expressions that can reference properties from the inspection context.

For example, a rule might look like:
```
vegetation.length > 0 && map(v => v.distanceToWindowInFeet < 10, vegetation).some(x => x)
```

This would evaluate to true if there is vegetation present and any vegetation item is within 10 feet of a window.

The expression language supports:
- Basic arithmetic and comparison operators
- Boolean logic (AND, OR, NOT)
- Array operations like `map`, `filter`, `some`, `every`
- Property access and function calls
- Variables and complex nested expressions

This approach provides a much more intuitive authoring experience compared to JSON-based AST trees, while still maintaining the flexibility needed for complex underwriting rules.

Decision rules are stored as simple expression strings and evaluated dynamically against inspection contexts. This allows for powerful rule logic while keeping the data model clean and the user interface manageable.


#### Application Layer
The application layer is fairly straightforward. Routes delegate to a service which handles DB access. It exposes the following operations

* **GET /api/rulesets** – List every rule-set in the system (id, name, main/draft flag).  

* **GET /api/rulesets/main** – Return the main rule-set version if asOf is set as a query parameter, get the rule-set as of that point in time, otherwise, return the lastest version

* **GET /api/rulesets/:id** – Same as the main endpoint, but for an arbitrary rule set id

* **POST /api/rulesets** – Create a draft rule-set and seed it with an initial set of rules sent in the request body.  Responds with the first `RuleSetVersion` that was created.

* **POST /api/rulesets/:id/versions** – Persist a new version (snapshot) of an existing rule-set.  The caller supplies a complete set of rules and receives the newly-created `RuleSetVersion` back.

* **POST /api/rulesets/:id/publish** – Publish the latest version of a draft rule-set to the main rule-set by copying its rules into a new version of the main rule-set.  Responds with that new main version.

* **POST /api/rulesets/main/evaluate** – Evaluate the main rule-set, possibly as of a a snapshot time against a set of property observations supplied in the body and return pass/fail results plus any mitigations.

* **POST /api/rulesets/:id/evaluate** - Exactly the same as the main endpoint, but evaluates an arbitrary ruleset.

This API is a sort of pseudo-REST, not strictly mapping to any paradigm. That's deliberate, as this service isn't *just* a data store, it's a rules engine. The API is designed to closely mirror our business workflows of creating editing and executing rules.



### Applied Sciences UI

The applied sciences UI in its current iteration is just a classic multi-row edit form. When a user starts editing, a new draft is created. The rules can be freely edited, with each save creating a new RuleVersion for that draft. The publish option calls the publish endpoint, causing the draft to be copied as a new version of the main rule set

There is a lot of jank here that needs to be cleaned up. Obviously the rule editing needs to be improved (see below for options). The mitigation editing is also incredibly jank - a free text field with newline separated. 

Right now there's no way to clean up old drafts or even access old drafts. That would be a early improvement to add.


There also isn't one of the features requested which a test evaluate feature for the applied sciences UI.

It wouldn't be hard to add one, and if I have a few minutes over the weekend I will, but the best way to do it would be to componentize the form in a shared component library which would take a bit of extra time, and I was running up hard against time limits.


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

This application has basically no validation or error handling. Users can pretty easily get things into a bad state with a simple typo. It was described as a proof of concept/spike, so I made no real attempt to harden the application. This of course, is a bunch of tech debt we've incurred, and I don't think I would do this to this degree even with a prototype in real life.

### Tests

I cared above all about getting a working prototype up, so I did something I almost never ever ever do and skipped writing unit tests in favor of implementing a fuller set of functionality. This runs counter to every development instinct I have. The application obviously has to be retrofitted with unit tests, as well as likely an end-to-end test in Cypress ensuring that the data flows as expected between the two UIs.

### Usability

The applied sciences UI now uses a JavaScript-like expression language for rule authoring, which is much more intuitive than the previous JSON AST approach. Users can write rules using familiar syntax like:

```
vegetation.length > 0 && some(map(v => v.distanceToWindowInFeet < 10, vegetation))
```

This is a significant improvement over the previous verbose JSON structure. The expression language provides:
- Familiar JavaScript-like syntax
- Built-in support for array operations
- Clear, readable rule conditions
- Immediate validation of expression syntax

While there's still room for improvement (such as adding an expression builder UI or autocomplete features), the current implementation provides a solid foundation for rule authoring that's both powerful and user-friendly.

The mitigation editing process still has some jank - it's currently a free form field with newline separation. That's a terrible UI, but it serves to illustrate the premise and is something that we aren't 'locked in to' design wise.

### Engine Extensions

The current expression language implementation using `expr-eval` provides a solid foundation, but there are several areas where it could be extended:

- **Enhanced array operations**: While basic `map` and filtering work, more complex list operations could be added
- **Date/time operations**: Support for date comparisons and calculations
- **String manipulation**: Advanced string operations beyond basic equality
- **Custom functions**: Domain-specific functions for insurance calculations
- **Type validation**: Better runtime type checking for expression inputs
- **Performance optimization**: Caching compiled expressions for repeated evaluations

The `expr-eval` library provides a good balance of functionality and simplicity, though for a production system we might consider more robust expression engines like Google's Common Expression Language (CEL) or similar enterprise-grade solutions.


### Applied Sciences UI Extensions

The applied sciences UI should be extended to support a host of use cases:
- Managing different drafts
- Execution testing built into the draft UI
- Comparing results for different drafts or versions of the same draft
- Viewing rule history


### Underwriting UI Extensions

The underwiting UI has less Jank than applied sciences by a long shot, but there's still some. I don't really love the as-of UI, it feels... I don't know just off. The selects are a bit janky with their combo of custom sytling and default browser behavior


## Other things I would do differently in real life

After initially building a custom AST-based rules engine, I ultimately moved to using the `expr-eval` expression language library. This proved to be the right choice - it provides a much better user experience for rule authoring while maintaining the flexibility needed for complex underwriting logic.

In a production system, I would likely evaluate additional expression language options like Google's Common Expression Language (CEL) or similar enterprise-grade solutions, depending on performance requirements and feature needs. The key insight is that expression languages provide the right balance of power and usability for this type of rules engine.



## On the use of AI

I think it's helpful to provide some context on how I did and didn't use AI, to better highlight my particular skills. 

The overal structure of the application almost all of the data modeling the routes/API layer are more or less hand coded.

The React code was 'assisted' coded. I knew what structure I wanted but heavily leveraged the AI assistant to move code around and generate markup faster than I could manually.

The styling is basically all AI guided. Styling is just too slow for a rapid iteration project like this, particularly for those of us who've largely worked in design systems.That being said, it's far from the 'default' style. I learned that Claude is pretty good at CSS, but *awful* at web design. 