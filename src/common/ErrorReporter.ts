import { AxiomError, SyntaxError, TypeError, RuntimeError } from './Errors';

/**
 * Central handling for reporting errors to the console.
 * Distinguishes between expected AxiomErrors (Syntax/Type) and system crashes.
 */
export class ErrorReporter {
    /**
     * Prints a formatted error message to stderr.
     * @param error The error object caught.
     */
    static report(error: any): void {
        if (error instanceof AxiomError) {
            console.error(this.formatAxiomError(error));
        } else {
            // Unexpected system error - print stack trace
            console.error("[System Error] An unexpected error occurred:");
            console.error(error);
        }
    }

    /**
     * Formats an AxiomError into a readable string with file context.
     * @param error The specific AxiomError (Syntax/Type/Runtime).
     * @returns A friendly error string (e.g. "[Syntax Error] in 'file.arl' Line 5: ...").
     */
    private static formatAxiomError(error: AxiomError): string {
        const type = error.name.replace('Error', ''); // SyntaxError -> Syntax
        const fileContext = error.filename ? ` in '${error.filename}'` : '';

        let message = `[${type} Error]${fileContext} ${error.message}`;

        if (error instanceof SyntaxError) {
            message = `[Syntax Error]${fileContext} Line ${error.line}: ${error.message}`;
        }

        return message;
    }
}
