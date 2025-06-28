import { Mitigation, MitigationRuleModel } from "@mitigation/shared-models/models/mitigation-rule";
import {RuleExecutionResult } from "@mitigation/shared-models/models/execution-result";
import { Check, decisionRuleFromPlainObject } from "./check";

export class MitigationRule {
    constructor(
        public name: string,
        public plainTextDescription: string,
        public check: Check,
        public mitigations: Mitigation[]
    ) {}

    async evaluate(context: Record<string, any>): Promise<RuleExecutionResult> {
        const results = await this.check.evaluate(context);
        const anyFailed = results.some(item => !item.value);
        return {
            rule: this.toPlainObject(),
            results: results,
            mitigations: anyFailed ? this.mitigations : []
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
            decisionRuleFromPlainObject(obj.check),
            obj.mitigations,
        )
    }
}

