
import { test, describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { Axiom } from '../src';
import { ContractDef } from '../src/common/Contract';
import { Type } from '../src/common/AST';

describe('Axiom Engine Integration Tests', () => {

    // Helper to read rule files
    const readRule = (filename: string) => {
        const ruleName = filename.replace('.arl', '');
        return fs.readFileSync(path.join(__dirname, 'fixtures', ruleName, filename), 'utf-8');
    };

    // Helper to create ContractDef
    const createContract = (inputs: Record<string, any>, outputs?: any): ContractDef => {
        return {
            name: 'TestContract',
            inputs: inputs as Record<string, Type>, // Assuming simple types for test convenience
            outputs: outputs as Type
        };
    };

    it('should calculate pricing correctly (Simple Logic)', () => {
        const source = readRule('pricing.arl');
        const contract = createContract({
            'user_age': 'int',
            'is_vip': 'bool',
            'base_price': 'int'
        });

        const ast = Axiom.compile(source);
        Axiom.check(ast, contract);

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

    it('should verify Member Access (Dot Notation)', () => {
        const source = readRule('member_access.arl');
        const contract = createContract({
            'user': {
                'kind': 'object',
                'properties': {
                    'name': 'string',
                    'address': { 'kind': 'object', 'properties': { 'city': 'string' } },
                    'company': { 'kind': 'object', 'properties': { 'address': { 'kind': 'object', 'properties': { 'zip': 'string' } } } }
                }
            } as any
        });

        const contextData = {
            'user': {
                'name': 'Alice',
                'address': {
                    'city': 'Wonderland'
                },
                'company': {
                    'address': {
                        'zip': '88081'
                    }
                }
            }
        };

        const ast = Axiom.compile(source);
        Axiom.check(ast, contract);
        const result = Axiom.execute(ast, contextData);

        assert.strictEqual(result, 'Wonderland-88081', 'Should access both nested properties');
    });

    it('should throw error on invalid property access', () => {
        const source = `let x: string = user.unknown_prop;`;
        const contract = createContract({
            'user': { 'kind': 'object', 'properties': { 'name': 'string' } } as any
        });

        try {
            const ast = Axiom.compile(source);
            Axiom.check(ast, contract);
            assert.fail('Should fail type check');
        } catch (e: any) {
            assert.match(e.message, /Property 'unknown_prop' does not exist/);
        }
    });

    it('should verify Math operations and Precedence', () => {
        const source = readRule('math.arl');
        const ast = Axiom.compile(source);
        Axiom.check(ast, createContract({}));

        const finalResult = Axiom.execute(ast, {});
        assert.strictEqual(finalResult, 215, 'Math variables integration failed');
    });

    it('should verify List operations and IN operator', () => {
        const source = readRule('lists.arl');
        const ast = Axiom.compile(source);
        Axiom.check(ast, createContract({}));

        const result = Axiom.execute(ast, {});
        assert.strictEqual(result, true, 'Result should be true (admin in list)');
    });

    it('should verify Macros (has, exists, all)', () => {
        const source = readRule('macros.arl');
        const contract = createContract({
            'user': { 'kind': 'object', 'properties': { 'name': 'string' } } as any
        });

        const ast = Axiom.compile(source);
        Axiom.check(ast, contract);

        const result = Axiom.execute(ast, {
            'user': { name: 'Alice' }
        });
        assert.strictEqual(result, true, 'Macros verification failed');
    });

    it('should throw error on inhomogeneous list', () => {
        const source = 'let x: int[] = [1, "2"];';
        try {
            const ast = Axiom.compile(source);
            Axiom.check(ast, createContract({}));
            assert.fail('Should fail type check');
        } catch (e: any) {
            assert.match(e.message, /List elements must be homogeneous/);
        }
    });

    it('should validate output type', () => {
        const source = '1 + 1';
        const ast = Axiom.compile(source);

        // Pass: Expected int
        Axiom.check(ast, createContract({}, 'int'));

        // Fail: Expected string
        try {
            Axiom.check(ast, createContract({}, 'string'));
            assert.fail('Should fail output check (int vs string)');
        } catch (e: any) {
            assert.match(e.message, /Return type mismatch/);
        }
    });

    it('should verify Object Literals', () => {
        const source = readRule('objects.arl');
        const ast = Axiom.compile(source);
        Axiom.check(ast, createContract({}));

        const result = Axiom.execute(ast, {});
        // Expanded object check
        assert.strictEqual(result.status, 'success', 'Object property access failed');
        assert.strictEqual(result.code, 200, 'Object property access failed');
        assert.strictEqual(result.meta.version, '1.0', 'Nested object property access failed');
    });

    it('should verify Control Flow and Scoping', () => {
        const source = readRule('control_flow.arl');
        const ast = Axiom.compile(source);
        Axiom.check(ast, createContract({}));
        const result = Axiom.execute(ast, {});
        assert.ok(true);
    });

    it('should throw error on type mismatch', () => {
        const source = `let x: int = "string";`; // Invalid assignment
        try {
            Axiom.compile(source);
            Axiom.check(Axiom.compile(source), createContract({}));
            assert.fail('Should have thrown type check error');
        } catch (e: any) {
            assert.match(e.message, /Type mismatch/);
        }
    });

    it('should throw error on undefined variable', () => {
        const source = `let y: int = x + 1;`;
        try {
            const ast = Axiom.compile(source);
            Axiom.check(ast, createContract({}));
            assert.fail('Should have thrown undefined variable error');
        } catch (e: any) {
            assert.match(e.message, /Undefined variable 'x'/);
        }
    });

});
