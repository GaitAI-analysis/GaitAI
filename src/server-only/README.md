# Server-only application code

GitHub Pages serves only the static export from `out`, so the admin page and
API route implementations are preserved here but are intentionally excluded
from the Next.js `app` router. They require a separate Node.js backend before
they can be made live again.

Preserved routes:

- `/admin`
- `/api/auth`
- `/api/posts`
- `/api/posts/[id]`
- `/api/upload`
