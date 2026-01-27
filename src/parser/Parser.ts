
import { Token, TokenType } from '../common/TokenType';
import {
    Statement, VarDecl, IfStmt, BlockStmt, ExpressionStmt, Assignment,
    Expression, BinaryExpr, LiteralExpr, VariableExpr, Type
} from '../common/AST';

export class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Statement[] {
        const statements: Statement[] = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }
        return statements;
    }

    private declaration(): Statement {
        if (this.match(TokenType.LET)) {
            return this.varDeclaration();
        }
        return this.statement();
    }

    private varDeclaration(): VarDecl {
        const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.").value;
        this.consume(TokenType.COLON, "Expect ':' after variable name.");

        let typeAnnotation: Type;
        if (this.match(TokenType.TYPE_INT)) typeAnnotation = 'int';
        else if (this.match(TokenType.TYPE_STRING)) typeAnnotation = 'string';
        else if (this.match(TokenType.TYPE_BOOL)) typeAnnotation = 'bool';
        else throw new Error("Expect type annotation (int, string, bool).");

        this.consume(TokenType.EQUALS, "Expect '=' after variable declaration.");
        const initializer = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

        return { kind: 'VarDecl', name, typeAnnotation, initializer };
    }

    private statement(): Statement {
        if (this.match(TokenType.IF)) return this.ifStatement();
        if (this.match(TokenType.LBRACE)) return { kind: 'Block', statements: this.block() };

        // Check for assignment: IDENTIFIER = ...
        // This requires lookahead. 
        // If current is ID and next is EQUALS, it's assignment.
        if (this.check(TokenType.IDENTIFIER) && this.peekNext().type === TokenType.EQUALS) {
            return this.assignment();
        }

        return this.expressionStatement();
    }

    private assignment(): Statement {
        const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.").value;
        this.consume(TokenType.EQUALS, "Expect '=' after variable name.");
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return { kind: 'Assignment', name, value };
    }

    private peekNext(): Token {
        if (this.current + 1 >= this.tokens.length) return this.tokens[this.tokens.length - 1]; // EOF
        return this.tokens[this.current + 1];
    }



    private ifStatement(): IfStmt {
        this.consume(TokenType.LPAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.RPAREN, "Expect ')' after if condition.");

        const thenBranch = this.statement();
        let elseBranch: Statement | undefined = undefined;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }

        return { kind: 'If', condition, thenBranch, elseBranch };
    }

    private block(): Statement[] {
        const statements: Statement[] = [];
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType.RBRACE, "Expect '}' after block.");
        return statements;
    }

    private expressionStatement(): ExpressionStmt {
        const expr = this.expression();

        // Allow implicit return: semicolon is optional if it's the last statement
        if (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        } else {
            // If we are at RBRACE or EOF, check if there is a semicolon optionally
            if (this.check(TokenType.SEMICOLON)) {
                this.advance();
            }
        }

        return { kind: 'ExpressionStmt', expression: expr };
    }

    private expression(): Expression {
        return this.logicOr();
    }

    private logicOr(): Expression {
        let expr = this.logicAnd();

        while (this.match(TokenType.OR)) {
            const operator = this.previous().value;
            const right = this.logicAnd();
            expr = { kind: 'Binary', left: expr, operator, right };
        }

        return expr;
    }

    private logicAnd(): Expression {
        let expr = this.equality();

        while (this.match(TokenType.AND)) {
            const operator = this.previous().value;
            const right = this.equality();
            expr = { kind: 'Binary', left: expr, operator, right };
        }

        return expr;
    }

    private equality(): Expression {
        let expr = this.comparison();

        while (this.match(TokenType.EQ_EQ, TokenType.BANG_EQ)) {
            const operator = this.previous().value;
            const right = this.comparison();
            expr = { kind: 'Binary', left: expr, operator, right };
        }

        return expr;
    }

    private comparison(): Expression {
        let expr = this.term();

        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous().value;
            const right = this.term();
            expr = { kind: 'Binary', left: expr, operator, right };
        }

        return expr;
    }

    private term(): Expression {
        let expr = this.factor();

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous().value;
            const right = this.factor();
            expr = { kind: 'Binary', left: expr, operator, right };
        }

        return expr;
    }

    private factor(): Expression {
        let expr = this.unary();

        while (this.match(TokenType.DIVIDE, TokenType.MULTIPLY)) {
            const operator = this.previous().value;
            const right = this.unary();
            expr = { kind: 'Binary', left: expr, operator, right };
        }

        return expr;
    }

    private unary(): Expression {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.unary();
            return { kind: 'Unary', operator, right };
        }

        return this.primary();
    }

    private primary(): Expression {
        if (this.match(TokenType.FALSE)) return { kind: 'Literal', value: false, type: 'bool' };
        if (this.match(TokenType.TRUE)) return { kind: 'Literal', value: true, type: 'bool' };

        if (this.match(TokenType.NUMBER)) {
            return { kind: 'Literal', value: parseInt(this.previous().value), type: 'int' };
        }
        if (this.match(TokenType.STRING)) {
            return { kind: 'Literal', value: this.previous().value, type: 'string' };
        }
        if (this.match(TokenType.IDENTIFIER)) {
            return { kind: 'Variable', name: this.previous().value };
        }

        throw new Error(`Expect expression at line ${this.peek().line}`);
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new Error(message + ` at line ${this.peek().line}`);
    }
}
