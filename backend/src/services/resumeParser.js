import path from 'node:path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { AppError } from '../utils/AppError.js';

// Checks extension AND file signature, so a renamed .exe/.txt is rejected.
export async function extractText(buf, filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const isPdf = buf.subarray(0, 4).toString('latin1') === '%PDF';
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
  let text;
  try {
    if (ext === '.pdf' && isPdf) text = (await pdfParse(buf)).text;
    else if (ext === '.docx' && isZip) text = (await mammoth.extractRawText({ buffer: buf })).value;
    else throw new AppError('Only genuine PDF or DOCX files are accepted (old .doc is not supported).', 400);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('Could not read this file. It may be damaged or password-protected.', 422);
  }
  text = text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 50) throw new AppError('No readable text found. Scanned/image PDFs are not supported (no OCR).', 422);
  return text;
}
