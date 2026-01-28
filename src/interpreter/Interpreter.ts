
import {
    Statement, Expression, VarDecl, BinaryExpr, IfStmt, BlockStmt,
    ExpressionStmt, UnaryExpr, CallExpr, LambdaExpr, MemberExpr, ObjectExpr
} from '../common/AST';
import { RuntimeError } from '../common/Errors';

/**
 * The Runtime Interpreter for the Axiom Language.
 * It walks the AST and executes the logic using the provided context.
 */
export class Interpreter {
    private environment: Map<string, any> = new Map();

    /**
     * Executes a list of statements against a data context.
     * @param statements The AST.
     * @param context The input data object (variables).
     * @returns The last evaluated value (implicit return).
     */
    interpret(statements: Statement[], context: Record<string, any> = {}): any {
        this.environment = new Map(Object.entries(context));

        let lastValue: any = null;
        for (const stmt of statements) {
            lastValue = this.execute(stmt);
        }
        return lastValue;
    }

    /**
     * Dispatches execution to the specific handler based on statement kind.
     * @param stmt The statement to execute.
     * @returns The result of the statement (if any), or null.
     */
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

    /**
     * Updates an existing variable in the current scope.
     * @param stmt The assignment statement.
     * @throws {RuntimeError} If variable is not defined.
     */
    private executeAssignment(stmt: any): void {
        const value = this.evaluate(stmt.value);
        if (!this.environment.has(stmt.name)) {
            throw new RuntimeError(`Undefined variable '${stmt.name}'.`);
        }
        this.environment.set(stmt.name, value);
    }

    /**
     * Declares a new variable in the current scope and initializes it.
     * @param stmt The declaration statement.
     */
    private executeVarDecl(stmt: VarDecl): void {
        const value = this.evaluate(stmt.initializer);
        this.environment.set(stmt.name, value);
    }

    /**
     * Executes conditional logic.
     * @param stmt The If statement.
     * @returns The result of the executed branch (if any).
     */
    private executeIf(stmt: IfStmt): any {
        const condition = this.evaluate(stmt.condition);
        if (condition) {
            return this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            return this.execute(stmt.elseBranch);
        }
        return null;
    }

    /**
     * Executes a block of statements.
     * @param stmt The block statement.
     * @returns The result of the last executed statement in the block.
     */
    private executeBlock(stmt: BlockStmt): any {
        // In a real implementation, we would create a new environment for scope.
        let lastValue: any = null;
        for (const s of stmt.statements) {
            lastValue = this.execute(s);
        }
        return lastValue;
    }

    /**
     * Evaluates an expression to a value.
     * @param expr The expression to evaluate.
     * @returns The computed value (primitive, object, or list).
     */
    private evaluate(expr: Expression): any {
        switch (expr.kind) {
            case 'Literal':
                return expr.value;
            case 'Variable':
                return this.environment.get(expr.name);
            case 'Binary':
                return this.evaluateBinary(expr as BinaryExpr);
            case 'Unary':
                return this.evaluateUnary(expr as UnaryExpr);
            case 'Member':
                return this.evaluateMember(expr as any);
            case 'List':
                return this.evaluateList(expr as any);
            case 'List':
                return this.evaluateList(expr as any);
            case 'Call':
                return this.evaluateCall(expr as CallExpr);
            case 'Object':
                return this.evaluateObject(expr as ObjectExpr);
            default:
                throw new Error(`Unknown expression kind: ${expr}`);
        }
    }

