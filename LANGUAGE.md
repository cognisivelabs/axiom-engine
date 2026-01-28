# Axiom Language Specification (`.ax`)

Axiom is a type-safe, expression-oriented rule language. It is designed to be readable, secure, and deterministic.

## Data Types

Axiom supports the following primitive types:

| Type | Description | Example |
| :--- | :--- | :--- |
| `int` | Integer numbers | `42`, `-10`, `0` |
| `string` | Text strings | `"Hello"`, `"Gold"` |
| `bool` | Boolean values | `true`, `false` |
| `date` | Date and Time | `timestamp("2023-01-01")` |

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
| `>`, `<`, `>=`, `<=` | `int`, `date` | `bool` |
| `&&`, `||` | `bool` | `bool` |
| `!` (Unary) | `bool` | `bool` |
| `.` (Member Access) | `object` | `any` |
| `in` | `scalar, list` | `bool` |

## Standard Library (Built-in Functions)

### String Functions
| Function | Description | Example |
| :--- | :--- | :--- |
| `startsWith(str, prefix)` | Checks if string starts with prefix | `startsWith("hello", "he")` -> `true` |
| `endsWith(str, suffix)` | Checks if string ends with suffix | `endsWith("hello", "lo")` -> `true` |
| `contains(str, substr)` | Checks if string contains substring | `contains("hello", "ell")` -> `true` |
| `length(str)` | Returns length of string | `length("hello")` -> `5` |

### Date Functions
| Function | Description | Example |
| :--- | :--- | :--- |
| `timestamp(iso_str)` | Parses ISO 8601 string to date | `timestamp("2023-01-01T00:00:00Z")` |

### List Macros
Macros operate on lists using lambda syntax.

| Macro | Description | Example |
| :--- | :--- | :--- |
| `.exists(item, predicate)` | Returns true if ANY item matches | `[1, 2, 3].exists(n, n > 2)` |
| `.all(item, predicate)` | Returns true if ALL items match | `[1, 2, 3].all(n, n > 0)` |

## Context (Input Variables)
Variables passed from the Host Application are available globally. 
Context can contain **nested objects**. Access them using **Dot Notation**.

```typescript
// Context: { user: { name: 'Alice', address: { city: 'Wonderland' } } }

if (user.address.city == "Wonderland") {
    // ...
}
```

**Example**:
If host passes `{ user_age: 25 }`, you can just use:
```typescript
if (user_age > 18) { ... }
```
