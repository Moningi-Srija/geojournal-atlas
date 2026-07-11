import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'unshorten-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/unshorten')) {
            const urlObj = new URL(req.url, 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }

            try {
              // Perform fetch on the local dev server without user agents to get a standard 302 redirect header
              const response = await fetch(targetUrl, {
                method: 'GET',
                redirect: 'manual',
              });

              const redirectUrl = response.headers.get('location');
              res.setHeader('Content-Type', 'application/json');
              
              if (redirectUrl) {
                res.end(JSON.stringify({ success: true, finalUrl: redirectUrl }));
              } else {
                // Fallback to response url if no redirect header is present
                res.end(JSON.stringify({ success: true, finalUrl: response.url || targetUrl }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
});
