export enum MitigationType {
    Full = "Full",
    Bridge = "Bridge",
}


export interface Mitigation {
    type: MitigationType;
    description: string
}

export interface ExpressionDecisionRuleModel {
    type: 'EXPRESSION';
    condition: string;
}

export interface MitigationRuleModel {
    id?: string;
    name: string;
    description: string;
    check: ExpressionDecisionRuleModel;
    mitigations: Mitigation[]
}
