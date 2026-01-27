
import { test, describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { Axiom } from '../src';

describe('Axiom Engine Integration Tests', () => {

    // Helper to read rule files
    const readRule = (filename: string) => {
        return fs.readFileSync(path.join(__dirname, 'rules', filename), 'utf-8');
    };

    it('should calculate pricing correctly (Simple Logic)', () => {
        const source = readRule('pricing.ax');
        const contextTypes: any = {
            'user_age': 'int',
            'is_vip': 'bool',
            'base_price': 'int'
        };

        const ast = Axiom.compile(source);
        Axiom.check(ast, contextTypes);

        // Case 1: VIP user (Discount applied)
        const resultVIP = Axiom.execute(ast, {
            'user_age': 25,
            'is_vip': true,
            'base_price': 100
        });
        assert.strictEqual(resultVIP, 50, 'VIP User should get discount (100 - 50)');

        // Case 2: Non-VIP user (No discount)
        const resultRegular = Axiom.execute(ast, {
            'user_age': 25,
            'is_vip': false,
            'base_price': 100
        });
        assert.strictEqual(resultRegular, 100, 'Regular User should pay full price');
    });

    it('should handle comparisons and logical operators', () => {
        const source = readRule('features.ax');
        // Features.ax expects: age(int)
        // It returns: can_enter(bool) => (age >= 18) && has_ticket(true) && !is_banned(false)
        // Actually looking at the file, it defines its own local variables for most things, 
        // but let's see if we need to pass anything.
        // Wait, the previous test_features.ax defined all variables internally with 'let'.
        // Let's just run it to ensure it evaluates true.

        const result = Axiom.eval(source, {}, {});
        assert.strictEqual(result, true, 'Logic test should return true');
    });

    it('should throw error on type mismatch', () => {
        const source = `let x: int = "string";`; // Invalid assignment
        try {
            Axiom.compile(source); // Compile might succeed if AST is valid
            // Check should fail
            Axiom.check(Axiom.compile(source), {});
            assert.fail('Should have thrown type check error');
        } catch (e: any) {
            assert.match(e.message, /Type mismatch/);
        }
    });
});
