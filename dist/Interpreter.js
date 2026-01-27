"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
class Interpreter {
    constructor() {
        this.environment = new Map();
    }
    interpret(statements) {
        for (const stmt of statements) {
            this.execute(stmt);
        }
    }
    execute(stmt) {
        switch (stmt.kind) {
            case 'VarDecl':
                this.executeVarDecl(stmt);
                break;
            case 'Print':
                // print(this.evaluate((stmt as PrintStmt).expression));
                console.log(this.evaluate(stmt.expression));
                break;
            case 'If':
                this.executeIf(stmt);
                break;
            case 'Block':
                this.executeBlock(stmt);
                break;
            case 'ExpressionStmt':
                this.evaluate(stmt.expression);
                break;
        }
    }
    executeVarDecl(stmt) {
        const value = this.evaluate(stmt.initializer);
        this.environment.set(stmt.name, value);
    }
    executeIf(stmt) {
        const condition = this.evaluate(stmt.condition);
        if (condition) {
            this.execute(stmt.thenBranch);
        }
        else if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }
    }
    executeBlock(stmt) {
        // In a real implementation, we would create a new environment for scope.
        for (const s of stmt.statements) {
            this.execute(s);
        }
    }
    evaluate(expr) {
        switch (expr.kind) {
            case 'Literal':
                return expr.value;
            case 'Variable':
                return this.environment.get(expr.name);
            case 'Binary':
                return this.evaluateBinary(expr);
            default:
                throw new Error(`Unknown expression kind: ${expr}`);
        }
    }
    evaluateBinary(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '==': return left === right;
            case '!=': return left !== right;
            default: throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }
}
exports.Interpreter = Interpreter;
