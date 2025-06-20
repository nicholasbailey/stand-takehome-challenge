
export enum MitigationType {
    Full = "Full",
    Bridge = "Bridge",
}


export interface MitigationModel {
    type: MitigationType;
    description: string
}

export class MitigationRuleModel {
    name: string;
    plainTextDescription: string;
    rule: any
    mitigations: MitigationModel[]
}
