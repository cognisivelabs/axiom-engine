
import { Axiom } from '../../src/index';
import { ErrorReporter } from '../../src/common/ErrorReporter';
import * as fs from 'fs';
import * as path from 'path';

const RULES_PATH = path.join(__dirname, 'pricing.arl');
import { SchemaLoader } from '../../src/common/Contract';
const CONTRACT_PATH = path.join(__dirname, 'contract.json');

const source = fs.readFileSync(RULES_PATH, 'utf-8');
const contract = SchemaLoader.load(CONTRACT_PATH);

console.log("Compiling rules...");
const ast = Axiom.compile(source, 'pricing.arl');

// Verify types (Strict check enabled, with Output Validation)
try {
    Axiom.check(ast, contract, 'pricing.arl');
} catch (e: any) {
    ErrorReporter.report(e);
    process.exit(1);
}

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

    // Check if result matches structure
    const priceMatch = result.final_price === scenario.expectedPrice;

    // We could add more assertions here for discount breakdown
    // e.g. if (result.discount_percentage !== ...)

    console.log(`| ${scenario.name} | ${scenario.expectedPrice} | ${result.final_price} (pct: ${result.discount_percentage}%) | ${priceMatch ? '✅' : '❌'} |`);
}
