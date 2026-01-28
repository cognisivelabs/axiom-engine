/**
 * Base class for all Axiom-specific errors.
 * Supports filename tracking for better context.
 */
export abstract class AxiomError extends Error {
    filename?: string;

    constructor(message: string, filename?: string) {
        super(message);
        this.name = 'AxiomError';
        this.filename = filename;
    }
}

/**
 * Thrown during Parsing when the source violates grammar rules.
 */
export class SyntaxError extends AxiomError {
    line: number;

    constructor(message: string, line: number, filename?: string) {
        super(message, filename);
        this.name = 'SyntaxError';
        this.line = line;
    }
}

/**
 * Thrown during Type Checking when types do not match expectations.
 */
export class TypeError extends AxiomError {
    constructor(message: string, filename?: string) {
        super(message, filename);
        this.name = 'TypeError';
    }
}

/**
 * Thrown during Execution when a runtime issue occurs (e.g. missing variable).
 */
export class RuntimeError extends AxiomError {
    constructor(message: string, filename?: string) {
        super(message, filename);
        this.name = 'RuntimeError';
    }
}
