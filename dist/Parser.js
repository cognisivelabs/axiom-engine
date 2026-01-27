"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const TokenType_1 = require("./TokenType");
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.tokens = tokens;
    }
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }
        return statements;
    }
    declaration() {
        if (this.match(TokenType_1.TokenType.LET)) {
            return this.varDeclaration();
        }
        return this.statement();
    }
    varDeclaration() {
        const name = this.consume(TokenType_1.TokenType.IDENTIFIER, "Expect variable name.").value;
        this.consume(TokenType_1.TokenType.COLON, "Expect ':' after variable name.");
        let typeAnnotation;
        if (this.match(TokenType_1.TokenType.TYPE_INT))
            typeAnnotation = 'int';
        else if (this.match(TokenType_1.TokenType.TYPE_STRING))
            typeAnnotation = 'string';
        else if (this.match(TokenType_1.TokenType.TYPE_BOOL))
            typeAnnotation = 'bool';
        else
            throw new Error("Expect type annotation (int, string, bool).");
        this.consume(TokenType_1.TokenType.EQUALS, "Expect '=' after variable declaration.");
        const initializer = this.expression();
        this.consume(TokenType_1.TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return { kind: 'VarDecl', name, typeAnnotation, initializer };
    }
    statement() {
        if (this.match(TokenType_1.TokenType.PRINT))
            return this.printStatement();
        if (this.match(TokenType_1.TokenType.IF))
            return this.ifStatement();
        if (this.match(TokenType_1.TokenType.LBRACE))
            return { kind: 'Block', statements: this.block() };
        return this.expressionStatement();
    }
    printStatement() {
        this.consume(TokenType_1.TokenType.LPAREN, "Expect '(' after 'print'.");
        const value = this.expression();
        this.consume(TokenType_1.TokenType.RPAREN, "Expect ')' after value.");
        this.consume(TokenType_1.TokenType.SEMICOLON, "Expect ';' after value.");
        return { kind: 'Print', expression: value };
    }
    ifStatement() {
        this.consume(TokenType_1.TokenType.LPAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType_1.TokenType.RPAREN, "Expect ')' after if condition.");
        const thenBranch = this.statement();
        let elseBranch = undefined;
        if (this.match(TokenType_1.TokenType.ELSE)) {
            elseBranch = this.statement();
        }
        return { kind: 'If', condition, thenBranch, elseBranch };
    }
    block() {
        const statements = [];
        while (!this.check(TokenType_1.TokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType_1.TokenType.RBRACE, "Expect '}' after block.");
        return statements;
    }
    expressionStatement() {
        const expr = this.expression();
        this.consume(TokenType_1.TokenType.SEMICOLON, "Expect ';' after expression.");
        return { kind: 'ExpressionStmt', expression: expr };
    }
    expression() {
        return this.equality();
    }
    equality() {
        let expr = this.term();
        while (this.match(TokenType_1.TokenType.EQ_EQ, TokenType_1.TokenType.BANG_EQ)) {
            const operator = this.previous().value;
            const right = this.term();
            expr = { kind: 'Binary', left: expr, operator, right };
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match(TokenType_1.TokenType.MINUS, TokenType_1.TokenType.PLUS)) {
            const operator = this.previous().value;
            const right = this.factor();
            expr = { kind: 'Binary', left: expr, operator, right };
        }
        return expr;
    }
    factor() {
        let expr = this.primary();
        while (this.match(TokenType_1.TokenType.DIVIDE, TokenType_1.TokenType.MULTIPLY)) {
            const operator = this.previous().value;
            const right = this.primary();
            expr = { kind: 'Binary', left: expr, operator, right };
        }
        return expr;
    }
    primary() {
        if (this.match(TokenType_1.TokenType.FALSE))
            return { kind: 'Literal', value: false, type: 'bool' };
        if (this.match(TokenType_1.TokenType.TRUE))
            return { kind: 'Literal', value: true, type: 'bool' };
        if (this.match(TokenType_1.TokenType.NUMBER)) {
            return { kind: 'Literal', value: parseInt(this.previous().value), type: 'int' };
        }
        if (this.match(TokenType_1.TokenType.STRING)) {
            return { kind: 'Literal', value: this.previous().value, type: 'string' };
        }
        if (this.match(TokenType_1.TokenType.IDENTIFIER)) {
            return { kind: 'Variable', name: this.previous().value };
        }
        throw new Error(`Expect expression at line ${this.peek().line}`);
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === TokenType_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        throw new Error(message + ` at line ${this.peek().line}`);
    }
}
exports.Parser = Parser;
