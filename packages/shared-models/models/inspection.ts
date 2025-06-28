export interface EvaluationRequest {
   observations: Inspection;
   asOf?: Date;
}

export interface Inspection {
   atticVentHasScreens?: boolean;
   roofType?: RoofType;
   widownType?: WindowType;
   wildFireRiskCategory?: WildFireRiskCategory;
   vegetation?: VegetationDescription[];
}

export enum RoofType {
   ClassA = "ClassA",
   ClassB = "ClassB",
   ClassC = "ClassC",
}


export enum WindowType {
   SinglePane = "SinglePane",
   DoublePane = "DoublePane",
   TemperedGlass = "TemperedGlass",
}

export enum WildFireRiskCategory {
   A = "A",
   B = "B",
   C = "C",
   D = "D",
}

export interface VegetationDescription {
  type: VegetationType;
  distanceToWindowInFeet: number;
}

export enum VegetationType {
   Tree = "Tree",
   Shrub = "Shrub",
   Grass = "Grass",
}