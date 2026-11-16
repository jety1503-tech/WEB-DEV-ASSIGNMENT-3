const express = require('express');
const ctrl = require('../controllers/productController');
const validateObjectId = require('../middleware/validateObjectId');
const validateStockChange = require('../middleware/validateStockChange');

const router = express.Router();

// IMPORTANT: fixed paths (/low-stock, /summary) must come BEFORE "/:id",
// otherwise Express treats "low-stock" as an id.
router.get('/low-stock', ctrl.getLowStock);
router.get('/summary', ctrl.getCategorySummary);

router.route('/').post(ctrl.createProduct).get(ctrl.getProducts);

router
  .route('/:id')
  .get(validateObjectId, ctrl.getProductById)
  .put(validateObjectId, ctrl.updateProduct)
  .delete(validateObjectId, ctrl.deleteProduct);

router.patch('/:id/stock', validateObjectId, validateStockChange, ctrl.adjustStock);

module.exports = router;
