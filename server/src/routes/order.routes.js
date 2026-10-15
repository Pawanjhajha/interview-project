const express = require('express');
const controller = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { checkoutSchema } = require('../validators/order.validator');

const router = express.Router();

router.use(protect);
router.get('/', controller.list);
router.post('/checkout', validate(checkoutSchema), controller.checkout);

module.exports = router;
