# Axiom Engine (`axiom-engine`)

**The Type-Safe Rule Engine for Node.js.**

Axiom is a lightweight, secure, and type-safe rule engine designed for the modern TypeScript/JavaScript ecosystem. It allows you to externalize business logic from your application code, empowering you to change rules without redeploying.

Inspired by **Google CEL** (Common Expression Language).

---

## 🚀 Features

*   **Type Safe**: Statically verifies your rules against your data schema *before* execution. Catch bugs at compile time.
*   **Secure by Design**: No access to `process`, `fs`, or network. No infinite loops (no `while`/`for`). Safe to run user-generated rules.
*   **Expression Oriented**: Supports implicit returns and easy-to-read syntax.
*   **JSON Context**: Pass native JSON objects as context; no complex class injections required.

---

## 📦 Installation

```bash
npm install axiom-engine
```

---

## 🛠 Usage

### 1. Write a Rule (`pricing.ax`)

```typescript
// pricing.ax
let discount: int = 0;

if (is_vip) {
    if (order_total > 1000) {
        discount = 20;
    } else {
        discount = 10;
    }
} else {
    discount = 0;
}

// Return the final price
base_price - discount
```

### 2. Execute in Node.js

```typescript
import { Axiom } from 'axiom-engine';
import * as fs from 'fs';

// 1. Define your data schema
const contextTypes = {
    is_vip: 'bool',
    order_total: 'int',
    base_price: 'int'
};

// 2. Compile the rule (Types are checked here!)
const source = fs.readFileSync('./pricing.ax', 'utf-8');
const rule = Axiom.compile(source);

// Verify that the rule matches your schema
Axiom.check(rule, contextTypes);

// 3. Execute with real data
const context = {
    is_vip: true,
    order_total: 1500,
    base_price: 100
};

const result = Axiom.execute(rule, context);
console.log(`Final Price: ${result}`); // Output: 80
```

---

## 📚 Language Reference

See [LANGUAGE.md](./LANGUAGE.md) for full syntax documentation.

-   **Types**: `int`, `string`, `bool`
-   **Statements**: `let`, `if/else`, `assignment`
-   **Operators**: `+`, `-`, `*`, `/`, `==`, `!=`

---

## 🏗 Project Structure

Axiom follows a modular architecture:

*   `src/common/`: AST and Token definitions.
*   `src/parser/`: Lexer and Parser (Source -> AST).
*   `src/checker/`: Type Checker (AST Verification).
*   `src/interpreter/`: Runtime Engine (AST Execution).

---

## License

MIT
