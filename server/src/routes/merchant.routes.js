const express = require('express');
const controller = require('../controllers/analytics.controller');
const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const { protect } = require('../middleware/auth');
const { analyticsQuerySchema } = require('../validators/analytics.validator');

const router = express.Router();

router.use(protect, authorize('merchant'));
router.get('/analytics', validate(analyticsQuerySchema, 'query'), controller.getSales);

module.exports = router;
