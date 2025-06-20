import { Mitigation, MitigationRuleModel } from "./mitigation-rule";


export interface RuleSetExecutionResult {
    ruleExecutions: RuleExecutionResult[];
}

export interface RuleExecutionResult {
    rule: MitigationRuleModel;
    passed: boolean;
    mitigations: Mitigation[];
}

export interface ExecutionResult {
    ruleExecutions: RuleExecutionResult[];
}