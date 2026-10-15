const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_PRICE = 1000000;
const MAX_STOCK = 1000000;

const isString = (value) => typeof value === 'string';
const hasAtMostTwoDecimals = (value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

// Used for both create and update (PUT replaces all editable fields).
// Returns field -> message; the vendor is never read from the body.
const productSchema = ({ title, price, stock, description } = {}) => {
  const errors = {};

  if (!isString(title) || !title.trim()) errors.title = 'Title is required';
  else if (title.trim().length > MAX_TITLE_LENGTH) errors.title = `Title must be at most ${MAX_TITLE_LENGTH} characters`;

  if (typeof price !== 'number' || !Number.isFinite(price)) errors.price = 'Price must be a number';
  else if (price <= 0) errors.price = 'Price must be greater than 0';
  else if (price > MAX_PRICE) errors.price = `Price must be at most ${MAX_PRICE}`;
  else if (!hasAtMostTwoDecimals(price)) errors.price = 'Price can have at most 2 decimal places';

  if (typeof stock !== 'number' || !Number.isInteger(stock)) errors.stock = 'Stock must be a whole number';
  else if (stock < 0) errors.stock = 'Stock cannot be negative';
  else if (stock > MAX_STOCK) errors.stock = `Stock must be at most ${MAX_STOCK}`;

  if (description !== undefined && !isString(description)) errors.description = 'Description must be text';
  else if (description && description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
  }
  return errors;
};

module.exports = { productSchema };
