# Axiom Language Specification (`.ax`)

Axiom is a type-safe, expression-oriented rule language. It is designed to be readable, secure, and deterministic.

## Data Types

Axiom supports the following primitive types:

| Type | Description | Example |
| :--- | :--- | :--- |
| `int` | Integer numbers | `42`, `-10`, `0` |
| `string` | Text strings | `"Hello"`, `"Gold"` |
| `bool` | Boolean values | `true`, `false` |

## Variables

Variables must be strictly typed upon declaration.

```typescript
let price: int = 100;
let user_name: string = "Alice";
let is_valid: bool = true;
```

**Re-assignment** (Mutable variables):
```typescript
let discount: int = 0;
discount = 20; // Type must match declaration
```

## Logic & Control Flow

### If / Else
Standard conditional logic.
```typescript
if (is_vip) {
  discount = 20;
} else {
  discount = 0;
}
```

### Implicit Return
The **last statement* in the script is automatically returned as the result.
```typescript
let final_price: int = 100;
final_price; // The script returns 100
```

## Operators

| Operator | Supported Types | Result |
| :--- | :--- | :--- |
| `+`, `-`, `*`, `/` | `int` | `int` |
| `==`, `!=` | All Types | `bool` |

## Context (Input Variables)
Variables passed from the Host Application are available globally. You do not need to declare them; they are injected.

**Example**:
If host passes `{ user_age: 25 }`, you can just use:
```typescript
if (user_age > 18) { ... }
```
