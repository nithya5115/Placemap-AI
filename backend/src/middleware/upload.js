import multer from 'multer';
// Memory storage: the file is parsed and discarded, never written to disk.
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 } });
