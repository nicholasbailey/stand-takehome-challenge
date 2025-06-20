import { DecisionRule } from "./decision-rule";
import { Mitigation, MitigationRuleModel } from "@mitigation/shared/models/mitigation-rule";
import { RuleExecutionResult } from "@mitigation/shared/models/execution-result";

export class MitigationRule {
    constructor(
        public name: string,
        public plainTextDescription: string,
        public check: DecisionRule,
        public mitigations: Mitigation[]
    ) {}

    evaluate(context: Record<string, any>): RuleExecutionResult {
        const result = this.check.evaluate(context)
        return {
            rule: this.toPlainObject(),
            passed: result,
            mitigations: !result ? this.mitigations : []
        }
    }

    toPlainObject(): MitigationRuleModel {
        return {
            name: this.name,
            description: this.plainTextDescription,
            check: this.check.toPlainObject(),
            mitigations: this.mitigations
        }
    }

    static fromPlainObject(obj: MitigationRuleModel): MitigationRule {
        return new MitigationRule(
            obj.name,
            obj.description,
            DecisionRule.fromPlainObject(obj.check),
            obj.mitigations,
        )
    }
}

