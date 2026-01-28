export abstract class AxiomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AxiomError';
    }
}

export class SyntaxError extends AxiomError {
    line: number;

    constructor(message: string, line: number) {
        super(message);
        this.name = 'SyntaxError';
        this.line = line;
    }
}

export class TypeError extends AxiomError {
    constructor(message: string) {
        super(message);
        this.name = 'TypeError';
    }
}

export class RuntimeError extends AxiomError {
    constructor(message: string) {
        super(message);
        this.name = 'RuntimeError';
    }
}
