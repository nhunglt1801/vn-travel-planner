import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import suggestRouter from './routes/suggest.js';
import imageRouter from './routes/image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');

const app = express();
app.use(express.json());
app.use('/api', suggestRouter);
app.use('/api', imageRouter);

app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

export default app;
