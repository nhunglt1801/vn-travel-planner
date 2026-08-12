import express from 'express';
import suggestRouter from './routes/suggest.js';
import imageRouter from './routes/image.js';

const app = express();
app.use(express.json());
app.use('/api', suggestRouter);
app.use('/api', imageRouter);

export default app;
