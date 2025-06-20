
export enum MitigationType {
    Full = "Full",
    Bridge = "Bridge",
}


export interface Mitigation {
    type: MitigationType;
    description: string
}

export interface MitigationRuleModel {
    id?: string | undefined;
    name: string;
    description: string;
    check: any
    mitigations: Mitigation[]
}
