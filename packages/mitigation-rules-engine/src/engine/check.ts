import { EvalFunction } from 'mathjs';
import math from './mathjs-extended'
import { CheckResult } from '@mitigation/shared-models/models/execution-result';
import { CheckModel, CheckType } from '@mitigation/shared-models/models/mitigation-rule';


/**
 * A Check encapsulates the evaluation of a rule that passes or fails
 * for some provided context object.
 */
export interface Check  {
    /**
     * Execute the rule against a given context object.
     */
    evaluate(context: any): CheckResult[];

    /**
     * Serialize the rule to a plain javascript object that can be stored as JSON
     */
    toPlainObject(): CheckModel;
}

export interface CheckStatic {
    fromPlainObject(obj: Record<string, any>): Check
}

function isCheckResult(result: any): result is CheckResult {
    return typeof result === 'object' && 'value' in result && 'context' in result
}

function isResultArray(result: any): result is CheckResult[] {
    return Array.isArray(result) && result.every((item: any) => typeof item === 'object' && 'value' in item && 'context' in item)
}


/**
 * A Check that leverages a math.js expression to encode the rule logic.
 */
export class MathJSExpressionCheck implements Check {
    static type = CheckType.MATHJS_EXPRESSION

    private compiledExpression: EvalFunction
    constructor(
        public expression: string,
    ) {
        this.compiledExpression = math.compile(expression)
    }

    evaluate(context: Record<string, any>): CheckResult[] {
        const result = this.compiledExpression.evaluate(context)

        // This little bit of slightly janky code is to make it a bit easier for 
        // our team to write rules. We need to support rules both that evaluate on the top
        // level context object (`atticHasScreens == true`) and also rules that evaluate on
        // each item in an array (`each(vegetation, f(x) = x.type === "grass" && windowType == "SinglePane")`).
        //
        // We also, when iterating over arrays, want to track the context of the object we are working with so
        // that users can see in the UI exactly which item in the array caused the rule to pass or fail.
        //
        // We don't want our applied sciences users to have to think too much about this. So we just make the function
        // flexible enough to handle rules that return a boolean, an array of DecisionResults (boolean + context)
        //
        if (typeof(result) === 'object' && result.hasOwnProperty('data') &&  isResultArray(result.data)) {
            return result.data            
        } else if (isResultArray(result)) {
            return result
        } else if (typeof result === 'boolean') {
            return [{
                value: result,
                context: context
            }]
        } else if (isCheckResult(result)) {
            return [result]
        } else {
            throw new Error(`Expression for evaluation rule ${this.expression} does not return a boolean or an array of booleans`)
        }
    }

    toPlainObject(): CheckModel {
        // We could serialize
        return {
            type: MathJSExpressionCheck.type,
            expression: this.expression
        }
    }

    static fromPlainObject(obj: Record<string, any>): MathJSExpressionCheck {
        return new MathJSExpressionCheck(obj.expression)
    }
}

export const decisionRuleFromPlainObject = (obj: Record<string, any>): Check => {
    switch (obj.type) {
        case MathJSExpressionCheck.type:
            return MathJSExpressionCheck.fromPlainObject(obj)
        default:
            throw new Error(`Unknown decision rule type: ${obj.type}`)
    }
}