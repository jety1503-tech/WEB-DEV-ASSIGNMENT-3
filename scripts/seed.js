// Run with: npm run seed   (adds 12 sample products; clears existing ones first)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-101', category: 'Furniture', price: 5499, quantity: 15, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Laptop 15 inch', sku: 'ELEC-LP-001', category: 'Electronics', price: 45999, quantity: 5, reorderLevel: 5, supplier: 'Dell India' },
  { name: 'Wireless Mouse', sku: 'ELEC-MS-014', category: 'Electronics', price: 799, quantity: 40, reorderLevel: 10, supplier: 'Logitech' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-022', category: 'Electronics', price: 2499, quantity: 3, reorderLevel: 8, supplier: 'boAt' },
  { name: 'USB-C Cable', sku: 'ELEC-CB-033', category: 'Electronics', price: 299, quantity: 48, reorderLevel: 15, supplier: 'Anker' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-201', category: 'Apparel', price: 599, quantity: 60, reorderLevel: 20, supplier: 'Levis' },
  { name: 'Denim Jeans', sku: 'APRL-JN-202', category: 'Apparel', price: 2199, quantity: 18, reorderLevel: 10, supplier: 'Levis' },
  { name: 'Notebook A4 (Pack of 5)', sku: 'STNY-NB-301', category: 'Stationery', price: 250, quantity: 6, reorderLevel: 12, supplier: 'Classmate' },
  { name: 'Gel Pen Pack of 15', sku: 'STNY-PN-713', category: 'Stationery', price: 120, quantity: 40, reorderLevel: 20, supplier: 'Cello Pens' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-401', category: 'Grocery', price: 650, quantity: 25, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-402', category: 'Grocery', price: 899, quantity: 4, reorderLevel: 6, supplier: 'Figaro' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
