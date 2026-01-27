"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeChecker = void 0;
class TypeChecker {
    constructor() {
        this.variables = new Map();
    }
    check(statements) {
        for (const stmt of statements) {
            this.checkStatement(stmt);
        }
    }
    checkStatement(stmt) {
        switch (stmt.kind) {
            case 'VarDecl':
                this.checkVarDecl(stmt);
                break;
            case 'Print':
                this.checkPrint(stmt);
                break;
            case 'If':
                this.checkIf(stmt);
                break;
            case 'Block':
                this.checkBlock(stmt);
                break;
            case 'ExpressionStmt':
                this.checkExpression(stmt.expression);
                break;
            default:
                const unreachable = stmt;
                throw new Error(`Unknown statement kind: ${stmt.kind}`);
        }
    }
    checkVarDecl(stmt) {
        const initializerType = this.checkExpression(stmt.initializer);
        if (initializerType !== stmt.typeAnnotation) {
            throw new Error(`Type mismatch for variable '${stmt.name}': cannot assign ${initializerType} to ${stmt.typeAnnotation}`);
        }
        if (this.variables.has(stmt.name)) {
            throw new Error(`Variable '${stmt.name}' already declared.`);
        }
        this.variables.set(stmt.name, stmt.typeAnnotation);
    }
    checkPrint(stmt) {
        this.checkExpression(stmt.expression);
    }
    checkIf(stmt) {
        const conditionType = this.checkExpression(stmt.condition);
        if (conditionType !== 'bool') {
            throw new Error(`If condition must be a boolean, got ${conditionType}`);
        }
        this.checkStatement(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.checkStatement(stmt.elseBranch);
        }
    }
    checkBlock(stmt) {
        // Basic block scope simulation: copy current scope, execute, restore (or rather discard changes for simple example)
        // NOTE: For a real language, we'd want a proper environment chain. 
        // Here we will just keep using the same map for simplicity but note that it breaks shadowing/scope-popping in a complex way.
        // For a simple single-scope/global-scope example, this is sufficient.
        for (const s of stmt.statements) {
            this.checkStatement(s);
        }
    }
    checkExpression(expr) {
        switch (expr.kind) {
            case 'Binary':
                return this.checkBinary(expr);
            case 'Literal':
                return expr.type;
            case 'Variable':
                const type = this.variables.get(expr.name);
                if (!type)
                    throw new Error(`Undefined variable '${expr.name}'`);
                return type;
            default:
                const unreachable = expr;
                throw new Error(`Unknown expression kind: ${expr.kind}`);
        }
    }
    checkBinary(expr) {
        const left = this.checkExpression(expr.left);
        const right = this.checkExpression(expr.right);
        switch (expr.operator) {
            case '+':
                if (left === 'int' && right === 'int')
                    return 'int';
                if (left === 'string' && right === 'string')
                    return 'string';
                throw new Error(`Operator '+' cannot be applied to ${left} and ${right}`);
            case '-':
            case '*':
            case '/':
                if (left === 'int' && right === 'int')
                    return 'int';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);
            case '==':
            case '!=':
                if (left !== right) {
                    throw new Error(`Cannot compare ${left} and ${right} for equality`);
                }
                return 'bool';
            default:
                throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }
}
exports.TypeChecker = TypeChecker;
