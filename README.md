# STAND exercise, Nick Bailey, June 2025


## Stack overview

The problem presented here doesn't apply a lot of pressures for picking any particular language, framework or tooling.

The application is likely to have *relatively* few concurrent users. Total load is going to be low. Computational complexity is also pretty low. This means we are free to pick a web application stack without serious concern for speed. In a vacuum a more efficient web stack usually means lower hosting costs, but at our scale, hosting costs will be dwarfed by development costs, so we should optimize for development speed.

Working in a company, I would just use whatever web UI and backend frameworks were the default for that organization. Consistency dwarfs other considerations in this case where there are no complex feature or performance constraints.

With that in mind, I picked Typescript + Node + Express + React + CSS Modules + Postgres + Docker Compose, because that's a set of tools I personally can work quickly in without having to code-switch between two different languages, and it's a stack LLMs execute on pretty well, which is valuable when iterating rapidly.

## Architecture Overview

The solution consists of three applications, a backend which stores rules and executes the evaluation logic, and two UIs one for Applied Sciences users and one for underwriters.

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
The engine is a fairly basic AST processor. A JSON document is parsed into a tree of nodes of a variety of types, each of which can be evaluated against a context. So a tree like
```
                 AND
      EQUALS                           EQUALS
VALUE: 1, VARIABLE: myNumber     VALUE: 1, VARIABLE: myothernumber
```
Would evaluate to true if and only if mynumber = 1 and myothernumber = 2

Decision rules can have variables set by expressions. This allows us to execute programs that, in pseudo code, would look like this (not intended to be identical to the rules in the requirements)

```
$distanceMultiplier = IF $windowType = "SinglePane" 3 ELSE 2
$distanceDivisor = IF $vegetationType = "Shrub" 2 ELSE 3

return 30 * $distanceMultiplier / $distanceDivisor
```

Ironically, this was by far the easiest part of the project to write. I had that done in less than a quarter of the time that it took me to get the react app reasonably styled and correctly interaction. Let that say what it does. 


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
Underwriting UI is another simple React app with a single form that allows the user to evaluate inspections against the rules engine. 


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

The applied sciences UI is very diffucult to work with. The biggest reason for that is that currently folks have to input the raw JSON representation of the entire abstract syntax tree of a rule. That's brutal. 

Fortunately, once you have the AST processing in place, you can freely edit how it is input, as long as you can write something that can be transformed into the AST. Some options would be

A cleaner input format, for example YAML with short hand syntax. For example we might convert the verbose

```
{
  "operator": "VARIABLE",
  "name": "roofType"
}
```

To the more compact

```
$roofType
```

So that our rule might look like:

```
condition:
    operator: "OR"
    operands:
        - operator: "AND"
          operands:
            - operator: "EQUALS"
              operands:
                    - "$roofType"
                    - "ClassB"
            - operator: "EQUALS"
              operands:
                    - "$wildFireRisk"
                    - "A"
        - operator: "EQUALS"
          operands: 
            - "$roofType"
            - "ClassA"
```

Already much more readable.

But of course we could go further. It would be prety simple to write a parser for spreadsheet style input (polish notation), so the rule would look like

```
OR(AND(EQUALS($roofType, "ClassB"), EQUALS($wildFireRisk, "A")), EQUALS($roofType, "ClassA))
```

Finally, if we really wanted to get fancy, we could write a basic parser and have our rule look like

```
($roofType = "ClassB" AND $wildFireRisk = "A") OR $roofType = "ClassA"
```

Of course, we could also use an out of the box expression language like [Common Expression Language](https://cel.dev/). In a production context, I would almost surely do this, because while writing an expression parser is not that hard, *maintaining* an expression parser is miserable and outside of our core area of competence.

There's also some jank in the mitigation edit process. Right now it's a free form with new line separation. That's a terrible UI, but it serves to illustrate the premise and is something that we aren't 'locked in to' design wise.

### Engine Extensions

Currently the Engine is missing a number of node types we'd almost certainly need to support a functional system, these include:

- EACH: Executing a rule for every item in a list
- Mathematical operations for numbers
- Some sort of conditional operation `$var = IF $roofType = A THEN 1 ELSE 2` type stuff
- Inequality comparisons
- Negation

Of course, as we noted, in a real production system we'd be looking for an out of the box expression parser, which would likely support all of this. Coding challenge are weird as they are this strange balance between show us what you know and do it the way you would in real life. I'm never sure exactly how to thread that needle.


### Applied Sciences UI Extensions

The applied sciences UI should be extended to support a host of use cases:
- Managing different drafts
- Execution testing built into the draft UI
- Comparing results for different drafts or versions of the same draft
- Viewing rule history


### Underwriting UI Extensions

The underwiting UI has less Jank than applied sciences by a long shot, but there's still some. I don't really love the as-of UI, it feels... I don't know just off. The selects are a bit janky with their combo of custom sytling and default browser behavior


## Other things I would do differently in real life

I didn't make a particularly serious attempt to find an out of the box expression processor, because I felt that part of the exercise was illustrating some of the core skill sets and understandings that go into developing a rules engine. There's a good case to be made that the entire rules engine should be based on an out of the box tool. Any attempt to build this in real life would start with at least a day or two of reasearch into the tools that already exist for this kind of functionality.



## On the use of AI

I think it's helpful to provide some context on how I did and didn't use AI, to better highlight my particular skills. 

The overal structure of the application almost all of the data modeling the routes/API layer are more or less hand coded.

The React code was 'assisted' coded. I knew what structure I wanted but heavily leveraged the AI assistant to move code around and generate markup faster than I could manually.

The styling is basically all AI guided. Styling is just too slow for a rapid iteration project like this, particularly for those of us who've largely worked in design systems.That being said, it's far from the 'default' style. I learned that Claude is pretty good at CSS, but *awful* at web design. 