import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { ensureUploadDirectories } from './services/storage.service.js';

const app = createApp();

await ensureUploadDirectories();

const server = app.listen(env.PORT, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : env.PORT;
  console.log(`Abol Coffee API running in ${env.NODE_ENV} mode on port ${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${env.PORT} is already in use. Stop the other process or set a free PORT in server/.env.`,
    );
  } else {
    console.error('Failed to start API server:', error);
  }
  process.exit(1);
});
