
import { test, describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import { SchemaLoader } from '../src/common/Contract';

describe('SchemaLoader Tests', () => {

    const tempDir = path.join(__dirname, 'temp_schemas');

    // Setup: Create temp files
    before(() => {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    });

    it('should load a valid contract with inline definitions', () => {
        const file = path.join(tempDir, 'valid.json');
        const content = {
            name: "Inline",
            inputs: { "x": "int" },
            outputs: "int"
        };
        fs.writeFileSync(file, JSON.stringify(content));

        const contract = SchemaLoader.load(file);
        assert.strictEqual(contract.name, 'Inline');
        assert.strictEqual(contract.inputs.x, 'int');
    });

    it('should throw error if main contract file missing', () => {
        assert.throws(() => {
            SchemaLoader.load(path.join(tempDir, 'missing.json'));
        }, /Contract file not found/);
    });

    it('should throw error if referenced schema missing', () => {
        const file = path.join(tempDir, 'bad_ref.json');
        const content = {
            name: "BadRef",
            inputs: { "user": "./missing_user.json" },
            outputs: "int"
        };
        fs.writeFileSync(file, JSON.stringify(content));

        assert.throws(() => {
            SchemaLoader.load(file);
        }, /Referenced schema file not found/);
    });

    it('should correctly load recursive references', () => {
        // Create user.json
        const userPath = path.join(tempDir, 'User.json');
        fs.writeFileSync(userPath, JSON.stringify({
            "name": "string",
            "age": "int"
        }));

        // Create main
        const mainPath = path.join(tempDir, 'Main.json');
        fs.writeFileSync(mainPath, JSON.stringify({
            name: "Main",
            inputs: { "u": "./User.json" },
            outputs: "bool"
        }));

        const contract = SchemaLoader.load(mainPath);
        assert.strictEqual((contract.inputs.u as any).kind, 'object');
        assert.strictEqual((contract.inputs.u as any).properties.name, 'string');
    });

    // Cleanup
    after(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
});
