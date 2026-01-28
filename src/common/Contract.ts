
import * as fs from 'fs';
import * as path from 'path';
import { Type } from './AST';
import { TypeChecker } from '../checker/TypeChecker';

/**
 * Defines the Interface (Contract) for a Rule.
 * Specifies expected Input variables and Output return type.
 */
export interface ContractDef {
    name: string;
    inputs: Record<string, Type>;
    outputs?: Type;
}

/**
 * Utility to load and resolve Contract definitions from JSON files.
 * Supports recursive file references for modular schemas.
 */
export class SchemaLoader {
    /**
     * Loads a contract.json file and checks all references.
     * @param filePath Absolute or relative path to the contract file.
     */
    static load(filePath: string): ContractDef {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Contract file not found: ${filePath}`);
        }

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const dir = path.dirname(filePath);

        return {
            name: content.name || 'Unnamed Contract',
            inputs: this.resolveSchemaMap(content.inputs, dir),
            outputs: content.outputs ? this.resolveType(content.outputs, dir) : undefined
        };
    }

    /**
     * Resolves a map of input definitions, handling external file references for the entire map.
     */
    private static resolveSchemaMap(schemaMap: any, baseDir: string): Record<string, Type> {
        if (!schemaMap) return {};

        // Feature: Allow the entire map to be a reference
        if (typeof schemaMap === 'string') {
            const refPath = path.resolve(baseDir, schemaMap);
            if (!fs.existsSync(refPath)) {
                throw new Error(`Referenced contract part not found: ${refPath}`);
            }
            const content = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
            // Recursively resolve
            return this.resolveSchemaMap(content, path.dirname(refPath));
        }

        const resolved: Record<string, Type> = {};
        for (const [key, value] of Object.entries(schemaMap)) {
            resolved[key] = this.resolveType(value, baseDir);
        }
        return resolved;
    }

    /**
     * Resolves a single type definition (Primitive, Object, List, or File Reference).
     */
    private static resolveType(def: any, baseDir: string): Type {
        // Case 1: Reference to external file (starts with . or /)
        if (typeof def === 'string' && (def.startsWith('./') || def.startsWith('/') || def.endsWith('.json'))) {
            const schemaPath = path.resolve(baseDir, def);
            if (!fs.existsSync(schemaPath)) {
                throw new Error(`Referenced schema file not found: ${schemaPath}`);
            }
            const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
            // Recursively validate/resolve the external schema
            return this.resolveType(schemaContent, path.dirname(schemaPath));
        }

        // Case 1.5: Array (List definition)
        if (Array.isArray(def)) {
            if (def.length !== 1) {
                throw new Error("List definition must have exactly one element specifying the type, e.g. [ 'int' ] or [ { ... } ]");
            }
            return { kind: 'list', elementType: this.resolveType(def[0], baseDir) };
        }

        // Case 2: Object definition (inline or loaded from file)
        if (typeof def === 'object' && def !== null && !def.kind) {
            const properties: Record<string, Type> = {};
            for (const [key, val] of Object.entries(def)) {
                properties[key] = this.resolveType(val, baseDir);
            }
            return { kind: 'object', properties };
        }

        // Case 3: Primitive or Array
        if (typeof def === 'string') {
            return TypeChecker.validateType(def);
        }

        return TypeChecker.validateType(def);
    }
}
