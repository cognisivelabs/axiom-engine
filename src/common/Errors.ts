export abstract class AxiomError extends Error {
    filename?: string;

    constructor(message: string, filename?: string) {
        super(message);
        this.name = 'AxiomError';
        this.filename = filename;
    }
}

export class SyntaxError extends AxiomError {
    line: number;

    constructor(message: string, line: number, filename?: string) {
        super(message, filename);
        this.name = 'SyntaxError';
        this.line = line;
    }
}

export class TypeError extends AxiomError {
    constructor(message: string, filename?: string) {
        super(message, filename);
        this.name = 'TypeError';
    }
}

export class RuntimeError extends AxiomError {
    constructor(message: string, filename?: string) {
        super(message, filename);
        this.name = 'RuntimeError';
    }
}
