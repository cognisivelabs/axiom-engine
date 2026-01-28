
/**
 * Represents the type system of the Axiom language/
 * Can be a primitive ('int', 'string') or a complex structure (Object, List).
 */
export type Type = 'int' | 'string' | 'bool' | 'date' | 'unknown' | ObjectType | ListType;

/**
 * Represents a structural Object type (e.g., { name: string, age: int }).
 */
export interface ObjectType {
    kind: 'object';
    properties: Record<string, Type>;
}

/**
 * Represents a List type (e.g., int[] or string[]).
 */
export interface ListType {
    kind: 'list';
    elementType: Type;
}

/**
 * Union type for all valid Statements in the language.
 */
export type Statement =
    | VarDecl
    | IfStmt
    | BlockStmt
    | ExpressionStmt
    | Assignment;

/**
 * Union type for all valid Expressions (evaluate to a value).
 */
export type Expression =
    | BinaryExpr
    | UnaryExpr
    | MemberExpr
    | ListExpr
    | LiteralExpr
    | VariableExpr
    | CallExpr
    | LambdaExpr
    | ObjectExpr;

/**
 * Variable Declaration Statement (e.g., let x: int = 5;).
 */
export interface VarDecl {
    kind: 'VarDecl';
    name: string;
    typeAnnotation: Type;
    initializer: Expression;
}

/**
 * Variable Assignment Statement (e.g., x = 10;).
 */
export interface Assignment {
    kind: 'Assignment';
    name: string;
    value: Expression;
}

/**
 * Conditional logic Statement (if/else).
 */
export interface IfStmt {
    kind: 'If';
    condition: Expression;
    thenBranch: Statement;
    elseBranch?: Statement;
}

/**
 * A block of multiple statements (scoped).
 */
export interface BlockStmt {
    kind: 'Block';
    statements: Statement[];
}

/**
 * A wrapper for an expression used as a statement (often implicit return).
 */
export interface ExpressionStmt {
    kind: 'ExpressionStmt';
    expression: Expression;
}

/**
 * Binary Operation Expression (+, -, *, /, &&, ||, ==, <, etc.).
 */
export interface BinaryExpr {
    kind: 'Binary';
    left: Expression;
    operator: string;
    right: Expression;
}

/**
 * Unary Operation Expression (!, -).
 */
export interface UnaryExpr {
    kind: 'Unary';
    operator: string;
    right: Expression;
}

/**
 * Member Access Expression (obj.prop).
 */
export interface MemberExpr {
    kind: 'Member';
    object: Expression;
    property: string;
}

/**
 * List Literal Expression ([1, 2, 3]).
 */
export interface ListExpr {
    kind: 'List';
    elements: Expression[];
}

/**
 * Literal Value Expression (1, "hello", true).
 */
export interface LiteralExpr {
    kind: 'Literal';

    value: any;
    type: Type; // 'int' | 'string' | 'bool'
}

/**
 * Variable Reference Expression (x).
 */
export interface VariableExpr {
    kind: 'Variable';
    name: string;
}

/**
 * Function or Macro Call Expression (foo(a, b)).
 */
export interface CallExpr {
    kind: 'Call';
    callee: Expression;
    arguments: Expression[];
}

/**
 * Lambda Expression for Macros (item, body).
 */
export interface LambdaExpr {
    kind: 'Lambda';
    parameter: string;
    body: Expression;
}

/**
 * Object Literal Expression ({ key: value }).
 */
export interface ObjectExpr {
    kind: 'Object';
    properties: { key: string; value: Expression }[];
}
