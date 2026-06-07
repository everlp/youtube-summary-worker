import { serve } from '@hono/node-server';
import app from './index';

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

console.log(`Starting Hono server on port ${port}...`);

serve({
  fetch: (request) => {
    // Inject process environment variables into Hono bindings
    const env = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      PROXY_LIST: process.env.PROXY_LIST || ''
    };
    return app.fetch(request, env);
  },
  port
});
