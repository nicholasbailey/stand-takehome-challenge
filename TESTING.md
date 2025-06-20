# Testing Guide

This monorepo uses Jest for testing across all packages. Each package has its own testing setup optimized for its specific needs.

## Quick Start

```bash
# Install all dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Package-Specific Testing

### Backend (mitigation-rules-engine)
- **Framework**: Jest + ts-jest
- **Test Types**: Unit tests, Integration tests
- **Location**: `packages/mitigation-rules-engine/src/**/*.test.ts`

```bash
# Run backend tests
npm run test:backend

# Run with coverage
npm run test:coverage --workspace=packages/mitigation-rules-engine

# Run in watch mode
npm run test:watch --workspace=packages/mitigation-rules-engine
```

### Frontend Apps (React)
Both `underwriting-ui` and `applied-sciences-ui` use:
- **Framework**: Jest + React Testing Library (via react-scripts)
- **Test Types**: Component tests, Integration tests
- **Location**: `packages/*/src/**/*.test.tsx`

```bash
# Run underwriting UI tests
npm run test:underwriting-ui

# Run applied sciences UI tests
npm run test:applied-sciences-ui

# Interactive mode (for development)
npm run test --workspace=packages/underwriting-ui
npm run test --workspace=packages/applied-sciences-ui
```

### Shared Package
- **Framework**: Jest + ts-jest
- **Test Types**: Unit tests for shared utilities and types
- **Location**: `packages/shared/src/**/*.test.ts`

```bash
# Run shared package tests
npm run test:shared
```

## Testing Patterns

### Backend Testing
```typescript
// packages/mitigation-rules-engine/src/engine/__tests__/model.test.ts
import { ValueASTNode } from '../model';

describe('AST Model Classes', () => {
  it('should evaluate correctly', () => {
    const node = new ValueASTNode(42);
    expect(node.evaluate({})).toBe(42);
  });
});
```

### React Component Testing
```typescript
// packages/underwriting-ui/src/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  expect(screen.getByText(/underwriting/i)).toBeInTheDocument();
});
```

## Configuration Files

- **Backend**: `packages/mitigation-rules-engine/jest.config.js`
- **Shared**: `packages/shared/jest.config.js`
- **React Apps**: Use react-scripts built-in Jest config

## Coverage Reports

Coverage reports are generated in each package's `coverage/` directory:
- `packages/mitigation-rules-engine/coverage/`
- `packages/shared/coverage/`
- React apps generate coverage when running `npm run test:coverage`

## Best Practices

1. **Test Structure**: Follow the AAA pattern (Arrange, Act, Assert)
2. **Test Naming**: Use descriptive test names that explain the expected behavior
3. **Mocking**: Mock external dependencies and database calls
4. **Coverage**: Aim for >80% code coverage
5. **Integration Tests**: Test the full request/response cycle for APIs
6. **Component Tests**: Test user interactions and component behavior

## Continuous Integration

All tests run automatically on:
- Pull requests
- Main branch pushes
- Release builds

Use `npm run test:coverage` in CI to ensure coverage thresholds are met. 