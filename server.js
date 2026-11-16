require('dotenv').config(); // load .env first

const express = require('express');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Inventory Management API is running' }));
app.use('/api/products', productRoutes);

app.use(notFound);
app.use(errorHandler); // must be last

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
