# Applying migrations

## Applying all pending migrations

You can apply all pending migrations with the following command:

```bash
npx monolayer migrations apply --phase all
```

The command will run all phases in the following order:

```mermaid
flowchart LR
    A[expand] --> B[alter] --> C[data] --> D[contract]
```

::: warning Recommended only for development
It's recommended to run this command only while developing your application.

When deploying your application, you should use apply migration phases individually.
:::

## Applying migration phases individually

Each migration phase has a corresponding migration command in the CLI.

### Expand Phase

```bash
npx monolayer migrations apply --phase expand
```

**Runs**: all pending expand migrations by timestamp.

### Alter Phase

```bash
npx monolayer migrations apply --phase alter
```

**Runs**: all pending `alter` migrations by timestamp.

**Dependencies**: `expand` migrations. It will fail early if there are pending `expand` migrations.

### Data Phase

```bash
npx monolayer migrations apply --phase data
```

**Runs**: all pending `data` migrations by timestamp.

**Dependencies**: `expand` and `alter` migrations. It will fail early if there are pending `expand` or `alter` migrations.

### Contract Phase

```bash
npx monolayer migrations apply --phase contract
```

**Runs**: all pending `contract` migrations by timestamp.

**Dependencies**: `expand` and `alter` migrations. It will fail early if there are pending `expand` or `alter` migrations.

### Contract Phase - Single Migration

```bash
npx monolayer migrations apply --phase contract single --name=<migration-name>
```

**Runs**: a single `contract` migration.

**Dependencies**: `expand` and `alter` migrations. It will fail early if there are pending `expand` or `alter` migrations.

## Migration warnings

From time to time, `monolayer-pg` will have to generate a migration that could be lead to:

- Destructive changes.
- Backwards incompatibility.
- Block the database while applying the migration.
- Potential failures during the migration process.

For this reason, `monolayer-pg` will generate a warning message to inform you about the potential issues that could be caused by the migration, and possible mitigation steps.

Here's an example of a warning message generated by `monolayer-pg` when adding a `NOT NULL` constraint to an existing column:

```text
│
▲   WARNING  Migration might fail
│
│  - Changed column to non-nullable (column: 'name' table: 'users' schema: 'public')
│
│  Making a column non-nullable on an existing table may fail if the column contains `NULL` values.
│
│  How to prevent a migration failure and application downtime:
│    1. Remove `NULL` values from the column.
│    2. Ensure existing applications always insert non `NULL` values into the column.
│    3. Make the column non-nullable.
```

## Rolling back migrations

You can rollback migrations with the following command:

```bash
npx monolayer migrations rollback
```

The command will prompt you to select a migration to rollback to.

::: warning Recommended only for development
You should use this command only while developing your application.

In the event that migrations fail in production environments, it's best to always move forward by fixing the underlying issue and then either re-apply migrations or generate new ones.
:::
