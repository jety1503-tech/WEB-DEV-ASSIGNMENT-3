# Viva / Lab Questions with Short Answers

## A. Basics (Node, Express, MongoDB)

1. **What is Express.js and why do we use it?**
   A minimal Node.js framework that gives routing and middleware so we don't write raw `http` server code.
2. **What is MongoDB? How is it different from SQL?**
   A NoSQL document database storing JSON-like (BSON) documents in collections; no fixed tables/joins, flexible schema.
3. **What is Mongoose?**
   An ODM (Object Data Modeling) library that adds schemas, validation and query helpers on top of MongoDB.
4. **What is dotenv and why use it?**
   Loads values from `.env` into `process.env`, so secrets like the DB URI are not hard-coded or pushed to Git.
5. **What does `express.json()` do?**
   Middleware that parses JSON request bodies into `req.body`.
6. **What is REST? Which HTTP methods did you use?**
   Architectural style using URLs for resources and HTTP verbs for actions: POST (create), GET (read), PUT (update), PATCH (partial update), DELETE.

## B. Schema & Validation

7. **What is a schema vs. a model?**
   Schema defines structure and rules; model is the compiled class used to query the collection.
8. **Which validations did you add?**
   `required`, `min`, `minlength/maxlength`, `enum` (category), `match` (SKU regex), `unique` (SKU), custom integer validator.
9. **Is `unique` a validator?**
   No. It creates a MongoDB unique *index*; a duplicate gives error code 11000, which we map to HTTP 409.
10. **What is a virtual field? Where did you use it?**
    A computed property not stored in DB. `stockValue = price × quantity`; enabled in JSON via `toJSON: { virtuals: true }`.
11. **What does `timestamps: true` do?**
    Automatically adds and maintains `createdAt` and `updatedAt`.
12. **What are `trim`, `uppercase`, `default`?**
    Setters/defaults that clean or fill values before saving.
13. **What is `__v`?**
    Mongoose version key, used for document versioning on arrays.
14. **Why `runValidators: true` in update?**
    By default validators run only on `save/create`; update queries skip them unless you enable this option.
15. **What does `{ new: true }` do?**
    Returns the updated document instead of the old one.

## C. CRUD

16. **Difference between PUT and PATCH?**
    PUT replaces/updates the resource's details; PATCH applies a partial change (here: only the stock).
17. **Why 201 for create and 404 for missing product?**
    201 = resource created; 404 = resource not found.
18. **Difference between `find`, `findOne`, `findById`?**
    `find` returns an array, `findOne` the first match, `findById` is shorthand for `findOne({_id})`.
19. **Why validate the `:id` param?**
    An invalid ObjectId makes Mongoose throw a CastError; we return a clean 400 first.
20. **What is `req.params`, `req.query`, `req.body`?**
    URL path variables, query-string values, and request payload respectively.

## D. Query: Filter, Sort, Pagination

21. **How is pagination implemented?**
    `skip = (page - 1) * limit`, then `.skip(skip).limit(limit)`; `totalPages = ceil(total / limit)`.
22. **Why use `countDocuments`?**
    To know the total matching records so the client can build page numbers.
23. **How does sorting work?**
    `sort=price` ascending, `sort=-price` descending; only whitelisted fields are allowed.
24. **How did you do price range filtering?**
    `{ price: { $gte: min, $lte: max } }`.
25. **Why escape the search text before using RegExp?**
    To stop regex injection / errors from special characters like `(` or `*`.
26. **What are `$gte`, `$lte`, `$or`, `$expr`?**
    Greater-or-equal, less-or-equal, logical OR, and `$expr` lets you compare two fields of the same document.
27. **Why limit the max `limit` to 100?**
    To protect the server from huge responses.

## E. Stock Handling

28. **How do you do restock and sale?**
    `PATCH /:id/stock` with `{ change: +n }` or `{ change: -n }` using `$inc`.
29. **How do you stop stock from going negative?**
    For a sale, the filter includes `quantity: { $gte: -change }` and the schema has `min: 0`.
30. **Why use `$inc` instead of read → modify → save?**
    `$inc` is atomic. Read-modify-save can lose updates if two requests run simultaneously (race condition).

## F. Aggregation

31. **What is an aggregation pipeline?**
    A sequence of stages (`$match`, `$group`, `$sort`, ...) where each stage's output feeds the next.
32. **Explain your category summary pipeline.**
    `$group` by category computing `$sum` (items, quantity, stock value with `$multiply`) and `$avg` price, then `$sort` by stock value descending.
33. **How is low-stock found?**
    `find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } })`, i.e. quantity ≤ reorder level.
34. **Why can't `stockValue` virtual be used in aggregation?**
    Virtuals exist only in Mongoose documents; aggregation runs inside MongoDB, so we compute `price × quantity` with `$multiply`.
35. **Difference between `$group` and `$match`?**
    `$match` filters documents; `$group` combines them into groups and calculates totals.

## G. Middleware & Error Handling

36. **What is middleware?**
    A function `(req, res, next)` that runs between request and response (logging, parsing, validation, errors).
37. **What is centralized error handling?**
    One error middleware `(err, req, res, next)` placed last that converts all errors into consistent JSON responses.
38. **Why 4 parameters in the error handler?**
    Express recognises a function with 4 arguments as an error-handling middleware.
39. **What is `asyncHandler` for?**
    Express 4 doesn't catch rejected promises; the wrapper forwards them to `next(err)`.
40. **Why must `/low-stock` be defined before `/:id`?**
    Express matches routes in order; otherwise "low-stock" would be treated as an id.
41. **Which status codes did you use?**
    200, 201, 400 (validation/bad input), 404 (not found), 409 (duplicate), 500 (server error).

## H. Practical / Extension Questions (be ready to code these)

42. Add a new field `description` with max 500 characters.
43. Add an endpoint to get products of a single category (`GET /api/products?category=X` already does this – explain how).
44. Change the low-stock rule to `quantity < reorderLevel`.
45. Add `$match` to the summary to include only categories with total quantity above 50.
46. Return the most expensive product in each category using `$group` + `$max`.
47. Add a `minQuantity` filter to the list API.
48. Add a text index and use `$text` search instead of regex.
49. Why is storing `stockValue` in the DB a bad idea?
    It can become out of sync with price/quantity; a virtual is always correct.
50. How would you add authentication? (JWT middleware before the product routes.)
