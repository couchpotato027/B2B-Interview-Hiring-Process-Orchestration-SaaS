import express from 'express';
import cors from 'cors';
import { logger } from './infrastructure/logger';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';
import routes from './routes';

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main API Routes
app.use(routes);

// Global Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
