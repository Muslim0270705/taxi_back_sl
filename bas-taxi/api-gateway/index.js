import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes/route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`API Gateway запущен на порту ${PORT}`);
});
