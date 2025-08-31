import { Router } from 'express';
import { MetadataController } from '../controllers/metadataController.js';

const router = Router();

router.get('/tags', MetadataController.searchTags);

router.get('/categories', MetadataController.searchCategories);

export default router;
