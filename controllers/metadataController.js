import { TagService } from '../services/tagService.js';
import { CategoryService } from '../services/categoryService.js';

export class MetadataController {
  static async searchTags(req, res) {
    try {
      const { query = '' } = req.query;
      const tags = await TagService.searchTags(query, 20);
      res.json(tags);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  }

  static async searchCategories(req, res) {
    try {
      const { query = '' } = req.query;
      const categories = await CategoryService.searchCategories(query, 40);
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  }
}
