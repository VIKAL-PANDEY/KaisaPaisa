const express = require('express');
const { body } = require('express-validator');
const { getAccounts, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(
    [
      body('name').notEmpty().withMessage('Account name is required'),
      validate
    ],
    createAccount
  );

router.route('/:id')
  .put(updateAccount)
  .delete(deleteAccount);

module.exports = router;
