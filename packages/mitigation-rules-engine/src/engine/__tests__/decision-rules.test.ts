import { DecisionRule } from "../decision-rule"

describe("Rule integration tests", () => {
  it("should evaluate a simple rule", () => {
    const ruleSpecification = {
        condition: {
            operator: "OR",
            operands: [
                {
                    operator: "AND",
                    operands: [
                        {
                            operator: "EQUALS",
                            operands: [
                                {
                                    operator: "VARIABLE",
                                    name: "roofType"
                                },
                                {
                                    operator: "VALUE",
                                    value: "ClassB"
                                }
                            ]
                        },
                        {
                            operator: "EQUALS",
                            operands: [
                                {
                                    operator: "VARIABLE",
                                    name: "wildFireRisk"
                                },
                                {
                                    operator: "VALUE",
                                    value: "A"
                                }
                            ]
                        }
                    ]
                },
                {
                    operator: "EQUALS",
                    operands: [
                        {
                            operator: "VARIABLE",
                            name: "roofType"
                        },
                        {
                            operator: "VALUE",
                            value: "ClassA"
                        }
                    ]
                }
            ]
        },
        variables: []
    }

    const rule = DecisionRule.fromPlainObject(ruleSpecification)

    const result = rule.evaluate({
        roofType: "ClassB",
        wildFireRisk: "A"
    })

    expect(result).toBe(true)

    const result2 = rule.evaluate({
        roofType: "ClassA",
        wildFireRisk: "C"
    })

    expect(result2).toBe(true)

    const result3 = rule.evaluate({
        roofType: "ClassC",
        wildFireRisk: "A"
    })

    expect(result3).toBe(false)
  })
})