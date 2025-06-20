import { MitigationRuleModel } from "./mitigation-rule";


// In future this should probably be split into read and create models as there
// are a number of fields not on a model for creation that are on read models
export interface RuleSetVersion {
    id?: number | undefined;
    ruleSetId?: number;
    ruleSetName?: string | undefined;
    isMain?: boolean | undefined;
    rules: MitigationRuleModel[];
    effectiveDate: Date;
}