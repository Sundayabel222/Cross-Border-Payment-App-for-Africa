const router = require('express').Router();
const { query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const { send, history } = require('../controllers/paymentController');
const paymentSendValidators = require('../validators/paymentSendValidators');
const { ALLOWED_HISTORY_ASSETS } = require('../utils/historyQuery');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.use(authMiddleware);

router.post('/send', paymentSendValidators, validate, idempotency, send);

router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('from')
      .optional({ values: 'falsy' })
      .trim()
      .isISO8601()
      .withMessage('from must be a valid ISO 8601 date'),
    query('to')
      .optional({ values: 'falsy' })
      .trim()
      .isISO8601()
      .withMessage('to must be a valid ISO 8601 date'),
    query('asset')
      .optional({ values: 'falsy' })
      .trim()
      .isIn(ALLOWED_HISTORY_ASSETS)
      .withMessage(`asset must be one of: ${ALLOWED_HISTORY_ASSETS.join(', ')}`),
  ],
  validate,
  history
);

module.exports = router;
