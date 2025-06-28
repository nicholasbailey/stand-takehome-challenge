import { Mitigation, MitigationRuleModel } from "./mitigation-rule";



/**
 * A DecisionRule Result is a boolean result (did the rule pass or fail) and 
 * the context object which produced that result.
 */
export interface CheckResult {
    value: boolean
    context: Record<string, any>
}

export interface RuleSetExecutionResult {
    ruleExecutions: RuleExecutionResult[];
}

export interface RuleExecutionResult {
    rule: MitigationRuleModel;
    results: CheckResult[];
    mitigations: Mitigation[];
}

export interface ExecutionResult {
    ruleExecutions: RuleExecutionResult[];
}