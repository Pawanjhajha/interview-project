const express = require('express');
const controller = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const { protect } = require('../middleware/auth');
const { productSchema } = require('../validators/product.validator');

const router = express.Router();
const merchantOnly = [protect, authorize('merchant')];

// Public catalog.
router.get('/', controller.list);

// Merchant inventory. `/mine` must stay above `/:id`.
router.get('/mine', merchantOnly, controller.listMine);
router.post('/', merchantOnly, validate(productSchema), controller.create);

router.get('/:id', controller.get);
router.put('/:id', merchantOnly, validate(productSchema), controller.update);
router.delete('/:id', merchantOnly, controller.remove);

module.exports = router;
