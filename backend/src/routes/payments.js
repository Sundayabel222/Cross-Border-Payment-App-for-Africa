const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');
const StellarSdk = require('@stellar/stellar-sdk');
const authMiddleware = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const paymentSendValidators = require('../validators/paymentSendValidators');
const { send, history, exportCSV, estimateFee } = require('../controllers/paymentController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.use(authMiddleware);

router.get('/estimate-fee', estimateFee);

router.post('/send', paymentSendValidators, validate, idempotency, send);

router.get('/history',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ],
  validate,
  history
);

router.get('/export', exportCSV);

module.exports = router;
