import { MitigationRuleModel } from "./mitigation-rule";


export interface RuleSetModel {
    id: number | undefined;
    name: string;
    status: 'draft' | 'published';
    rules: MitigationRuleModel[];
    effectiveDate: Date;
}