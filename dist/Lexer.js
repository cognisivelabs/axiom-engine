"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const TokenType_1 = require("./TokenType");
class Lexer {
    constructor(source) {
        this.position = 0;
        this.line = 1;
        this.keywords = {
            'let': TokenType_1.TokenType.LET,
            'print': TokenType_1.TokenType.PRINT,
            'if': TokenType_1.TokenType.IF,
            'else': TokenType_1.TokenType.ELSE,
            'true': TokenType_1.TokenType.TRUE,
            'false': TokenType_1.TokenType.FALSE,
            'int': TokenType_1.TokenType.TYPE_INT,
            'string': TokenType_1.TokenType.TYPE_STRING,
            'bool': TokenType_1.TokenType.TYPE_BOOL,
        };
        this.source = source;
    }
    tokenize() {
        const tokens = [];
        while (this.position < this.source.length) {
            const char = this.peek();
            if (/\s/.test(char)) {
                if (char === '\n')
                    this.line++;
                this.advance();
                continue;
            }
            if (/[0-9]/.test(char)) {
                tokens.push(this.readNumber());
                continue;
            }
            if (/[a-zA-Z]/.test(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }
            if (char === '"') {
                tokens.push(this.readString());
                continue;
            }
            switch (char) {
                case '=':
                    if (this.peekNext() === '=') {
                        this.advance();
                        this.advance();
                        tokens.push({ type: TokenType_1.TokenType.EQ_EQ, value: '==', line: this.line });
                    }
                    else {
                        tokens.push({ type: TokenType_1.TokenType.EQUALS, value: '=', line: this.line });
                        this.advance();
                    }
                    break;
                case '!':
                    if (this.peekNext() === '=') {
                        this.advance();
                        this.advance();
                        tokens.push({ type: TokenType_1.TokenType.BANG_EQ, value: '!=', line: this.line });
                    }
                    else {
                        throw new Error(`Unexpected character '!' at line ${this.line}`);
                    }
                    break;
                case '+':
                    tokens.push(this.singleChar(TokenType_1.TokenType.PLUS, '+'));
                    break;
                case '-':
                    tokens.push(this.singleChar(TokenType_1.TokenType.MINUS, '-'));
                    break;
                case '*':
                    tokens.push(this.singleChar(TokenType_1.TokenType.MULTIPLY, '*'));
                    break;
                case '/':
                    tokens.push(this.singleChar(TokenType_1.TokenType.DIVIDE, '/'));
                    break;
                case ';':
                    tokens.push(this.singleChar(TokenType_1.TokenType.SEMICOLON, ';'));
                    break;
                case ':':
                    tokens.push(this.singleChar(TokenType_1.TokenType.COLON, ':'));
                    break;
                case '(':
                    tokens.push(this.singleChar(TokenType_1.TokenType.LPAREN, '('));
                    break;
                case ')':
                    tokens.push(this.singleChar(TokenType_1.TokenType.RPAREN, ')'));
                    break;
                case '{':
                    tokens.push(this.singleChar(TokenType_1.TokenType.LBRACE, '{'));
                    break;
                case '}':
                    tokens.push(this.singleChar(TokenType_1.TokenType.RBRACE, '}'));
                    break;
                default:
                    throw new Error(`Unknown character '${char}' at line ${this.line}`);
            }
        }
        tokens.push({ type: TokenType_1.TokenType.EOF, value: '', line: this.line });
        return tokens;
    }
    singleChar(type, value) {
        this.advance();
        return { type, value, line: this.line };
    }
    readNumber() {
        let value = '';
        while (this.position < this.source.length && /[0-9]/.test(this.peek())) {
            value += this.advance();
        }
        return { type: TokenType_1.TokenType.NUMBER, value, line: this.line };
    }
    readIdentifier() {
        let value = '';
        while (this.position < this.source.length && /[a-zA-Z0-9]/.test(this.peek())) {
            value += this.advance();
        }
        const type = this.keywords[value] || TokenType_1.TokenType.IDENTIFIER;
        return { type, value, line: this.line };
    }
    readString() {
        let value = '';
        this.advance(); // Skip opening quote
        while (this.position < this.source.length && this.peek() !== '"') {
            value += this.advance();
        }
        if (this.position >= this.source.length)
            throw new Error("Unterminated string");
        this.advance(); // Skip closing quote
        return { type: TokenType_1.TokenType.STRING, value, line: this.line };
    }
    peek() {
        return this.source[this.position];
    }
    peekNext() {
        if (this.position + 1 >= this.source.length)
            return '\0';
        return this.source[this.position + 1];
    }
    advance() {
        return this.source[this.position++];
    }
}
exports.Lexer = Lexer;
