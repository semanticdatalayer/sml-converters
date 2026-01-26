# Coding Conventions

**Analysis Date:** 2026-01-26

## Naming Patterns

**Files:**
- Converters: `*-converter.ts` or `*-to-*-converter.ts` (e.g., `dbt-converter.ts`, `bim-to-sml-converter.ts`)
- Parsers: `*-parser.ts` (e.g., `dbt-parser.ts`, `bim-file-parser.ts`)
- Commands: `*-command.ts` (e.g., `dbt-to-sml-command.ts`, `bim-to-sml-command.ts`)
- Models/Types: `*.model.ts` or `types-and-interfaces.ts`
- Utilities: `*-util.ts` (e.g., `file-system-util.ts`, `enum-util.ts`)

**Functions:**
- camelCase for all functions: `parseInput`, `convertDimension`, `sortAlphabetically`
- Factory methods: `create()`, `for()` (e.g., `SmlResultWriter.create()`, `CommandLogger.for()`)
- Async functions use `async` keyword: `async run()`, `async convert()`
- Guard/validation: `should()`, `exists()`, `notEmpty()`, `ensure()`, `ensureType()`

**Variables:**
- camelCase for all variables and constants
- Private fields prefixed with underscore: `_connections`, `_models`, `_catalog`
- Type parameters in generics: `<T>` for generic type, `<K, V>` for key-value pairs
- Long lists use descriptive names: `absoluteSourcePath`, `absoluteOutputPath`

**Types:**
- PascalCase for all types, interfaces, classes, enums
- Interfaces: `I` prefix not used (e.g., `Logger` not `ILogger`)
- Exception: `IDbtConverterInput` follows legacy pattern in `src/commands/dbt-to-sml/model.ts`
- SML types imported from `sml-sdk`: `SMLModel`, `SMLDimension`, `SMLMetric`, etc.
- Enum: `DWType`, `SMLObjectType`, `SMLDimensionType`

## Code Style

**Formatting:**
- Tool: `prettier` with oclif config (`@oclif/prettier-config`)
- Trailing commas: enabled (all) - enforced in `.prettierrc.json`
- Line length: no explicit limit configured, follows prettier defaults

**Linting:**
- Tool: `eslint` with `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`
- Config: `.eslintrc.js` with TypeScript project awareness
- Key rules enforced:
  - `@typescript-eslint/no-misused-promises`: error - prevents forgetting await on promises
  - `@typescript-eslint/require-await`: error - async functions must use await
  - `@typescript-eslint/no-floating-promises`: error - unhandled promise rejections
  - `@typescript-eslint/no-explicit-any`: off - allows `any` type when needed
- ESLint compatible with Prettier: `eslint-config-prettier`

**TypeScript Configuration:**
- Target: ES2022
- Strict mode: enabled (`strict: true`)
- Declaration files: generated (`declaration: true`)
- Module: CommonJS
- Root: `src/`
- Output: `dist/`
- Key flags: `esModuleInterop`, `resolveJsonModule`

## Import Organization

**Order:**
1. External dependencies from `node_modules` (e.g., `@oclif/core`, `chalk`, `zod`)
2. SML SDK types: `sml-sdk`
3. Local shared utilities: `../../shared/` or `../../../shared/`
4. Local domain models/converters: relative paths from same command directory
5. Type imports: can be mixed with regular imports

**Path Aliases:**
- Not configured - uses relative paths throughout
- Pattern: `../`, `../../`, `../../../` for navigation

**Import Style:**
- Named imports preferred: `import { Guard, Logger } from "./shared/guard"`
- Default imports for classes: `import { DbtConverter } from "./dbt-converter"`
- Type imports not explicitly marked but TypeScript handles correctly
- Multi-line imports formatted for readability

Example from `src/commands/bim-to-sml/bim-converter/dimension-converter.ts`:
```typescript
import {
  SMLDimension,
  SMLDimensionHierarchy,
  // ... more types
} from "sml-sdk";
import { Logger } from "../../../shared/logger";
import { SmlConverterResult } from "../../../shared/sml-convert-result";
import { BimModel, BimTable } from "../bim-models/bim-model";
```

## Error Handling

**Primary Pattern: Guard Class**
- Location: `src/shared/guard.ts`
- Default instance: `export const Guard = new GuardImplementation(Error)`
- Methods for precondition validation:
  - `should(rule: boolean, msg: string)`: throws if rule is false
  - `exists(object: unknown, msg: string)`: throws if object is null/undefined/NaN
  - `notEmpty(value: string, msg: string)`: throws if string is empty after trim
  - `allRequired(values: AllRequiredInput)`: validates array of required values
  - `ensure<T>(object: T | undefined | null, msg: string): T`: throws and returns typed object
  - `ensureType<T>(object: unknown, typeGuard: (input: any) => input is T, msg: string): T`: type-safe guard

Usage pattern:
```typescript
Guard.should(inputFolderExists, `The source folder does not exists`);
Guard.notEmpty(value, "Database name is required");
const catalog = Guard.ensure(this._catalog, "catalog is not set");
```

**Error Throwing:**
- Use `Guard` for validation errors (preconditions, missing data)
- Throw `Error` directly for unexpected failures: `throw new Error("message")`
- Custom error constructors: `Guard.forError(CustomError)` to use different Error types
- Logger used alongside errors: log error, then throw or command.error()

Example from `src/shared/file-system-util.ts`:
```typescript
Guard.should(inputFolderExists, `The source folder does not exists`);
if (!inputFolderExists) {
  logger.error(outputNotEmptyMsg);
  command.error(outputNotEmptyMsg);
}
```

