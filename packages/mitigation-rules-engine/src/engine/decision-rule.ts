import { ASTNode, hydrateASTNode } from "./ast";


type VariableSpecification = {
    name: string
    expression: ASTNode<any>
}

export class DecisionRule {
    constructor(
        public name: string,
        public condition: ASTNode<boolean>,
        public variables: VariableSpecification[]
    ) {}

    evaluate(initialContext: Record<string, any>): boolean {
        const context = { ...initialContext }
        for (const variable of this.variables) {
            const value = variable.expression.evaluate(context)
            context[variable.name] = value
        }

        const result = this.condition.evaluate(context)
        return result
    }

    toPlainObject(): Record<string, any> {
        return {
            name: this.name,
            condition: this.condition.toPlainObject(),
            variables: this.variables.map(v => ({
                name: v.name,
                expression: v.expression.toPlainObject()
            }))
        }
    }

    static fromPlainObject(obj: Record<string, any>): DecisionRule {
        return new DecisionRule(
            obj.name,
            hydrateASTNode(obj.condition),
            obj.variables.map((v: any) => ({
                name: v.name,
                expression: hydrateASTNode(v.expression)
            }))
        )
    }
}

