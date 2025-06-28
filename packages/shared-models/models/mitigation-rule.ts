export enum MitigationType {
    Full = "Full",
    Bridge = "Bridge",
}


export enum CheckType {
    MATHJS_EXPRESSION = "MATHJS_EXPRESSION",
}

export interface MathJSExpressionCheckModel {
    type: CheckType.MATHJS_EXPRESSION;
    expression: string;
}

// If we introduce other check types, add them to this union
export type CheckModel = MathJSExpressionCheckModel;

export interface Mitigation {
    type: MitigationType;
    description: string
}

export interface MitigationRuleModel {
    id?: string;
    name: string;
    description: string;
    check: CheckModel;
    mitigations: Mitigation[]
}



