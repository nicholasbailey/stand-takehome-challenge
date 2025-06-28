
/**
 * Extends math.js with functionality better suited for our use case.
 */
import {create, all} from 'mathjs';

const math = create(all);

// Math.js has unusual behavior for equality comparisons. The default == operator only functions on numbers,
// and will attempt to coerce strings to numbers. In our use case we want to compare strings as strings.
// This is a mechanism suggested by the maintianers as a way to override the default equality comparison behavior.
math.import({
    'equal': function (a: any, b: any) {
        return a === b;
    }
}, {override: true});

export default math;

// We handle evaluating rules per item via an extension to the expression language.
// To understand why, let's outline an example.

// We want to be able to apply a rule for each item of vegetation on the property, where
// we look at its type and the window type and determine if the vegetation is a fire risk.
// In math.js that would look like 'map(vegetation, f(x) = x.type === "grass" && windowType == "SinglePane")'
// This returns an array of booleans. That's all well and good. But it's just a bare array.
// An end user is going to want to know *which* particular pieces of vegetation are a fire risk.
// To do that well, we need to return not just an array of booleans, but each boolean along with the 
// context of the item that produced that boolean.
//
// Fortunately, math.js allows custom function definitions.

math.import({
    // Untyped function is an anti-pattern, would take time to properly type the callback normally
    'each': function (array: any[], callback: Function) {
        return array.map((item, index) => {
            const value = callback(item)
            return {
                value,
                context: item
            }
        })
    }
})