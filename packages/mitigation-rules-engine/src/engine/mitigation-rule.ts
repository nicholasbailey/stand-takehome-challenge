import { DecisionRule } from "./decision-rule";
import { MitigationModel, MitigationRuleModel } from "@mitigation/shared/models/mitigation-rule";
import { RuleExecutionResult } from "@mitigation/shared/models/execution-result";

export class MitigationRule {
    constructor(
        public name: string,
        public plainTextDescription: string,
        public rule: DecisionRule,
        public mitigations: MitigationModel[]
    ) {}

    evaluate(context: Record<string, any>): RuleExecutionResult {
        const result = this.rule.evaluate(context)
        return {
            rule: this.toPlainObject(),
            passed: result,
            mitigations: result ? this.mitigations : []
        }
    }

    toPlainObject(): MitigationRuleModel {
        return {
            name: this.name,
            plainTextDescription: this.plainTextDescription,
            rule: this.rule.toPlainObject(),
            mitigations: this.mitigations
        }
    }

    static fromPlainObject(obj: MitigationRuleModel): MitigationRule {
        return new MitigationRule(
            obj.name,
            obj.plainTextDescription,
            DecisionRule.fromPlainObject(obj.rule),
            obj.mitigations.map((m: any) => m.toPlainObject())
        )
    }
}

