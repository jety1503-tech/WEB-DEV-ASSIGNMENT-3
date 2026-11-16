const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const SORTABLE_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'createdAt', 'updatedAt'];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Condition: quantity <= reorderLevel
const LOW_STOCK_EXPR = { $expr: { $lte: ['$quantity', '$reorderLevel'] } };

// ---------- CREATE ----------
// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, price, quantity, reorderLevel, supplier } = req.body;
  const product = await Product.create({ name, sku, category, price, quantity, reorderLevel, supplier });
  res.status(201).json(product);
});

// ---------- READ ALL (filter + sort + paginate) ----------
// GET /api/products?category=Furniture&minPrice=100&maxPrice=5000&search=pen&lowStock=true&sort=-price&page=1&limit=10
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, lowStock, sort } = req.query;

  // ----- Filtering -----
  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(`^${escapeRegex(supplier)}$`, 'i');

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { sku: regex }];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      if (isNaN(Number(minPrice))) throw new AppError('minPrice must be a number', 400);
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      if (isNaN(Number(maxPrice))) throw new AppError('maxPrice must be a number', 400);
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (lowStock === 'true') Object.assign(filter, LOW_STOCK_EXPR);

  // ----- Sorting: sort=price  |  sort=-price  |  sort=category,-price -----
  let sortBy = '-createdAt';
  if (sort) {
    const fields = sort
      .split(',')
      .map((f) => f.trim())
      .filter((f) => SORTABLE_FIELDS.includes(f.replace('-', '')));
    if (fields.length) sortBy = fields.join(' ');
  }

  // ----- Pagination -----
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortBy).skip(skip).limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// ---------- READ ONE ----------
// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// ---------- UPDATE DETAILS ----------
// PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, price, quantity, reorderLevel, supplier } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { name, sku, category, price, quantity, reorderLevel, supplier },
    { new: true, runValidators: true } // return updated doc + apply schema validation
  );

  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// ---------- STOCK ADJUSTMENT (restock / sale) ----------
// PATCH /api/products/:id/stock   body: { "change": 10 } or { "change": -3 }
exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;

  // Single atomic operation: for a sale, only match if enough stock exists.
  // This prevents negative stock even if two requests arrive at the same time.
  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock for this sale', 400);
  }

  res.json({ message: 'Stock updated', product });
});

// ---------- DELETE ----------
// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ message: 'Product deleted', id: product.id });
});

// ---------- REPORT 1: LOW STOCK ----------
// GET /api/products/low-stock
exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find(LOW_STOCK_EXPR).sort('quantity');
  res.json({ count: lowStockItems.length, lowStockItems });
});

// ---------- REPORT 2: CATEGORY SUMMARY (Aggregation) ----------
// GET /api/products/summary
exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $set: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});
