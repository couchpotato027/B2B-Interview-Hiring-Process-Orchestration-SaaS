import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';

const searchRouter = Router();
const controller = new SearchController();

// Advanced Search
searchRouter.post('/candidates', (req, res, next) => controller.search(req, res, next));

// Suggestions & Similarity
searchRouter.get('/suggestions/:jobId', (req, res, next) => controller.getSuggestions(req, res, next));
searchRouter.get('/similar/:candidateId', (req, res, next) => controller.getSimilar(req, res, next));

// Saved Searches
searchRouter.post('/save', (req, res, next) => controller.saveSearch(req, res, next));
searchRouter.get('/saved', (req, res, next) => controller.getSavedSearches(req, res, next));
searchRouter.get('/saved/:id/execute', (req, res, next) => controller.executeSavedSearch(req, res, next));
searchRouter.delete('/saved/:id', (req, res, next) => controller.deleteSavedSearch(req, res, next));

export { searchRouter };
