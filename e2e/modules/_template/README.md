# Adding a New E2E Test Module

To add tests for a new ERP module (e.g., HRMS, Production, Inventory):

## 1. Copy this template

```bash
cp -r e2e/modules/_template e2e/modules/<module-name>
# Example: cp -r e2e/modules/_template e2e/modules/hrms
```

## 2. Rename and edit files

### `api.client.ts`
- Rename the class (e.g., `HRMSApiClient`)
- Add your module's API methods

### `routes.ts`
- Define all your module's web routes

### `fixture.ts`
- Update the import to use your module's ApiClient class
- Rename the fixture

### `tests/api.spec.ts`
- Write API integration tests for your module's endpoints

### `tests/navigation.spec.ts`
- Test that all your module's screens load correctly

### `pages/`
- Add Page Object Models for complex screens

## 3. Register in playwright.config.ts

Add two entries in the `projects` array:

```typescript
{
  name: '<module>:api',
  testMatch: /modules\/<module>\/tests\/api\.spec\.ts/,
  use: { ...devices['Desktop Chrome'] },
},
{
  name: '<module>',
  testMatch: /modules\/<module>\/tests\/(?!api\.).*\.spec\.ts/,
  dependencies: ['auth-setup'],
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'e2e/.auth/company-admin.json',
  },
},
```

## 4. Add npm scripts in package.json

```json
"test:e2e:<module>": "npx playwright test --project=auth-setup --project=<module>:api --project=<module> --headed",
"test:e2e:<module>:api": "npx playwright test --project=<module>:api"
```

## 5. Run your tests

```bash
pnpm test:e2e:<module>        # Full module tests
pnpm test:e2e:<module>:api    # API only
```
