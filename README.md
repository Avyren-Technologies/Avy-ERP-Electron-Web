# Web Deployment Notes

This app uses React Router with `BrowserRouter`. Deep links like `/app/dashboard` require SPA fallback routing in production so the server returns `index.html` for unknown paths.

## Vercel

`vercel.json` is included with filesystem-first routing and SPA fallback:

- serve real files first
- route all other paths to `index.html`

This fixes hard refresh / direct access on protected routes.

## VPS (Nginx)






Use the sample config in `deploy/nginx-spa.conf` and make sure this line is present in the `/` location:

- `try_files $uri $uri/ /index.html;`

Without this fallback, refreshing any non-root route (for example `/app/dashboard`) returns a blank page or 404.

## Additional static-host safety

- `public/_redirects` is included for hosts that support redirects files.
- Build also generates `dist/404.html` from `dist/index.html` as an extra SPA fallback.
