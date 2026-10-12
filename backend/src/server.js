import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

connectDB()
  .then(() => app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`)))
  .catch((e) => {
    console.error('Could not connect to MongoDB:', e.message);
    process.exit(1);
  });
