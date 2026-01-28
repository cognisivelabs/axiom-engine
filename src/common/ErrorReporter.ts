import { AxiomError, SyntaxError, TypeError, RuntimeError } from './Errors';

export class ErrorReporter {
    static report(error: any): void {
        if (error instanceof AxiomError) {
            console.error(this.formatAxiomError(error));
        } else {
            // Unexpected system error - print stack trace
            console.error("[System Error] An unexpected error occurred:");
            console.error(error);
        }
    }

    private static formatAxiomError(error: AxiomError): string {
        const type = error.name.replace('Error', ''); // SyntaxError -> Syntax

        let message = `[${type} Error] ${error.message}`;

        if (error instanceof SyntaxError) {
            message = `[Syntax Error] Line ${error.line}: ${error.message}`;
        }

        return message;
    }
}