    /**
     * Handles function calls, including Macros (has, exists, all) and Global functions.
     * @param expr The call expression.
     */
    private evaluateCall(expr: CallExpr): any {
        // 1. 'has' macro
        if (expr.callee.kind === 'Variable' && (expr.callee as any).name === 'has') {
            const arg = expr.arguments[0];
            try {
                this.evaluate(arg);
                return true;
            } catch (e) {
                return false;
            }
        }

        // 2. List macros
        if (expr.callee.kind === 'Member') {
            const member = expr.callee as MemberExpr;
            const method = member.property;

            if (method === 'exists' || method === 'all') {
                const list = this.evaluate(member.object);
                if (!Array.isArray(list)) throw new Error("Macro called on non-list.");

                const lambda = expr.arguments[0] as LambdaExpr;
                const paramName = lambda.parameter;

                const previousValue = this.environment.get(paramName);
                const hasPrevious = this.environment.has(paramName);

                try {
                    if (method === 'exists') {
                        for (const item of list) {
                            this.environment.set(paramName, item);
                            const result = this.evaluate(lambda.body);
                            if (result === true) return true;
                        }
                        return false;
                    }
                    if (method === 'all') {
                        for (const item of list) {
                            this.environment.set(paramName, item);
                            const result = this.evaluate(lambda.body);
                            if (result === false) return false;
                        }
                        return true;
                    }
                } finally {
                    // Restore environment
                    if (hasPrevious) {
                        this.environment.set(paramName, previousValue);
                    } else {
                        this.environment.delete(paramName);
                    }
                }
            }
        }

        // 3. String & Date Functions (Global)
        if (expr.callee.kind === 'Variable') {
            const funcName = (expr.callee as any).name;
            const args = expr.arguments.map(a => this.evaluate(a));

            switch (funcName) {
                // String Functions
                case 'startsWith':
                    return String(args[0]).startsWith(String(args[1]));
                case 'endsWith':
                    return String(args[0]).endsWith(String(args[1]));
                case 'contains':
                    return String(args[0]).includes(String(args[1]));
                case 'length':
                    return String(args[0]).length;

                // Date Functions
                case 'timestamp':
                    const date = new Date(args[0]);
                    if (isNaN(date.getTime())) throw new Error(`Invalid date string: ${args[0]}`);
                    return date;
            }
        }

        throw new Error(`Unknown function call or macro: ${(expr.callee as any).name || 'expression'}`);
    }

    /**
     * Helper for comparing numbers or dates.
     */
    private evaluateComparison(left: any, right: any, comparator: (a: any, b: any) => boolean): boolean {
        if (typeof left === 'number' && typeof right === 'number') {
            return comparator(left, right);
        }
        if (left instanceof Date && right instanceof Date) {
            return comparator(left.getTime(), right.getTime());
        }
        throw new Error(`Cannot compare ${left} and ${right}`);
    }

    private evaluateList(expr: { elements: Expression[] }): any[] {
        return expr.elements.map(e => this.evaluate(e));
    }

    /**
     * Resolves value of a member access (dot notation).
     */
    private evaluateMember(expr: { object: Expression, property: string }): any {
        const object = this.evaluate(expr.object);
        if (typeof object !== 'object' || object === null) {
            throw new Error(`Only objects have properties. Got ${object}`);
        }
        if (!(expr.property in object)) {
            // In a strict language, we might error. In JS hosts, it might be undefined.
            // Let's error to be safe.
            throw new Error(`Property '${expr.property}' does not exist on object.`);
        }
        return object[expr.property];
    }

    /**
     * Constructs a new object from properties.
     */
    private evaluateObject(expr: ObjectExpr): any {
        const obj: any = {};
        for (const prop of expr.properties) {
            obj[prop.key] = this.evaluate(prop.value);
        }
        return obj;
    }

    /**
     * Evaluates unary operations (!, -).
     */
    private evaluateUnary(expr: UnaryExpr): any {
        const right = this.evaluate(expr.right);
        switch (expr.operator) {
            case '!': return !right;
            case '-': return -right;
            default: throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }

    /**
     * Evaluates binary operations (+, -, *, /, &&, ||, comparisons).
     */
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
            case '>': return this.evaluateComparison(left, right, (a, b) => a > b);
            case '>=': return this.evaluateComparison(left, right, (a, b) => a >= b);
            case '<': return this.evaluateComparison(left, right, (a, b) => a < b);
            case '<=': return this.evaluateComparison(left, right, (a, b) => a <= b);
            case '&&': return left && right;
            case '||': return left || right;
            case 'in': return right.includes(left);
            default: throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }
}
