export interface ASTNode<T> {
    evaluate(context: Record<string, any>): T
    toPlainObject(): Record<string, any>
}

export interface ASTNodeStatic<T> {
    fromPlainObject(obj: Record<string, any>): ASTNode<T>
}

export class ValueASTNode implements ASTNode<any> {
    constructor(public value: any) {}
    evaluate(context: Record<string, any>): any {
        return this.value
    }

    static fromPlainObject(obj: Record<string, any>): ValueASTNode {
        return new ValueASTNode(obj.value)
    }

    toPlainObject(): any {
        return {
            operator: "VALUE",
            value: this.value
        }
    }
}

export class VariableASTNode implements ASTNode<any> {
    constructor(public name: string) {}
    evaluate(context: Record<string, any>): any {
        return context[this.name]
    }

    toPlainObject(): any {
        return {
            operator: "VARIABLE",
            name: this.name
        }
    }

    static fromPlainObject(obj: Record<string, any>): VariableASTNode {
        return new VariableASTNode(obj.name)
    }
}

export class AndASTNode implements ASTNode<boolean> {
    constructor(public operands: ASTNode<boolean>[]) {}

    evaluate(context: Record<string, any>): boolean {
        for (const operand of this.operands) {
            const result = operand.evaluate(context);
            if (!result) {
                return false;
            }
        }
        return true;
    }

    toPlainObject(): any {
        return {
            operator: "AND",
            operands: this.operands.map(o => o.toPlainObject())
        }
    }

    static fromPlainObject(obj: Record<string, any>): AndASTNode {
        return new AndASTNode(obj.operands.map(hydrateASTNode))
    }
} 

export class OrASTNode implements ASTNode<boolean> {
    constructor(public operands: ASTNode<boolean>[]) {}
    evaluate(context: Record<string, any>): boolean {
        for (const operand of this.operands) {
            const result = operand.evaluate(context);
            if (result) {
                return true;
            }
        }
        return false;
    }

    toPlainObject(): any {
        return {
            operator: "OR",
            operands: this.operands.map(o => o.toPlainObject())
        }
    }

    static fromPlainObject(obj: Record<string, any>): OrASTNode {
        return new OrASTNode(obj.operands.map(hydrateASTNode))
    }
}

export class EqualsASTNode implements ASTNode<boolean> {
    constructor(public operands: ASTNode<any>[]) {}
    evaluate(context: Record<string, any>): boolean {
        if (this.operands.length < 2) {
            throw new Error("You can't have equality with less than two things")
        }
        let value = this.operands[0].evaluate(context)
        for (const operand of this.operands) {
            if (operand.evaluate(context) !== value) {
                return false
            }
        }
            
        return true
    }

    toPlainObject(): any {
        return {
            operator: "EQUALS",
            operands: this.operands.map(o => o.toPlainObject())
        }
    }

    static fromPlainObject(obj: Record<string, any>): EqualsASTNode {
        return new EqualsASTNode(obj.operands.map(hydrateASTNode))
    }
}

export const NODE_TYPES: Record<string, ASTNodeStatic<any>> = {
    "VALUE": ValueASTNode,
    "AND": AndASTNode,
    "EQUALS": EqualsASTNode,
    "OR": OrASTNode,
    "VARIABLE": VariableASTNode,
}


export const hydrateASTNode = (plainObject: Record<string, any>): ASTNode<any> => {
    const nodeType = plainObject.operator
    const nodeClass = NODE_TYPES[nodeType]
    return nodeClass.fromPlainObject(plainObject)
}

export const evaluteAst = (
    astObj: Record<string, any>,
    context: Record<string, any>
): any => {
    const node = hydrateASTNode(astObj)
    return node.evaluate(context)
}
