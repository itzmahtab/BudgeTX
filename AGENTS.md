<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Prisma v7 (migrations)

Prisma 7 requires `url`/`directUrl` in `prisma.config.ts`, not in `schema.prisma`. However, `prisma migrate dev` doesn't pick up `directUrl` from the config. Always use the `--url` flag with the direct (non-pooler) connection:

```
npx prisma migrate dev --name <name> --url "postgresql://postgres.jpetsppipvitgsvpyomv:LE9IvttoSksXcNJ0@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```
