import express, { Request } from 'express';
import multer from 'multer';
import fs from 'fs';
import { parse } from 'csv-parse';
import { z } from 'zod';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/echo', (req, res) => {
  const schema = z.object({ message: z.string() });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }
  res.json({ message: result.data.message });
});

const upload = multer({ dest: 'data/uploads/' });
app.post(
  '/upload',
  upload.single('file'),
  (req: Request & { file?: Express.Multer.File }, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'file required' });
    }
    const records: unknown[] = [];
    fs.createReadStream(file.path)
      .pipe(parse())
      .on('data', (data) => records.push(data))
      .on('end', () => res.json({ rows: records.length }))
      .on('error', (err) => res.status(500).json({ error: err.message }));
  },
);

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
