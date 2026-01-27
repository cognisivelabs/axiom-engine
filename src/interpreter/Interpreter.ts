
import {
    Statement, Expression, VarDecl, BinaryExpr, IfStmt, BlockStmt,
    ExpressionStmt
} from '../common/AST';

export class Interpreter {
    private environment: Map<string, any> = new Map();

    interpret(statements: Statement[], context: Record<string, any> = {}): any {
        this.environment = new Map(Object.entries(context));

        let lastValue: any = null;
        for (const stmt of statements) {
            lastValue = this.execute(stmt);
        }
        return lastValue;
    }

    private execute(stmt: Statement): any {
        switch (stmt.kind) {
            case 'VarDecl':
                this.executeVarDecl(stmt as VarDecl);
                return null;
            case 'Assignment':
                this.executeAssignment(stmt as any);
                return null;
            case 'If':
                return this.executeIf(stmt as IfStmt);
            case 'Block':
                return this.executeBlock(stmt as BlockStmt);
            case 'ExpressionStmt':
                return this.evaluate((stmt as ExpressionStmt).expression);
            default:
                const unreachable: never = stmt;
                throw new Error(`Unknown statement kind: ${(stmt as any).kind}`);
        }
    }

    private executeAssignment(stmt: any): void {
        const value = this.evaluate(stmt.value);
        if (!this.environment.has(stmt.name)) {
            throw new Error(`Undefined variable '${stmt.name}'.`);
        }
        this.environment.set(stmt.name, value);
    }

    private executeVarDecl(stmt: VarDecl): void {
        const value = this.evaluate(stmt.initializer);
        this.environment.set(stmt.name, value);
    }

    private executeIf(stmt: IfStmt): any {
        const condition = this.evaluate(stmt.condition);
        if (condition) {
            return this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            return this.execute(stmt.elseBranch);
        }
        return null;
    }

    private executeBlock(stmt: BlockStmt): any {
        // In a real implementation, we would create a new environment for scope.
        let lastValue: any = null;
        for (const s of stmt.statements) {
            lastValue = this.execute(s);
        }
        return lastValue;
    }

    private evaluate(expr: Expression): any {
        switch (expr.kind) {
            case 'Literal':
                return expr.value;
            case 'Variable':
                return this.environment.get(expr.name);
            case 'Binary':
                return this.evaluateBinary(expr as BinaryExpr);
            default:
                throw new Error(`Unknown expression kind: ${expr}`);
        }
    }

    private evaluateBinary(expr: BinaryExpr): any {
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
