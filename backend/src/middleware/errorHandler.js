import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  if (err.code === 11000) return res.status(409).json({ message: 'Record already exists' });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 3 MB)' : 'Upload failed' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: err.expose ? err.message : 'Something went wrong on the server',
    ...(env.NODE_ENV === 'development' && status >= 500 ? { debug: err.message } : {}),
  });
}
