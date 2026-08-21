const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(
    [
      body('name').notEmpty().withMessage('Category name is required'),
      body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
      validate
    ],
    createCategory
  );

module.exports = router;
