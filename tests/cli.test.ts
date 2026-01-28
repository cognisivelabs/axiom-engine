
import { test, describe, it } from 'node:test';
import * as assert from 'assert';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';
import * as fs from 'fs';

const execAsync = util.promisify(exec);
const CLI_PATH = path.resolve(__dirname, '../src/index.ts');
const COMMAND_PREFIX = `npx ts-node ${CLI_PATH}`;

describe('Axiom CLI Integration Tests', () => {

    const fixtureDir = path.resolve(__dirname, 'fixtures/simple');
    const rulePath = path.join(fixtureDir, 'math.arl');
    const contractPath = path.join(fixtureDir, 'contract.json');
    const dataPath = path.join(fixtureDir, 'data.json');

    it('should successfully run a valid rule with flags', async () => {
        const cmd = `${COMMAND_PREFIX} ${rulePath} --contract ${contractPath} --data ${dataPath}`;
        const { stdout, stderr } = await execAsync(cmd);
        assert.strictEqual(stderr, '');
        assert.ok(stdout.includes('Final Result: 30'), 'Should return correct calculation result 30');
    });

    it('should run all test rules in regression', async () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        const items = fs.readdirSync(fixturesDir);

        for (const item of items) {
            const dirPath = path.join(fixturesDir, item);
            if (!fs.statSync(dirPath).isDirectory()) continue;
            if (item === 'simple') continue; // Skip simple fixture used by other tests

            // Convention: rule file named same as directory + .arl
            const ruleFile = path.join(dirPath, `${item}.arl`);
            const contractFile = path.join(dirPath, 'contract.json');
            const dataFile = path.join(dirPath, 'data.json');

            if (fs.existsSync(ruleFile) && fs.existsSync(contractFile) && fs.existsSync(dataFile)) {
                // console.log(`Running regression for ${item}...`);
                const cmd = `${COMMAND_PREFIX} ${ruleFile} --contract ${contractFile} --data ${dataFile}`;
                try {
                    const { stdout, stderr } = await execAsync(cmd);
                    assert.strictEqual(stderr, '', `Error running ${item}`);
                    assert.ok(stdout.includes('Type Check Passed'), `${item} failed type check`);
                } catch (e: any) {
                    assert.fail(`Failed to execute ${item}: ${e.message}\n${e.stdout}\n${e.stderr}`);
                }
            }
        }
    });

    it('should fail if arguments are missing', async () => {
        try {
            await execAsync(`${COMMAND_PREFIX} ${rulePath}`);
            assert.fail('Should have failed');
        } catch (error: any) {
            assert.ok(error.message.includes('are required'), 'Should report missing args');
        }
    });

    it('should fail if file extension is invalid', async () => {
        try {
            await execAsync(`${COMMAND_PREFIX} invalid.txt`);
            assert.fail('Should have failed');
        } catch (error: any) {
            assert.ok(error.stderr.includes('must have an \'.arl\' extension'), 'Should check extension');
        }
    });

    it('should fail gracefully if file not found', async () => {
        try {
            await execAsync(`${COMMAND_PREFIX} missing.arl --contract ${contractPath} --data ${dataPath}`);
            assert.fail('Should have failed');
        } catch (error: any) {
            const output = error.stderr || error.stdout;
            assert.ok(output.includes('File not found'), 'Should report missing file');
        }
    });
});