**Async Error Handling:**
- ESLint enforces proper promise handling
- `no-floating-promises`: requires await or explicit `.catch()`
- `no-misused-promises`: prevents passing promises to non-promise contexts

## Logging

**Framework:** Custom `Logger` interface + `CommandLogger` implementation
- Interface: `src/shared/logger.ts` - defines 7 log levels
- Implementation: `src/shared/command-logger.ts` - uses `@oclif/core` Command for output
- Creation: `CommandLogger.for(this)` in command files

**Log Levels:**
- `error(message)`: red color, always shown
- `warn(message)`: yellow color, always shown
- `info(message)`: default color, informational
- `http(message)`: HTTP-related operations
- `verbose(message)`: detailed operational logs
- `debug(message)`: debug-level information
- `silly(message)`: most verbose level

Usage pattern:
```typescript
const logger = CommandLogger.for(this);
logger.info(`Reading dbt from ${absoluteSourcePath}`);
logger.warn(`Warning about something`);
logger.error("Critical error message");
```

Test scripts use inline TestLogger implementation for flexibility.

## Comments

**When to Comment:**
- Complex logic that isn't self-evident
- Non-obvious design decisions
- TODO/FIXME items for future work
- Warning about gotchas or edge cases

**JSDoc/TSDoc:**
- Used for interface, function, and method documentation
- Format: `/** comment */` block comments
- Applied to public APIs and complex functions
- Example from `src/shared/array-util.ts`:
  ```typescript
  /**
   * Returns a new array with the elements sorted alphabetically based on the string value
   * returned by the provided selector function.
   *
   * @typeParam T - The type of elements in the input array.
   * @param array - The array of elements to sort.
   * @param selector - A function that takes an element and returns a string to use for sorting.
   * @returns A new array sorted alphabetically by the selected string value.
   */
  export const sortAlphabetically = <T>(array: T[], selector: (el: T) => string): T[] => {
    return [...array].sort((a, b) => selector(a).localeCompare(selector(b)));
  };
  ```

**Inline Comments:**
- Single-line `//` for brief clarifications
- Used sparingly, mainly for non-obvious logic
- Example: `// clear out the folder if user uses --clean`

**TODO Comments:**
- Marks intentional incomplete work
- Location: `src/shared/sml-result-writer.ts` - `//TODO: check whether file already exists and suffix it`
- DAX conversion fallback: `0 /* TODO: {original_dax} */` for unconvertible expressions

## Function Design

**Size:** No hard limit observed; functions range 5-50 lines
- Converter methods: ~20-50 lines, handle single responsibility
- Utility functions: 5-15 lines, single operation
- Commands: ~30 lines for run() method

**Parameters:**
- Typically 2-4 parameters
- Complex inputs grouped into interfaces: `(tableLists: TableLists, bim: BimRoot, attrMaps: AttributeMaps, result: SmlConverterResult)`
- Logger always included as parameter in converters
- No default parameters observed (explicit is preferred)

**Return Values:**
- Void for operations that mutate state via parameters
- Typed returns for data transformations: `Promise<string>`, `Array<SMLDimension>`
- Generic type parameters for collections: `<T>[]`
- Void for logging/persistence operations

**Example Converter Method** from `dimension-converter.ts`:
```typescript
convertDimension(
  bimTable: BimTable,
  bimModel: BimModel,
  attrNameMap: Map<string, string[]>,
  result: SmlConverterResult,
): void {
  // Implementation mutates result via methods like result.addDimension()
}
```

## Module Design

**Exports:**
- Named exports for classes, interfaces, types, functions
- One primary export per file (usually a class or main function)
- Type exports for interfaces: `export interface Logger { ... }`
- Utility exports: `export const Guard = new GuardImplementation(Error)`

**Barrel Files:**
- Not used - imports are always direct (e.g., `from "./guard"` not `from "./index"`)
- Reduces circular dependency risk

**Class Structure:**
- Constructor dependency injection: logger, config passed in constructor
- Factory methods used instead of constructors: `SmlResultWriter.create(logger)`
- Static methods for creation: `CommandLogger.for(command)`
- Getters/setters for controlled property access: `public get catalog()`, `public set catalog()`

Example from `src/shared/sml-result-writer.ts`:
```typescript
export class SmlResultWriter {
  static create(logger: Logger) {
    return new SmlResultWriter(logger);
  }

  constructor(private readonly logger: Logger) {}

  async persist(outputAbsolutePath: string, smlResult: SmlConverterResult): Promise<void> {
    // Implementation
  }
}
```

## Special Patterns

**Builder Pattern (SmlConvertResultBuilder):**
- Central accumulator for SML objects during conversion
- Located: `src/shared/sml-convert-result.ts`
- Private arrays with public add methods: `addDimension()`, `addModel()`, `addMetric()`
- Validates `unique_name` uniqueness across ALL objects
- Returns built result via `build(): SmlConverterResult`

**Strategy Pattern (Converters):**
- Each format has dedicated converters for different object types
- BIM: `TableConverter`, `DimensionConverter`, `MeasureConverter`, `RelationshipConverter`
- Injected with logger for consistent logging
- Called by orchestrator converter

**Factory Pattern:**
- Static create methods: `SmlResultWriter.create()`, `CommandLogger.for()`
- Encapsulates object creation logic
- Improves testability

---

*Convention analysis: 2026-01-26*
