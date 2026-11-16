const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Rejects malformed :id params before they reach the database
module.exports = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError(`Invalid product id: ${req.params.id}`, 400));
  }
  next();
};
