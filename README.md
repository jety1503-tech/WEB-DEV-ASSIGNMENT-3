# Inventory and Data Management System (Assignment 3 – Web Dev III)

A RESTful backend built with **Node.js, Express.js, MongoDB (Mongoose) and dotenv**.
It manages a product catalogue: CRUD, filtering/sorting/pagination, stock adjustment,
a low-stock report and a category-wise summary (aggregation).

---

## 1. Setup (5 minutes)

**Requirements:** Node.js 18+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
cd inventory-management-system
npm install
```

Check the `.env` file (already created):

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
```

> Using MongoDB Atlas? Replace `MONGO_URI` with your Atlas connection string.

Load 12 sample products (optional but recommended for testing):

```bash
npm run seed
```

Start the server:

```bash
npm start          # normal
npm run dev        # auto-restart on file changes
```

You should see:
```
MongoDB connected: 127.0.0.1
Server running on http://localhost:5000
```

---

## 2. Folder Structure

```
inventory-management-system/
├── server.js                      # entry point, middleware, routes
├── .env                           # PORT and MONGO_URI
├── config/db.js                   # MongoDB connection
├── models/Product.js              # schema + validation + stockValue virtual
├── controllers/productController.js   # all the logic
├── routes/productRoutes.js        # URL -> controller mapping
├── middleware/
│   ├── errorHandler.js            # 404 + centralized error handling
│   ├── validateObjectId.js        # checks :id is a valid ObjectId
│   └── validateStockChange.js     # checks body of stock PATCH
├── utils/                         # AppError class, asyncHandler wrapper
└── scripts/seed.js                # sample data
```

---

## 3. API Endpoints

| # | Method | URL | Purpose | Success |
|---|--------|-----|---------|---------|
| 1 | POST   | `/api/products` | Create product | 201 |
| 2 | GET    | `/api/products` | List with filter, sort, pagination | 200 |
| 3 | GET    | `/api/products/:id` | Single product | 200 |
| 4 | PUT    | `/api/products/:id` | Update product details | 200 |
| 5 | PATCH  | `/api/products/:id/stock` | Restock / sale | 200 |
| 6 | DELETE | `/api/products/:id` | Delete product | 200 |
| 7 | GET    | `/api/products/low-stock` | Items with quantity ≤ reorderLevel | 200 |
| 8 | GET    | `/api/products/summary` | Category-wise summary (aggregation) | 200 |

### Product fields

| Field | Rules |
|-------|-------|
| name | required, 2–100 chars |
| sku | required, **unique**, auto-uppercased, only letters/numbers/hyphens |
| category | required, one of: Electronics, Apparel, Furniture, Stationery, Grocery, Other |
| price | required, ≥ 0 |
| quantity | required, whole number ≥ 0 (default 0) |
| reorderLevel | whole number ≥ 0 (default 10) |
| supplier | optional (default "Unknown") |
| stockValue | *virtual*, = price × quantity (not stored in DB) |

---

## 4. How to Test in Postman (follow this order)

### 1) Create product — `POST http://localhost:5000/api/products`
Body → raw → JSON
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```
Copy the `_id` from the response – you need it below.

### 2) Get all — `GET http://localhost:5000/api/products`
Useful query parameters (combine them freely):

| Query | Example | Meaning |
|-------|---------|---------|
| category | `?category=Furniture` | exact category (case-insensitive) |
| supplier | `?supplier=Levis` | exact supplier |
| search | `?search=pen` | name or SKU contains text |
| minPrice / maxPrice | `?minPrice=100&maxPrice=1000` | price range |
| lowStock | `?lowStock=true` | only low-stock items |
| sort | `?sort=price` / `?sort=-price` / `?sort=category,-price` | `-` means descending |
| page, limit | `?page=2&limit=5` | pagination (default page 1, limit 10, max 100) |

Example: `GET /api/products?category=Electronics&sort=-price&page=1&limit=5`

Response shape:
```json
{ "total": 12, "page": 1, "totalPages": 2, "count": 10, "products": [ ... ] }
```

### 3) Get one — `GET /api/products/<id>`

### 4) Update details — `PUT /api/products/<id>`
```json
{ "name": "Gel Pen Pack of 15", "sku": "STNY-PN-713", "category": "Stationery", "price": 140, "quantity": 60 }
```
Fields you leave out keep their old value.

### 5) Stock adjustment — `PATCH /api/products/<id>/stock`
```json
{ "change": 10 }     // restock: +10
{ "change": -3 }     // sale: -3
```
A sale larger than the current stock returns **400 – Insufficient stock**.

### 6) Low-stock report — `GET /api/products/low-stock`
### 7) Category summary — `GET /api/products/summary`
Returns, per category: `totalItems`, `totalQuantity`, `totalStockValue`, `avgPrice`.

### 8) Delete — `DELETE /api/products/<id>`
```json
{ "message": "Product deleted", "id": "..." }
```

---

## 5. Error Responses (all handled in one place)

| Situation | Status | Example message |
|-----------|--------|-----------------|
| Schema validation fails | 400 | `Validation failed` + list of field errors |
| Malformed id | 400 | `Invalid product id: abc` |
| Wrong data type | 400 | `Invalid value for "price": abc` |
| Sale > stock | 400 | `Insufficient stock for this sale` |
| Product not found | 404 | `Product not found` |
| Duplicate SKU | 409 | `Duplicate value: sku "..." already exists` |
| Unknown route | 404 | `Route not found: GET /xyz` |

Try these in your lab to show validation works:
- POST with `"price": -5` → 400
- POST with `"category": "Toys"` → 400
- POST the same SKU twice → 409
- PATCH with `{"change": -9999}` → 400

---

## 6. Troubleshooting

- **`MongoDB connection failed`** → MongoDB is not running. Start it (`mongod` or the MongoDB service) or use an Atlas URI.
- **`/low-stock` or `/summary` returns "Invalid product id"** → route order was changed. Keep them above `/:id` in `routes/productRoutes.js`.
- **`Cannot find module`** → run `npm install`.
- **Port already in use** → change `PORT` in `.env`.
