import { ExpressionDecisionRuleModel } from '@mitigation/shared/models/mitigation-rule';
import { Inspection } from '@mitigation/shared/models/inspection';
import { Parser } from 'expr-eval';

export class ExpressionDecisionRule {
    private parser = new Parser();

    constructor(public rule: ExpressionDecisionRuleModel) {
        try {
            this.parser.parse(rule.condition);
        } catch (error) {
            throw new Error(`Invalid expression: ${rule.condition}. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async evaluate(context: Inspection): Promise<Array<{ contextItem: any; result: boolean }>> {
        try {
            const expr = this.parser.parse(this.rule.condition);
            const result = expr.evaluate(context as any);
            
            if (Array.isArray(result) && result.every(r => typeof r === 'boolean')) {
                return this.pairBooleanResultsWithContext(result, context);
            }
            
            return [{ contextItem: context, result: Boolean(result) }];
            
        } catch (error) {
            console.error('Expression evaluation error:', error);
            throw new Error(`Failed to evaluate expression: ${this.rule.condition}`);
        }
    }

    private pairBooleanResultsWithContext(results: boolean[], context: Inspection): Array<{ contextItem: any; result: boolean }> {
        const contextArrays = this.findArraysInContext(context);
        const matchingArray = contextArrays.find(arr => arr.length === results.length);
        
        if (matchingArray) {
            return results.map((result, index) => ({
                contextItem: matchingArray[index],
                result
            }));
        }
        
        return results.map((result, index) => ({
            contextItem: { index },
            result
        }));
    }

    private findArraysInContext(obj: any, arrays: any[] = []): any[][] {
        if (Array.isArray(obj)) {
            arrays.push(obj);
        } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(value => {
                this.findArraysInContext(value, arrays);
            });
        }
        return arrays;
    }
}