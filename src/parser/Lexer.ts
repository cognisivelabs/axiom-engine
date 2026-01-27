import { Token, TokenType } from '../common/TokenType';

export class Lexer {
    private source: string;
    private position: number = 0;
    private line: number = 1;
    private keywords: Record<string, TokenType> = {
        'let': TokenType.LET,
        'if': TokenType.IF,
        'else': TokenType.ELSE,
        'true': TokenType.TRUE,
        'false': TokenType.FALSE,
        'int': TokenType.TYPE_INT,
        'string': TokenType.TYPE_STRING,
        'bool': TokenType.TYPE_BOOL,
    };

    constructor(source: string) {
        this.source = source;
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        while (this.position < this.source.length) {
            const char = this.peek();

            if (/\s/.test(char)) {
                if (char === '\n') this.line++;
                this.advance();
                continue;
            }

            if (/[0-9]/.test(char)) {
                tokens.push(this.readNumber());
                continue;
            }

            if (/[a-zA-Z_]/.test(char)) {
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
                        this.advance(); this.advance();
                        tokens.push({ type: TokenType.EQ_EQ, value: '==', line: this.line });
                    } else {
                        tokens.push({ type: TokenType.EQUALS, value: '=', line: this.line });
                        this.advance();
                    }
                    break;
                case '!':
                    if (this.peekNext() === '=') {
                        this.advance(); this.advance();
                        tokens.push({ type: TokenType.BANG_EQ, value: '!=', line: this.line });
                    } else {
                        throw new Error(`Unexpected character '!' at line ${this.line}`);
                    }
                    break;
                case '+': tokens.push(this.singleChar(TokenType.PLUS, '+')); break;
                case '-': tokens.push(this.singleChar(TokenType.MINUS, '-')); break;
                case '*': tokens.push(this.singleChar(TokenType.MULTIPLY, '*')); break;
                case '/': tokens.push(this.singleChar(TokenType.DIVIDE, '/')); break;
                case ';': tokens.push(this.singleChar(TokenType.SEMICOLON, ';')); break;
                case ':': tokens.push(this.singleChar(TokenType.COLON, ':')); break;
                case '(': tokens.push(this.singleChar(TokenType.LPAREN, '(')); break;
                case ')': tokens.push(this.singleChar(TokenType.RPAREN, ')')); break;
                case '{': tokens.push(this.singleChar(TokenType.LBRACE, '{')); break;
                case '}': tokens.push(this.singleChar(TokenType.RBRACE, '}')); break;
                default:
                    throw new Error(`Unknown character '${char}' at line ${this.line}`);
            }
        }
        tokens.push({ type: TokenType.EOF, value: '', line: this.line });
        return tokens;
    }

    private singleChar(type: TokenType, value: string): Token {
        this.advance();
        return { type, value, line: this.line };
    }

    private readNumber(): Token {
        let value = '';
        while (this.position < this.source.length && /[0-9]/.test(this.peek())) {
            value += this.advance();
        }
        return { type: TokenType.NUMBER, value, line: this.line };
    }

    private readIdentifier(): Token {
        let value = '';
        while (this.position < this.source.length && /[a-zA-Z0-9_]/.test(this.peek())) {
            value += this.advance();
        }
        const type = this.keywords[value] || TokenType.IDENTIFIER;
        return { type, value, line: this.line };
    }

    private readString(): Token {
        let value = '';
        this.advance(); // Skip opening quote
        while (this.position < this.source.length && this.peek() !== '"') {
            value += this.advance();
        }
        if (this.position >= this.source.length) throw new Error("Unterminated string");
        this.advance(); // Skip closing quote
        return { type: TokenType.STRING, value, line: this.line };
    }

    private peek(): string {
        return this.source[this.position];
    }

    private peekNext(): string {
        if (this.position + 1 >= this.source.length) return '\0';
        return this.source[this.position + 1];
    }

    private advance(): string {
        return this.source[this.position++];
    }
}
