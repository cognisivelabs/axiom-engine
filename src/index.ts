import * as fs from 'fs';
import * as path from 'path';
import { Lexer } from './parser/Lexer';
import { Parser } from './parser/Parser';
import { TypeChecker } from './checker/TypeChecker';
import { Interpreter } from './interpreter/Interpreter';
import { Statement, Type } from './common/AST';

export class Axiom {
    static compile(source: string): Statement[] {
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        return parser.parse();
    }

    static check(ast: Statement[], contextTypes: Record<string, Type>): void {
        const checker = new TypeChecker();
        checker.check(ast, contextTypes);
    }

    static execute(ast: Statement[], contextData: Record<string, any>): any {
        const interpreter = new Interpreter();
        return interpreter.interpret(ast, contextData);
    }

    // Convenience method for one-shot execution (slower due to re-parsing)
    static eval(source: string, context: Record<string, any>, types: Record<string, Type>): any {
        const ast = this.compile(source);
        this.check(ast, types);
        return this.execute(ast, context);
    }
}

// CLI Logic
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.log("Usage: axiom <script>");
        process.exit(1);
    }

    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const source = fs.readFileSync(filePath, 'utf-8');

    // Implementation of CLI using the new Axiom class
    try {
        const contextTypes: any = { 'user_age': 'int', 'is_vip': 'bool', 'base_price': 'int' };
        const contextValues: any = { 'user_age': 25, 'is_vip': true, 'base_price': 100 };

        console.log("--- Axiom Engine ---");
        console.log("Context:", contextValues);
        console.log("--------------------");

        const result = Axiom.eval(source, contextValues, contextTypes);

        console.log("[Verifying] Type Check Passed.");
        console.log("--------------------");
        console.log("Final Result:", result);
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}
