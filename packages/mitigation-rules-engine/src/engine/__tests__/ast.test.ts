import { ValueASTNode, hydrateASTNode } from '../ast';


describe("AST Integration Tests", () => {
  it("should evaluate 1 == 2 to false", () => {
    const expression = {
      operator: "EQUALS",
      operands: [
        { operator: "VALUE", value: 1 },
        { operator: "VALUE", value: 2 }
      ]
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({})
    expect(result).toBe(false)
  })

  it("should evaluate 1 == 1 to true", () => {
    const expression = {
      operator: "EQUALS",
      operands: [
        { operator: "VALUE", value: 1 },
        { operator: "VALUE", value: 1 }
      ]
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({})
    expect(result).toBe(true)
  })

  it("should evaluate 1 == 1 && 2 == 2 to true", () => {
    const expression = {
      operator: "AND",
      operands: [
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 1 }, { operator: "VALUE", value: 1 }] },
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 2 }, { operator: "VALUE", value: 2 }] }
      ]
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({})
    expect(result).toBe(true)
  })

  it("should evaluate 1 == 1 && 2 == 3 to false", () => {
    const expression = {
      operator: "AND",
      operands: [
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 1 }, { operator: "VALUE", value: 1 }] },
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 2 }, { operator: "VALUE", value: 3 }] }
      ]
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({})
    expect(result).toBe(false)
  })

  it("should evaluate 1 == 1 || 2 == 3 to true", () => {
    const expression = {
      operator: "OR",
      operands: [
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 1 }, { operator: "VALUE", value: 1 }] },
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 2 }, { operator: "VALUE", value: 3 }] }
      ]
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({})
    expect(result).toBe(true)
  })

  it("should evaluate 1 == 2 || 2 == 3 to false", () => {
    const expression = {
      operator: "OR",
      operands: [
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 1 }, { operator: "VALUE", value: 2 }] },
        { operator: "EQUALS", operands: [{ operator: "VALUE", value: 2 }, { operator: "VALUE", value: 3 }] }
      ]
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({})
    expect(result).toBe(false)
  })
  
  it("should resolve a variable value", () => {
    const expression = {
      operator: "VARIABLE",
      name: "a"
    }

    const node = hydrateASTNode(expression)
    const result = node.evaluate({ a: 1 })
    expect(result).toBe(1)
  })
})
