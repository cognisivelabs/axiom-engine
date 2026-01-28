#!/usr/bin/env ts-node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Axiom } from '../src/index';

const program = new Command();

program
    .name('axiom')
    .description('CLI for Axiom Rule Engine')
    .version('1.0.0');

program.command('check')
    .description('Check the syntax and validity of a rule file')
    .argument('<file>', 'path to the .ax rule file')
    .option('-c, --context <json_file>', 'path to context definition (types) file')
    .action((file, options) => {
        try {
            const source = fs.readFileSync(file, 'utf-8');
            console.log(`Checking ${file}...`);

            const ast = Axiom.compile(source);

            if (options.context) {
                const contextDef = JSON.parse(fs.readFileSync(options.context, 'utf-8'));
                Axiom.check(ast, contextDef);
                console.log('✔ Types valid.');
            }

            console.log('✔ Syntax valid.');
        } catch (error: any) {
            console.error('✘ Error:', error.message);
            process.exit(1);
        }
    });

program.command('run')
    .description('Run a rule file with data')
    .argument('<file>', 'path to the .ax rule file')
    .option('-d, --data <json_string>', 'context data as JSON string')
    .option('-f, --data-file <json_file>', 'context data as JSON file')
    .action((file, options) => {
        try {
            const source = fs.readFileSync(file, 'utf-8');
            let data = {};

            if (options.data) {
                data = JSON.parse(options.data);
            } else if (options.dataFile) {
                data = JSON.parse(fs.readFileSync(options.dataFile, 'utf-8'));
            }

            const ast = Axiom.compile(source);
            // For CLI run, we might want to skip strict type checking unless context types are provided?
            // Or we can infer types from data? 
            // For now, let's just execute. Ideally we check types if possible.

            // Basic type inference for safety?
            // Let's just run it. The interpreter handles runtime type mismatches anyway (mostly).

            const result = Axiom.execute(ast, data);
            console.log(JSON.stringify(result, null, 2));

        } catch (error: any) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

program.parse();
