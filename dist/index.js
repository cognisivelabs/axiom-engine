#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const Lexer_1 = require("./Lexer");
const Parser_1 = require("./Parser");
const TypeChecker_1 = require("./TypeChecker");
const Interpreter_1 = require("./Interpreter");
function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.log("Usage: ts-node src/index.ts <script>");
        process.exit(1);
    }
    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }
    const source = fs.readFileSync(filePath, 'utf-8');
    try {
        // 1. Lexing
        const lexer = new Lexer_1.Lexer(source);
        const tokens = lexer.tokenize();
        // 2. Parsing
        const parser = new Parser_1.Parser(tokens);
        const statements = parser.parse();
        // 3. Type Checking
        const typeChecker = new TypeChecker_1.TypeChecker();
        typeChecker.check(statements);
        console.log("Type check passed. Executing...");
        // 4. Interpreting
        const interpreter = new Interpreter_1.Interpreter();
        interpreter.interpret(statements);
    }
    catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}
main();
