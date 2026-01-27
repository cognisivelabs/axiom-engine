
export type Type = 'int' | 'string' | 'bool' | ObjectType | ListType;

export interface ObjectType {
    kind: 'object';
    properties: Record<string, Type>;
}

export interface ListType {
    kind: 'list';
    elementType: Type;
}

export type Statement =
    | VarDecl
    | IfStmt
    | BlockStmt
    | ExpressionStmt
    | Assignment;

export type Expression =
    | BinaryExpr
    | UnaryExpr
    | MemberExpr
    | ListExpr
    | LiteralExpr
    | VariableExpr;

// Statements

export interface VarDecl {
    kind: 'VarDecl';
    name: string;
    typeAnnotation: Type;
    initializer: Expression;
}

export interface Assignment {
    kind: 'Assignment';
    name: string;
    value: Expression;
}



export interface IfStmt {
    kind: 'If';
    condition: Expression;
    thenBranch: Statement;
    elseBranch?: Statement;
}

export interface BlockStmt {
    kind: 'Block';
    statements: Statement[];
}

export interface ExpressionStmt {
    kind: 'ExpressionStmt';
    expression: Expression;
}

// Expressions

export interface BinaryExpr {
    kind: 'Binary';
    left: Expression;
    operator: string;
    right: Expression;
}

export interface UnaryExpr {
    kind: 'Unary';
    operator: string;
    right: Expression;
}

export interface MemberExpr {
    kind: 'Member';
    object: Expression;
    property: string;
}

export interface ListExpr {
    kind: 'List';
    elements: Expression[];
}

export interface LiteralExpr {
    kind: 'Literal';

    value: any;
    type: Type; // 'int' | 'string' | 'bool'
}

export interface VariableExpr {
    kind: 'Variable';
    name: string;
}
