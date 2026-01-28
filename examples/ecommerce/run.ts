
import { Axiom } from '../../src/index'; // Relative import assuming compiled output structure or ts-node from root
import * as fs from 'fs';
import * as path from 'path';

const RULES_PATH = path.join(__dirname, 'pricing.ax');
const CONTEXT_PATH = path.join(__dirname, 'context.json');

const source = fs.readFileSync(RULES_PATH, 'utf-8');
const contextDef = JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf-8'));

console.log("Compiling rules...");
const ast = Axiom.compile(source);

// Verify types (optional but good practice)
// Note: our simple context.json uses "list" which implies list<any> or needs handling in TypeChecker for strictness.
// For now we might skip strict check inside this script if TypeChecker is strict about list generics.
Axiom.check(ast, contextDef);

const scenarios = [
    {
        name: "Standard VIP User",
        data: {
            user: { is_vip: true, email: "alice@gmail.com", state: "CA" },
            cart: { total: 100, items: [] as any[] },
            platform: { promo_code: "" },
            execution_date: "2026-01-28T00:00:00Z",
            event_start_date: "2026-02-05T00:00:00Z"
        },
        expectedPrice: 90 // 10% off
    },
    {
        name: "Corporate + Bulk + Future Sale",
        data: {
            user: { is_vip: false, email: "bob@cognisive.com", state: "NY" }, // 5% corp
            cart: { total: 1000, items: [] as any[] }, // 5% bulk
            platform: { promo_code: "" },
            execution_date: "2026-02-06T00:00:00Z", // Future date -> +15% sale
            event_start_date: "2026-02-05T00:00:00Z"
        },
        expectedPrice: 1000 * (1 - (0.05 + 0.05 + 0.15)) // 750
    },
    {
        name: "Restricted Shipping (AK)",
        data: {
            user: { is_vip: true, email: "alice@gmail.com", state: "AK" }, // 10% vip
            cart: { total: 100, items: [] as any[] },
            platform: { promo_code: "" },
            execution_date: "2026-01-28T00:00:00Z",
            event_start_date: "2026-02-05T00:00:00Z"
        },
        expectedPrice: 100 // 10% VIP - 10% Shipping Penalty = 0% net discount
    }
];

console.log("\nRunning Scenarios:\n");

console.log("| Scenario | Expected | Actual | Result |");
console.log("| :--- | :--- | :--- | :--- |");

for (const scenario of scenarios) {
    const result = Axiom.execute(ast, scenario.data);
    const pass = result === scenario.expectedPrice;
    console.log(`| ${scenario.name} | ${scenario.expectedPrice} | ${result} | ${pass ? '✅' : '❌'} |`);
}
