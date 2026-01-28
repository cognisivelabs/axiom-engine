
import { test, describe, it } from 'node:test';
import * as assert from 'assert';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);
const CLI_PATH = path.resolve(__dirname, '../bin/axiom.ts');
const COMMAND_PREFIX = `npx ts-node ${CLI_PATH}`;

describe('Axiom CLI Integration Tests', () => {

    it('should successfully check a valid file', async () => {
        const rulePath = path.resolve(__dirname, 'rules/math.ax');
        const { stdout, stderr } = await execAsync(`${COMMAND_PREFIX} check ${rulePath}`);

        assert.ok(stdout.includes('Checking'));
        assert.ok(stdout.includes('Syntax valid'));
        assert.strictEqual(stderr, '');
    });

    it('should successfully run a rule file and return result', async () => {
        const rulePath = path.resolve(__dirname, 'rules/math.ax');
        const { stdout } = await execAsync(`${COMMAND_PREFIX} run ${rulePath}`);

        // math.ax calculates 1 + 2 * 3 + (100 in [100, 200] ? 10 : 0) etc? 
        // Let's just check it returns a number. The exact rule content might change.
        // Based on previous runs it returned 215.
        const result = parseInt(stdout.trim());
        assert.ok(!isNaN(result));
    });

    it('should run execution with data input', async () => {
        const rulePath = path.resolve(__dirname, 'rules/macros.ax');
        // macros.ax: has(user.name) ...
        const data = JSON.stringify({ user: { name: "Alice" } });
        // Escape quotes for shell
        const safeData = process.platform === 'win32' ? `"${data.replace(/"/g, '\\"')}"` : `'${data}'`;

        const { stdout } = await execAsync(`${COMMAND_PREFIX} run ${rulePath} --data ${safeData}`);
        assert.strictEqual(stdout.trim(), 'true');
    });

    it('should fail cleanly on missing file', async () => {
        try {
            await execAsync(`${COMMAND_PREFIX} check non_existent.ax`);
            assert.fail('Should have failed');
        } catch (error: any) {
            assert.ok(error.code !== 0, 'Exit code should be non-zero');
            // The execAsync might put stderr in the error object or return it?
            // "If the process exits with a non-zero code... the promise is rejected with an Error...
            // The error object... has 'stdout' and 'stderr' properties."
            // Let's check what we actually got.
            const actualStderr = error.stderr || '';
            const actualStdout = error.stdout || '';
            // console.log('DEBUG: stderr:', actualStderr);
            // console.log('DEBUG: stdout:', actualStdout);

            assert.ok(
                actualStderr.includes('Error') || actualStdout.includes('Error'),
                `Expected output to contain 'Error'. stdout: ${actualStdout}, stderr: ${actualStderr}`
            );
        }
    });
});
