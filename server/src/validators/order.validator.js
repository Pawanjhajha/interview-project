const MAX_LINES = 50;
const MAX_QUANTITY = 99;
const OBJECT_ID = /^[a-f\d]{24}$/i;
const CHECKOUT_ID = /^[\w-]{16,64}$/;

// Only ids and quantities are accepted; prices and totals are always computed on the server.
const checkoutSchema = ({ checkoutId, items } = {}) => {
  const errors = {};

  if (typeof checkoutId !== 'string' || !CHECKOUT_ID.test(checkoutId)) errors.checkoutId = 'A valid checkout id is required';

  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'Your cart is empty';
    return errors;
  }
  if (items.length > MAX_LINES) {
    errors.items = `A cart can hold at most ${MAX_LINES} different products`;
    return errors;
  }

  const seen = new Set();
  items.forEach((item, index) => {
    const { productId, quantity } = item ?? {};
    if (typeof productId !== 'string' || !OBJECT_ID.test(productId)) {
      errors[`items.${index}.productId`] = 'Invalid product';
    } else if (seen.has(productId)) {
      errors.items = 'Each product can appear only once';
    }
    seen.add(productId);

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      errors[`items.${index}.quantity`] = `Quantity must be a whole number from 1 to ${MAX_QUANTITY}`;
    }
  });
  return errors;
};

module.exports = { checkoutSchema, MAX_QUANTITY };
