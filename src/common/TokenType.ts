export enum TokenType {
    // Literals
    NUMBER,
    STRING,
    IDENTIFIER,

    // Keywords
    LET,
    IF,
    ELSE,
    TRUE,
    FALSE,

    // Types
    TYPE_INT,
    TYPE_STRING,
    TYPE_BOOL,
    TYPE_DATE,

    // Operators
    EQUALS,
    PLUS,
    MINUS,
    MULTIPLY,
    DIVIDE,

    // Comparison
    EQ_EQ,
    BANG_EQ,
    GREATER,
    GREATER_EQUAL,
    LESS,
    LESS_EQUAL,

    // Logic
    AND,
    OR,
    BANG,

    // Punctuation
    SEMICOLON,
    COLON,
    LPAREN,
    RPAREN,
    LBRACE,
    RBRACE,
    COMMA,
    DOT,

    // List Support
    LBRACKET,
    RBRACKET,
    IN,

    // End of File
    EOF
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
}
