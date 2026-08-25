import express from 'express';
const app = express();
app.get('/api/health', (_, res) => res.json({ status: 'UP' }));
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log('Running on ' + PORT));
