
import {
    Statement, Expression, Type, VarDecl, BinaryExpr, IfStmt, BlockStmt,
    ExpressionStmt, UnaryExpr, CallExpr, MemberExpr, LambdaExpr, ObjectExpr
} from '../common/AST';

export class TypeChecker {
    private variables: Map<string, Type> = new Map();

    static validateContext(contextDef: any): Record<string, Type> {
        const result: Record<string, Type> = {};
        for (const [key, value] of Object.entries(contextDef)) {
            result[key] = this.validateType(value);
        }
        return result;
    }

    static validateType(def: any): Type {
        // 1. Primitive Strings and Array Logic
        if (typeof def === 'string') {
            const primitives = ['int', 'string', 'bool', 'date'];

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

        throw new Error(`Invalid type definition: ${def}`);
    }

    check(statements: Statement[], contextTypes: Record<string, Type> = {}, returnType?: Type): void {
        // Initialize variables with context types
        this.variables = new Map(Object.entries(contextTypes));

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            this.checkStatement(stmt);

            // Validation: Check if the last statement matches the expected return type
            if (returnType && i === statements.length - 1) {
                if (stmt.kind !== 'ExpressionStmt') {
                    throw new Error(`Expected return type ${JSON.stringify(returnType)} but script does not end with an expression.`);
                }
                const lastExprType = this.checkExpression(stmt.expression); // Re-check to get type (inefficient but safe) or we could have captured it from checkStatement if it returned type
                // Actually checkStatement returns void. 
                // Let's modify checkStatement to return Type | null? Or just re-check the expression here since it's cheap (just lookups usually).

                if (!this.areTypesEqual(returnType, lastExprType)) {
                    // Improve error message for objects
                    if (typeof returnType === 'object' && returnType.kind === 'object' &&
                        typeof lastExprType === 'object' && lastExprType.kind === 'object') {

                        for (const key of Object.keys(returnType.properties)) {
                            const expectedProp = returnType.properties[key];
                            const actualProp = lastExprType.properties[key];

                            if (!actualProp) {
                                throw new Error(`Return type mismatch: Contract requires property '${key}' of type ${JSON.stringify(expectedProp)}, but Rule result is missing it.`);
                            }
                            if (!this.areTypesEqual(expectedProp, actualProp)) {
                                throw new Error(`Return type mismatch at property '${key}': Contract expects ${JSON.stringify(expectedProp)}, but Rule returns ${JSON.stringify(actualProp)}`);
                            }
                        }
                    }

                    throw new Error(`Return type mismatch: Contract expects ${JSON.stringify(returnType)}, but Rule returns ${JSON.stringify(lastExprType)}`);
                }
            }
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
        if (!this.areTypesEqual(initializerType, stmt.typeAnnotation)) {
            throw new Error(`Type mismatch for variable '${stmt.name}': cannot assign ${JSON.stringify(initializerType)} to ${JSON.stringify(stmt.typeAnnotation)}`);
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
        if (!this.areTypesEqual(type, valueType)) {
            throw new Error(`Type mismatch for variable '${stmt.name}': cannot assign ${JSON.stringify(valueType)} to ${JSON.stringify(type)}`);
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

    private checkCall(expr: CallExpr): Type {
        // 1. Check for 'has' macro: has(expr)
        if (expr.callee.kind === 'Variable' && (expr.callee as any).name === 'has') {
            if (expr.arguments.length !== 1) throw new Error("Macro 'has' expects exactly 1 argument.");
            const arg = expr.arguments[0];
            if (arg.kind !== 'Member') throw new Error("Macro 'has' expects a property access (e.g. has(user.name)).");
            // validation of the property path is tricky because 'has' suppresses errors. 
            // verifying it is a MemberExpr is enough for static check? 
            // We should ideally check that the ROOT variable exists.
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

                // Remove parameter from scope (simple cleanup)
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

                // Date Functions
                case 'timestamp':
                    this.checkArgCount(expr, 1, funcName);
                    this.checkArgType(expr, 0, 'string');
                    return 'date';
            }
        }

        throw new Error("Unknown function call or macro.");
    }

    private checkArgCount(expr: CallExpr, count: number, name: string): void {
        if (expr.arguments.length !== count) {
            throw new Error(`Function '${name}' expects ${count} argument(s), got ${expr.arguments.length}.`);
        }
    }

    private checkArgType(expr: CallExpr, index: number, expected: Type): void {
        const argType = this.checkExpression(expr.arguments[index]);
        if (!this.areTypesEqual(argType, expected)) {
            throw new Error(`Type mismatch in argument ${index + 1}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(argType)}`);
        }
    }

    private checkObject(expr: ObjectExpr): Type {
        const properties: Record<string, Type> = {};
        for (const prop of expr.properties) {
            properties[prop.key] = this.checkExpression(prop.value);
        }
        return { kind: 'object', properties };
    }

    private checkHasArg(expr: MemberExpr): void {
        // Verify root object exists. The rest of the path is checked at runtime (safe).
        if (expr.object.kind === 'Variable') {
            if (!this.variables.has((expr.object as any).name)) {
                throw new Error(`Undefined variable '${(expr.object as any).name}' in has() check.`);
            }
        } else if (expr.object.kind === 'Member') {
            this.checkHasArg(expr.object as MemberExpr);
        } else {
            // Allow 'has' on other expressions?
            // For now, strict: has(user.address)
            // Check valid base.
            this.checkExpression(expr.object);
        }
    }

    private checkList(expr: { elements: Expression[] }): Type {
        if (expr.elements.length === 0) {
            // Return a list with 'unknown' element type to indicate it can match any list type
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
                if (left === 'date' && right === 'date') return 'bool'; // Support Date comparison
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            case '&&':
            case '||':
                if (left === 'bool' && right === 'bool') return 'bool';
                throw new Error(`Operator '${expr.operator}' cannot be applied to ${left} and ${right}`);

            case 'in':
                // Right must be a list
                if (typeof right === 'string' || right.kind !== 'list') {
                    throw new Error(`Right operand of 'in' must be a list. Got ${JSON.stringify(right)}`);
                }
                // Left must match list element type
                // Note: we need strict deep equality for types ideally.
                // For now, strict reference/value match works for current simple types.
                if (!this.areTypesEqual(left, right.elementType)) {
                    throw new Error(`Type mismatch: Cannot check if ${JSON.stringify(left)} is in list of ${JSON.stringify(right.elementType)}`);
                }
                return 'bool';

            default:
                throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }

    private areTypesEqual(t1: Type, t2: Type): boolean {
        if (typeof t1 === 'string' && typeof t2 === 'string') {
            if (t1 === 'unknown') return true; // 'unknown' (e.g. from empty list) matches any type
            return t1 === t2;
        }
        if (typeof t1 === 'object' && typeof t2 === 'object') {
            if (t1.kind === 'list' && t2.kind === 'list') {
                return this.areTypesEqual(t1.elementType, t2.elementType);
            }
            if (t1.kind === 'object' && t2.kind === 'object') {
                // Simplified object equality: same keys and same types

                // Allow assignment TO generic object (properties: {}) from specific object
                // If t2 (target) has no properties, it's treated as 'object' (any object)
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
