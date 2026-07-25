import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { ensureUploadDirectories } from './services/storage.service.js';

const app = createApp();

await ensureUploadDirectories();

app.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
