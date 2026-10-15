# interview-project

MERN authentication app: register, log in, keep a secure session, and reach protected pages only when authenticated. Project rules and architecture are in [CLAUDE.md](CLAUDE.md).

- `server/`: Express 5 + MongoDB (Mongoose) API
- `client/`: React 19 + Vite + React Router

## Setup

Requires Node.js 20+ and a running MongoDB (default `mongodb://127.0.0.1:27017`).

```bash
# API
cd server
npm install
cp .env.example .env
npm run generate-secret     # copy the output into JWT_SECRET in .env
npm run dev                 # http://localhost:5000  (npm start for production)

# React app (second terminal)
cd client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

## Environment variables

`server/.env` (see `server/.env.example`):

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` (production turns on `Secure` cookies and generic 500 messages) |
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string (required) |
| `JWT_SECRET` | Signing secret, at least 32 characters (required, generate with `npm run generate-secret`) |
| `JWT_EXPIRES_IN` | Session length, e.g. `1d`, `2h` (default `1d`); the cookie expires with the token |
| `BCRYPT_ROUNDS` | bcrypt cost, 10 to 15 (default 12) |
| `CLIENT_URL` | Exact origin of the React app, used for CORS and the CSRF origin check |
| `COOKIE_SAME_SITE` | `lax` (default), `strict` or `none` (`none` forces `Secure`) |

`client/.env`: `VITE_API_URL` (default `http://localhost:5000/api`). Never put secrets in `VITE_*` variables. `.env` files are git-ignored.

## API

Base path `/api`. Sessions use an httpOnly cookie named `token`; send requests with credentials. Errors look like `{ "success": false, "message": "...", "errors": { "field": "..." } }` (`errors` only for validation).

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/register` | no | `{ "name": "Ann", "email": "ann@example.com", "password": "password123", "role": "customer" }` (`role` optional: `customer` default, or `merchant`) | 201 `{ success, user }` + cookie |
| POST | `/auth/login` | no | `{ "email": "ann@example.com", "password": "password123" }` | 200 `{ success, user }` + cookie |
| POST | `/auth/logout` | no | none | 200 `{ success, message }`, cookie cleared, token revoked |
| GET | `/auth/me` | cookie | none | 200 `{ success, user }` |
| GET | `/products?page=1&limit=12` | no | none | 200 `{ success, products, pagination }`: in-stock products, newest first, with `vendor: { id, name }` |
| GET | `/products/:id` | no | none | 200 `{ success, product }` (any stock level) |
| GET | `/products/mine` | merchant | none | 200 `{ success, products }`: the caller's own products |
| POST | `/products` | merchant | `{ "title": "Mug", "price": 12.5, "stock": 3, "description": "..." }` | 201 `{ success, product }` |
| PUT | `/products/:id` | merchant, owner | same as POST (replaces all editable fields) | 200 `{ success, product }` |
| DELETE | `/products/:id` | merchant, owner | none | 200 `{ success, message }` |
| POST | `/orders/checkout` | yes | `{ "checkoutId": "<random 16-64 chars>", "items": [{ "productId": "...", "quantity": 2 }] }` | 201 `{ success, order }`; 200 with the existing order if `checkoutId` was already used |
| GET | `/products/:id/reviews?page=1&limit=12` | no | none | 200 `{ success, reviews, rating: { average, count }, pagination }`: newest first, reviewer name only |
| POST | `/products/:id/reviews` | yes | `{ "rating": 4, "comment": "optional" }` | 201 `{ success, review }`; 409 if you already reviewed it; 403 for your own product |
| GET | `/merchant/analytics?from=2026-03-01&to=2026-03-31` | merchant | none | 200 `{ success, range, totalSales, itemsSold, orderCount, topProducts }` for the caller's own products only |
| GET | `/orders?page=1&limit=12` | yes | none | 200 `{ success, orders, pagination }`: the caller's orders, newest first |
| GET | `/health` | no | none | 200 `{ status: "ok" }` |

Status codes: 400 validation or bad JSON, 401 not authenticated or bad credentials, 403 blocked cross-site request or not allowed (non-merchant, or someone else's product), 404 unknown route, 409 email already registered, 429 too many attempts (20 per 15 minutes on register and login), 500 unexpected.

Product rules: title 1 to 100 characters, price greater than 0 up to 1,000,000 with at most 2 decimals (a JSON number), stock a whole number from 0 to 1,000,000, description up to 2000 characters. The vendor is always the logged-in merchant; a `vendorId` in the body is ignored. Page size is capped at 48.

Review rules: any logged-in user can review a product once (rating a whole number 1 to 5, optional comment up to 1000 characters; a unique `(productId, userId)` index enforces it). The reviewer is always the logged-in user, and you cannot review your own product. There is no purchase requirement. `rating.average` (one decimal) and `rating.count` are computed with a MongoDB `$group` aggregation on every request and are included on `GET /products` and `GET /products/:id` (`{ average: 0, count: 0 }` when unreviewed).

Sales report rules: the merchant is always the logged-in user (an id in the query is ignored). Only `placed` orders count (there is no payment step, so that is the completed state; `cancelled` orders are excluded) and only order lines whose seller is that merchant. `from` and `to` are `YYYY-MM-DD` days in UTC, both inclusive, so `to` covers up to 23:59:59.999 UTC; omitted values default to the last 30 days ending today, and the range may span at most 366 days. Sales are summed in whole cents.

Checkout rules: only product ids and quantities are read from the request (whole numbers 1 to 99, at most 50 distinct products). Unit prices, the total and the status are always set by the server, and each order line stores the title and price at purchase time. Stock is taken with one atomic conditional update per line (`stock >= quantity`), so concurrent buyers can never oversell; if any line fails (409 not enough stock, 404 product gone, 400 own product) the lines already taken are put back and no order is created. MongoDB transactions need a replica set, which a standalone server does not have, so this compensating approach is used instead; a server crash between the two steps could leave stock deducted without an order. Order lines also store the seller (`vendorId`), which is what sales reports group on. A retried request with the same `checkoutId` returns the original order without deducting again. The cart itself lives in the browser (per account, `localStorage`) and is only sent to the server at checkout.

Rules: name up to 50 characters, valid email up to 254 characters, password 8 characters to 72 bytes.

```bash
curl -i -c jar.txt -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ann","email":"ann@example.com","password":"password123"}'
curl -b jar.txt http://localhost:5000/api/auth/me
```

## Checks

```bash
cd server && npm test          # integration tests; uses the throwaway DBs auth_app_test, auth_app_test_products and auth_app_test_orders, auth_app_test_reviews and auth_app_test_analytics (override with TEST_MONGODB_URI)
cd client && npm run lint && npm run build
```
