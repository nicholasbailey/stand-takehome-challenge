import { MathJSExpressionCheck } from "../check";
import { MitigationRule } from "../mitigation-rule";


describe("Executing various mitgation rules", () => {
    it("Should execute the vegetation rule", async () => {
        const rule = new MitigationRule(
            "Vegetation Rule",
            "Vegetation Rule", 
            new MathJSExpressionCheck("each(vegetation, f(x) = x.type == 'Grass')"), 
            []);

        const result = await rule.evaluate({
            vegetation: [
                { type: "Grass", distanceToWindowInFeet: 10 },
                { type: "Tree", distanceToWindowInFeet: 20 },
            ]
        });

        expect(result.results).toBe([
            {
                value: true,
                context: { type: "Grass", distanceToWindowInFeet: 10 }
            },
            {
                value: false,
                context: { type: "Tree", distanceToWindowInFeet: 20 }
            }
        ]);
    })
})