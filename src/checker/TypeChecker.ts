
import {
    Statement, Expression, Type, VarDecl, BinaryExpr, IfStmt, BlockStmt,
    ExpressionStmt, UnaryExpr, CallExpr, MemberExpr, LambdaExpr, ObjectExpr
} from '../common/AST';
import { ContractDef } from '../common/Contract';
import { AxiomError, TypeError as AxiomTypeError } from '../common/Errors';

/**
 * The TypeChecker verifies that the AST allows matches the defined Data Contract.
 * It ensures variable existence, type compatibility, and correct function usage.
 */
export class TypeChecker {
    private variables: Map<string, Type> = new Map();
    private filename?: string;

    /**
     * Converts a JSON schema definition into an internal Axiom Type.
     * Supports primitives ('int', 'string'), arrays ('int[]'), and nested objects.
     */
    static validateType(def: any): Type {
        // 1. Primitive Strings and Array Logic
        if (typeof def === 'string') {
            const primitives = ['int', 'string', 'bool', 'date', 'money'];

            // Check for array syntax "int[]"
            if (def.endsWith('[]')) {
                const base = def.substring(0, def.length - 2);
                if (!primitives.includes(base)) {
                    throw new Error(`Unknown type in array definition: '${base}'. Supported: ${primitives.join(', ')}`);
                }
                return { kind: 'list', elementType: base as Type };
            }

            if (primitives.includes(def)) {
                return def as Type;
            }
            throw new Error(`Unknown type: '${def}'. Supported: ${primitives.join(', ')}`);
        }

        // 2. Struct Definitions (User-Friendly List Syntax: [ { ... } ])
        if (Array.isArray(def)) {
            if (def.length !== 1) {
                throw new Error("List definition must have exactly one element specifying the type, e.g. [ 'int' ] or [ { ... } ]");
            }
            return { kind: 'list', elementType: this.validateType(def[0]) };
        }

        // 3. Object Definitions
        if (typeof def === 'object' && def !== null) {
            const properties: Record<string, Type> = {};
            for (const [key, value] of Object.entries(def)) {
                properties[key] = this.validateType(value);
            }
            return { kind: 'object', properties };
        }

        throw new Error(`Invalid type definition: ${JSON.stringify(def)}`);
    }

