const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');
const parsePagination = require('../utils/parsePagination');

const list = asyncHandler(async (req, res) => {
  const result = await productService.listAvailable(parsePagination(req.query));
  res.status(200).json({ success: true, ...result });
});

const get = asyncHandler(async (req, res) => {
  const product = await productService.getPublic(req.params.id);
  res.status(200).json({ success: true, product });
});

const listMine = asyncHandler(async (req, res) => {
  const products = await productService.listByVendor(req.user.id);
  res.status(200).json({ success: true, products });
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.user.id, req.body);
  res.status(201).json({ success: true, product });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.user.id, req.body);
  res.status(200).json({ success: true, product });
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Product deleted' });
});

module.exports = { list, get, listMine, create, update, remove };
