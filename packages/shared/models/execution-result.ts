import { MitigationModel, MitigationRuleModel } from "./mitigation-rule";


export interface RuleExecutionResult {
    rule: MitigationRuleModel;
    passed: boolean;
    mitigations: MitigationModel[];
}

export interface ExecutionResult {
    ruleExecutions: RuleExecutionResult[];
}