    /**
     * Validates the entire script against the contract.
     * Ensures all variable usages are valid and the return value matches the output contract.
     */
    check(statements: Statement[], contract: ContractDef, filename?: string): void {
        // 1. Initialize variables with Input contract (Context)
        this.variables = new Map(Object.entries(contract.inputs));
        this.filename = filename;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            this.checkStatement(stmt);

            // 2. Output Contract Validation (Return Type)
            // Check if this is the last statement
            if (i === statements.length - 1) {
                // If we have output contracts, we expect an expression statement
                if (contract.outputs) {
                    if (stmt.kind !== 'ExpressionStmt') {
                        throw new AxiomTypeError(`Contract expects outputs but script does not end with an expression.`, filename);
                    }
                    const lastExprType = this.checkExpression(stmt.expression);

                    const expectedReturnType: Type = contract.outputs;

                    if (!this.areTypesEqual(expectedReturnType, lastExprType)) {
                        this.validateObjectMatch(expectedReturnType, lastExprType, filename);
                    }
                }
            }
        }
    }

    /**
     * Recursive helper to validate that actual return type matches expected structure.
     */
    private validateObjectMatch(expected: Type, actual: Type, filename?: string): void {
        if (typeof expected === 'object' && expected.kind === 'object' &&
            typeof actual === 'object' && actual.kind === 'object') {

            for (const key of Object.keys(expected.properties)) {
                const expectedProp = expected.properties[key];
                const actualProp = actual.properties[key];

                if (!actualProp) {
                    throw new AxiomTypeError(`Return type mismatch: Contract requires property '${key}' of type ${JSON.stringify(expectedProp)}, but Rule result is missing it.`, filename);
                }
                if (!this.areTypesEqual(expectedProp, actualProp)) {
                    throw new AxiomTypeError(`Return type mismatch at property '${key}': Contract expects ${JSON.stringify(expectedProp)}, but Rule returns ${JSON.stringify(actualProp)}`, filename);
                }
            }
        } else {
            throw new AxiomTypeError(`Return type mismatch: Contract expects ${JSON.stringify(expected)}, but Rule returns ${JSON.stringify(actual)}`, filename);
        }
    }

    /**
     * Dispatches statement validation based on kind.
     */
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
                this.checkAssignment(stmt as any);
                break;
            case 'ExpressionStmt':
                this.checkExpression((stmt as ExpressionStmt).expression);
                break;
            default:
                const unreachable: never = stmt;
                throw new Error(`Unknown statement kind: ${(stmt as any).kind}`);
        }
    }

    /**
     * Validates variable declaration type consistency and uniqueness.
     */
    private checkVarDecl(stmt: VarDecl): void {
        const initializerType = this.checkExpression(stmt.initializer);
        if (!this.areTypesEqual(initializerType, stmt.typeAnnotation)) {
            throw new AxiomTypeError(`Type mismatch for variable '${stmt.name}': cannot assign ${JSON.stringify(initializerType)} to ${JSON.stringify(stmt.typeAnnotation)}`, this.filename);
        }
        if (this.variables.has(stmt.name)) {
            throw new AxiomTypeError(`Variable '${stmt.name}' already declared.`, this.filename);
        }
        this.variables.set(stmt.name, stmt.typeAnnotation);
    }

    /**
     * Validates assignment to ensure variable exists and type matches.
     */
    private checkAssignment(stmt: any): void {
        const type = this.variables.get(stmt.name);
        if (!type) {
            throw new AxiomTypeError(`Undefined variable '${stmt.name}'.`, this.filename);
        }
        const valueType = this.checkExpression(stmt.value);
        if (!this.areTypesEqual(type, valueType)) {
            throw new AxiomTypeError(`Type mismatch for variable '${stmt.name}': cannot assign ${JSON.stringify(valueType)} to ${JSON.stringify(type)}`, this.filename);
        }
    }

    /**
     * Validates If statement condition (must be bool) and branches.
     */
    private checkIf(stmt: IfStmt): void {
        const conditionType = this.checkExpression(stmt.condition);
        if (conditionType !== 'bool') {
            throw new AxiomTypeError(`If condition must be a boolean, got ${conditionType}`, this.filename);
        }
        this.checkStatement(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.checkStatement(stmt.elseBranch);
        }
    }

    /**
     * Validates a block of statements.
     */
    private checkBlock(stmt: BlockStmt): void {
        for (const s of stmt.statements) {
            this.checkStatement(s);
        }
    }

    /**
     * Infers the type of an expression.
     */
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
                if (!type) throw new AxiomTypeError(`Undefined variable '${expr.name}'`, this.filename);
                return type;
            case 'Member':
                return this.checkMember(expr as any);
            case 'List':
                return this.checkList(expr as any);
            case 'Call':
                return this.checkCall(expr as CallExpr);
            case 'Lambda':
                throw new Error("Lambdas are only allowed as arguments to macros.");
            case 'Object':
                return this.checkObject(expr as ObjectExpr);
            default:
                const unreachable: never = expr;
                throw new Error(`Unknown expression kind: ${(expr as any).kind}`);
        }
    }

    /**
     * Validates function calls and macro usage.
     */
    private checkCall(expr: CallExpr): Type {
        // 1. Check for 'has' macro: has(expr)
        if (expr.callee.kind === 'Variable' && (expr.callee as any).name === 'has') {
            if (expr.arguments.length !== 1) throw new Error("Macro 'has' expects exactly 1 argument.");
            const arg = expr.arguments[0];
            if (arg.kind !== 'Member') throw new Error("Macro 'has' expects a property access (e.g. has(user.name)).");
            this.checkHasArg(arg as MemberExpr);
            return 'bool';
        }

        // 2. Check for list macros: list.exists, list.all
        if (expr.callee.kind === 'Member') {
            const member = expr.callee as MemberExpr;
            const method = member.property;

            if (method === 'exists' || method === 'all') {
                const listType = this.checkExpression(member.object);
                if (typeof listType === 'string' || listType.kind !== 'list') {
                    throw new Error(`Macro '${method}' can only be used on lists.`);
                }

                if (expr.arguments.length !== 1 || expr.arguments[0].kind !== 'Lambda') {
                    throw new Error(`Macro '${method}' expects a lambda argument.`);
                }

                const lambda = expr.arguments[0] as LambdaExpr;

                // Add parameter to scope
                if (this.variables.has(lambda.parameter)) throw new Error(`Variable '${lambda.parameter}' shadows existing variable.`);
                this.variables.set(lambda.parameter, listType.elementType);

                // Check body
                const bodyType = this.checkExpression(lambda.body);

                // Remove parameter from scope
                this.variables.delete(lambda.parameter);

                if (bodyType !== 'bool') {
                    throw new Error(`Macro '${method}' predicate must return boolean.`);
                }
                return 'bool';
            }
        }

        // 3. Global Functions
        if (expr.callee.kind === 'Variable') {
            const funcName = (expr.callee as any).name;
            switch (funcName) {
                // String Functions
                case 'startsWith':
                case 'endsWith':
                case 'contains':
                    this.checkArgCount(expr, 2, funcName);
                    this.checkArgType(expr, 0, 'string');
                    this.checkArgType(expr, 1, 'string');
                    return 'bool';
                case 'length':
                    this.checkArgCount(expr, 1, funcName);
                    this.checkArgType(expr, 0, 'string');
                    return 'int';
                case 'timestamp':
                    this.checkArgCount(expr, 1, funcName);
                    this.checkArgType(expr, 0, 'string');
                    return 'date';
            }
        }

        throw new Error("Unknown function call or macro.");
    }

    /**
     * Helper to verify argument count for functions.
     */
    private checkArgCount(expr: CallExpr, count: number, name: string): void {
        if (expr.arguments.length !== count) {
            throw new Error(`Function '${name}' expects ${count} argument(s), got ${expr.arguments.length}.`);
        }
    }

    /**
     * Helper to verify argument type for functions.
     */
    private checkArgType(expr: CallExpr, index: number, expected: Type): void {
        const argType = this.checkExpression(expr.arguments[index]);
        if (!this.areTypesEqual(argType, expected)) {
            throw new Error(`Type mismatch in argument ${index + 1}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(argType)}`);
        }
    }

    /**
     * Infers type for object literals.
     */
    private checkObject(expr: ObjectExpr): Type {
        const properties: Record<string, Type> = {};
        for (const prop of expr.properties) {
            properties[prop.key] = this.checkExpression(prop.value);
        }
        return { kind: 'object', properties };
    }

    /**
     * Ensures `has()` macro argument is a valid member chain.
     */
    private checkHasArg(expr: MemberExpr): void {
        if (expr.object.kind === 'Variable') {
            if (!this.variables.has((expr.object as any).name)) {
                throw new AxiomTypeError(`Undefined variable '${(expr.object as any).name}' in has() check.`, this.filename);
            }
        } else if (expr.object.kind === 'Member') {
            this.checkHasArg(expr.object as MemberExpr);
        } else {
            this.checkExpression(expr.object);
        }
    }

    /**
     * Infers list type and ensures homogeneity.
     */
    private checkList(expr: { elements: Expression[] }): Type {
        if (expr.elements.length === 0) {
            return { kind: 'list', elementType: 'unknown' };
        }

        const firstType = this.checkExpression(expr.elements[0]);
        for (let i = 1; i < expr.elements.length; i++) {
            const type = this.checkExpression(expr.elements[i]);
            if (!this.areTypesEqual(type, firstType)) {
                throw new Error(`List elements must be homogeneous. Expected ${JSON.stringify(firstType)}, got ${JSON.stringify(type)} at index ${i}`);
            }
        }
        return { kind: 'list', elementType: firstType };
    }

    /**
     * Validates property access on objects.
     */
    private checkMember(expr: { object: Expression, property: string }): Type {
        const objectType = this.checkExpression(expr.object);
        if (typeof objectType === 'string' || objectType.kind !== 'object') {
            throw new Error(`Only objects have properties. Got ${JSON.stringify(objectType)}`);
        }

        const propertyType = objectType.properties[expr.property];
        if (!propertyType) {
            throw new Error(`Property '${expr.property}' does not exist on object.`);
        }
        return propertyType;
    }

    /**
     * Validates unary operations.
     */
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

    /**
     * Validates binary operations and ensures operand compatibility.
     */
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
                if (!this.areTypesEqual(left, right)) {
                    // For 'unknown' types (empty list), we allow comparison
                    if (left === 'unknown' || right === 'unknown') return 'bool';
                    throw new Error(`Cannot compare ${JSON.stringify(left)} and ${JSON.stringify(right)} for equality`);
                }
                return 'bool';

            case '>':
            case '>=':
            case '<':
            case '<=':
                if (left === 'int' && right === 'int') return 'bool';
                if (left === 'date' && right === 'date') return 'bool';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            case '&&':
            case '||':
                if (left === 'bool' && right === 'bool') return 'bool';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            case 'in':
                if (typeof right === 'string' || right.kind !== 'list') {
                    throw new Error(`Right operand of 'in' must be a list. Got ${JSON.stringify(right)}`);
                }
                if (!this.areTypesEqual(left, right.elementType)) {
                    throw new Error(`Type mismatch: Cannot check if ${JSON.stringify(left)} is in list of ${JSON.stringify(right.elementType)}`);
                }
                return 'bool';

            default:
                throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }

    /**
     * Compares two types for structural equality.
     */
    private areTypesEqual(t1: Type, t2: Type): boolean {
        if (typeof t1 === 'string' && typeof t2 === 'string') {
            if (t1 === 'unknown' || t2 === 'unknown') return true;
            return t1 === t2;
        }
        if (typeof t1 === 'object' && typeof t2 === 'object') {
            if (t1.kind === 'list' && t2.kind === 'list') {
                return this.areTypesEqual(t1.elementType, t2.elementType);
            }
            if (t1.kind === 'object' && t2.kind === 'object') {
                if (Object.keys(t2.properties).length === 0) return true;

                const keys1 = Object.keys(t1.properties).sort();
                const keys2 = Object.keys(t2.properties).sort();
                if (keys1.length !== keys2.length) return false;
                for (let i = 0; i < keys1.length; i++) {
                    if (keys1[i] !== keys2[i]) return false;
                    if (!this.areTypesEqual(t1.properties[keys1[i]], t2.properties[keys2[i]])) return false;
                }
                return true;
            }
        }
        return false;
    }
}
