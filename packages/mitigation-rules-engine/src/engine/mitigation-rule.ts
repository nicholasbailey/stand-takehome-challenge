import { ExpressionDecisionRule } from "./expression-decision-rule";
import { Mitigation, MitigationRuleModel } from "@mitigation/shared/models/mitigation-rule";
import { RuleExecutionResult } from "@mitigation/shared/models/execution-result";

export class MitigationRule {
    constructor(
        public name: string,
        public plainTextDescription: string,
        public check: ExpressionDecisionRule,
        public mitigations: Mitigation[]
    ) {}

    async evaluate(context: Record<string, any>): Promise<RuleExecutionResult> {
        const results = await this.check.evaluate(context);
        const shouldApplyMitigations = this.shouldApplyMitigations(results);
        
        return {
            rule: this.toPlainObject(),
            results: results,
            mitigations: shouldApplyMitigations ? this.mitigations : []
        }
    }

    private shouldApplyMitigations(results: Array<{ contextItem: any; result: boolean }>): boolean {
        // Apply mitigations if any result is false
        return results.some(item => !item.result);
    }

    toPlainObject(): MitigationRuleModel {
        return {
            name: this.name,
            description: this.plainTextDescription,
            check: {
                type: 'EXPRESSION',
                condition: this.check.rule.condition
            },
            mitigations: this.mitigations
        }
    }

    static fromPlainObject(obj: MitigationRuleModel): MitigationRule {
        return new MitigationRule(
            obj.name,
            obj.description,
            new ExpressionDecisionRule(obj.check),
            obj.mitigations,
        )
    }
}

