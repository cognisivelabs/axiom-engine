
import { Axiom } from '../src';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Utils
const ITERATIONS = 100_000;
const WARMUP = 1_000;

function runBenchmark(name: string, source: string, context: any) {
    console.log(`\nBenchmarking: ${name}`);
    console.log('------------------------------------------------');

    // 1. Compile (Outside of loop)
    const compileStart = performance.now();
    const ast = Axiom.compile(source);
    const compileTime = performance.now() - compileStart;
    console.log(`Compilation Time: ${compileTime.toFixed(4)}ms`);

    // 2. Warmup
    for (let i = 0; i < WARMUP; i++) {
        Axiom.execute(ast, context);
    }

    // 3. Execution Loop
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        Axiom.execute(ast, context);
    }
    const totalTime = performance.now() - start;

    // 4. Report
    const avgLatency = totalTime / ITERATIONS;
    const opsPerSec = Math.floor(1000 / avgLatency);

    console.log(`Iterations:       ${ITERATIONS.toLocaleString()}`);
    console.log(`Total Time:       ${totalTime.toFixed(2)}ms`);
    console.log(`Average Latency:  ${(avgLatency * 1000).toFixed(2)}µs`); // Microseconds
    console.log(`Throughput:       \x1b[32m${opsPerSec.toLocaleString()} ops/sec\x1b[0m`);

    return opsPerSec;
}

// ==========================================================
// SCENARIOS
// ==========================================================

// Scenario 1: Baseline Math
runBenchmark('Baseline: Arithmetic (1 + 2 * 3)', '1 + 2 * 3', {});

// Scenario 2: Deep Access
const deepContext = {
    user: {
        company: {
            address: {
                zip: "90210"
            }
        }
    }
};
runBenchmark('Memory: Deep Object Access', 'user.company.address.zip == "90210"', deepContext);

// Scenario 3: RBAC Policy (Complex)
const rbacPath = path.join(__dirname, '../examples/rbac');
const rbacSource = fs.readFileSync(path.join(rbacPath, 'policy.arl'), 'utf-8');
const rbacData = JSON.parse(fs.readFileSync(path.join(rbacPath, 'data.json'), 'utf-8'));

runBenchmark('Real World: RBAC Policy', rbacSource, rbacData);
