import { Hono } from 'hono';
import { html } from './html';
import { apiRouter } from './routes/api';

type Bindings = {
  GEMINI_API_KEY: string;
  PROXY_LIST: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.html(html);
});

// Mount modular API routes
app.route('/api', apiRouter);

export default app;
