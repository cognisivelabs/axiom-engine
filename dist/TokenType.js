"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Literals
    TokenType[TokenType["NUMBER"] = 0] = "NUMBER";
    TokenType[TokenType["STRING"] = 1] = "STRING";
    TokenType[TokenType["IDENTIFIER"] = 2] = "IDENTIFIER";
    // Keywords
    TokenType[TokenType["LET"] = 3] = "LET";
    TokenType[TokenType["PRINT"] = 4] = "PRINT";
    TokenType[TokenType["IF"] = 5] = "IF";
    TokenType[TokenType["ELSE"] = 6] = "ELSE";
    TokenType[TokenType["TRUE"] = 7] = "TRUE";
    TokenType[TokenType["FALSE"] = 8] = "FALSE";
    // Types
    TokenType[TokenType["TYPE_INT"] = 9] = "TYPE_INT";
    TokenType[TokenType["TYPE_STRING"] = 10] = "TYPE_STRING";
    TokenType[TokenType["TYPE_BOOL"] = 11] = "TYPE_BOOL";
    // Operators
    TokenType[TokenType["EQUALS"] = 12] = "EQUALS";
    TokenType[TokenType["PLUS"] = 13] = "PLUS";
    TokenType[TokenType["MINUS"] = 14] = "MINUS";
    TokenType[TokenType["MULTIPLY"] = 15] = "MULTIPLY";
    TokenType[TokenType["DIVIDE"] = 16] = "DIVIDE";
    // Comparison
    TokenType[TokenType["EQ_EQ"] = 17] = "EQ_EQ";
    TokenType[TokenType["BANG_EQ"] = 18] = "BANG_EQ";
    // Punctuation
    TokenType[TokenType["SEMICOLON"] = 19] = "SEMICOLON";
    TokenType[TokenType["COLON"] = 20] = "COLON";
    TokenType[TokenType["LPAREN"] = 21] = "LPAREN";
    TokenType[TokenType["RPAREN"] = 22] = "RPAREN";
    TokenType[TokenType["LBRACE"] = 23] = "LBRACE";
    TokenType[TokenType["RBRACE"] = 24] = "RBRACE";
    TokenType[TokenType["EOF"] = 25] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
