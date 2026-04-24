import { Router } from 'express';
import { exportCandidates, importCandidates, downloadTemplate } from '../controllers/DataExchangeController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const exchangeRouter = Router();

// /api/v1/exchange
exchangeRouter.post('/candidates/export', exportCandidates);
exchangeRouter.post('/candidates/import', upload.single('file'), importCandidates);
exchangeRouter.get('/candidates/template', downloadTemplate);

export { exchangeRouter };
