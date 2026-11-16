const AppError = require('../utils/AppError');

// Validates body of PATCH /:id/stock  ->  { "change": 10 } or { "change": -3 }
module.exports = (req, res, next) => {
  const { change } = req.body;

  if (change === undefined) {
    return next(new AppError('"change" is required (positive = restock, negative = sale)', 400));
  }
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(new AppError('"change" must be a non-zero whole number', 400));
  }
  next();
};
