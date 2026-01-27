
import {
    Statement, Expression, Type, VarDecl, BinaryExpr, IfStmt, BlockStmt,
    ExpressionStmt, UnaryExpr
} from '../common/AST';

export class TypeChecker {
    private variables: Map<string, Type> = new Map();

    check(statements: Statement[], contextTypes: Record<string, Type> = {}): void {
        // Initialize variables with context types
        this.variables = new Map(Object.entries(contextTypes));

        for (const stmt of statements) {
            this.checkStatement(stmt);
        }
    }

    private checkStatement(stmt: Statement): void {
        switch (stmt.kind) {
            case 'VarDecl':
                this.checkVarDecl(stmt as VarDecl);
                break;
            case 'If':
                this.checkIf(stmt as IfStmt);
                break;
            case 'Block':
                this.checkBlock(stmt as BlockStmt);
                break;
            case 'Assignment':
                this.checkAssignment(stmt as any); // Cast to any because we updated AST but not imported it fully yet maybe?
                break;
            case 'ExpressionStmt':
                this.checkExpression((stmt as ExpressionStmt).expression);
                break;
            default:
                const unreachable: never = stmt;
                throw new Error(`Unknown statement kind: ${(stmt as any).kind}`);
        }
    }

    private checkVarDecl(stmt: VarDecl): void {
        const initializerType = this.checkExpression(stmt.initializer);
        if (initializerType !== stmt.typeAnnotation) {
            throw new Error(`Type mismatch for variable '${stmt.name}': cannot assign ${initializerType} to ${stmt.typeAnnotation}`);
        }
        if (this.variables.has(stmt.name)) {
            throw new Error(`Variable '${stmt.name}' already declared.`);
        }
        this.variables.set(stmt.name, stmt.typeAnnotation);
    }

    private checkAssignment(stmt: any): void { // Using any for simplicity as AST interface import might need update
        const type = this.variables.get(stmt.name);
        if (!type) {
            throw new Error(`Undefined variable '${stmt.name}'.`);
        }
        const valueType = this.checkExpression(stmt.value);
        if (type !== valueType) {
            throw new Error(`Type mismatch for variable '${stmt.name}': cannot assign ${valueType} to ${type}`);
        }
    }



    private checkIf(stmt: IfStmt): void {
        const conditionType = this.checkExpression(stmt.condition);
        if (conditionType !== 'bool') {
            throw new Error(`If condition must be a boolean, got ${conditionType}`);
        }
        this.checkStatement(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.checkStatement(stmt.elseBranch);
        }
    }

    private checkBlock(stmt: BlockStmt): void {
        // Basic block scope simulation: copy current scope, execute, restore (or rather discard changes for simple example)
        // NOTE: For a real language, we'd want a proper environment chain. 
        // Here we will just keep using the same map for simplicity but note that it breaks shadowing/scope-popping in a complex way.
        // For a simple single-scope/global-scope example, this is sufficient.
        for (const s of stmt.statements) {
            this.checkStatement(s);
        }
    }

    private checkExpression(expr: Expression): Type {
        switch (expr.kind) {
            case 'Binary':
                return this.checkBinary(expr as BinaryExpr);
            case 'Unary':
                return this.checkUnary(expr as UnaryExpr);
            case 'Literal':
                return expr.type;
            case 'Variable':
                const type = this.variables.get(expr.name);
                if (!type) throw new Error(`Undefined variable '${expr.name}'`);
                return type;
            default:
                const unreachable: never = expr;
                throw new Error(`Unknown expression kind: ${(expr as any).kind}`);
        }
    }

    private checkUnary(expr: UnaryExpr): Type {
        const right = this.checkExpression(expr.right);
        switch (expr.operator) {
            case '!':
                if (right !== 'bool') throw new Error(`Operator '!' can only be applied to boolean, got ${right}`);
                return 'bool';
            case '-':
                if (right !== 'int') throw new Error(`Operator '-' can only be applied to integer, got ${right}`);
                return 'int';
            default:
                throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }

    private checkBinary(expr: BinaryExpr): Type {
        const left = this.checkExpression(expr.left);
        const right = this.checkExpression(expr.right);

        switch (expr.operator) {
            case '+':
                if (left === 'int' && right === 'int') return 'int';
                if (left === 'string' && right === 'string') return 'string';
                throw new Error(`Operator '+' cannot be applied to ${left} and ${right}`);

            case '-':
            case '*':
            case '/':
                if (left === 'int' && right === 'int') return 'int';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            case '==':
            case '!=':
                if (left !== right) {
                    throw new Error(`Cannot compare ${left} and ${right} for equality`);
                }
                return 'bool';

            case '>':
            case '>=':
            case '<':
            case '<=':
                if (left === 'int' && right === 'int') return 'bool';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            case '&&':
            case '||':
                if (left === 'bool' && right === 'bool') return 'bool';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            default:
                throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }
}
