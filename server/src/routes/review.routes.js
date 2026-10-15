const express = require('express');
const controller = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { reviewSchema } = require('../validators/review.validator');

// Mounted at /api/products/:id/reviews, so the product id comes from the parent path.
const router = express.Router({ mergeParams: true });

router.get('/', controller.list);
router.post('/', protect, validate(reviewSchema), controller.create);

module.exports = router;
