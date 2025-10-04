## E-commerce Backend (Node.js + Express + MongoDB)

Polished, scalable e-commerce backend with authentication, product/catalog management, orders, payments, image uploads, and validation.

This README gives a quick start, environment variable reference, API summary, and examples for testing locally.

--

## Features

- User authentication (register / login / profile)
- User roles (user, seller, admin)
- Product CRUD with images (Cloudinary integration)
- Reviews, ratings
- Orders and basic order lifecycle
- Stripe payment integration (payment intent)
- Input validation using Zod
- Security middlewares: Helmet, rate limiting, sanitize

--

## Tech stack

- Node.js + Express
- MongoDB + Mongoose
- Zod for request validation
- Multer for file uploads (local) + Cloudinary for remote storage
- Stripe for payments
- dotenv for configuration

--

## Quick start

1. Clone and install

```bash
git clone https://github.com/Alamin-Coding/ecommerce-backend-medium.git
cd ecommerce-backend-medium
npm install
```

2. Create a `.env` file in the project root (example below)

3. Run in development

```bash
npm run dev
```

The server runs by default at http://localhost:5000

--

## Example .env (copy to `.env`)

Fill these values before running. Omit or change services you aren't using.

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (SMTP)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000
```

--

## Important notes

- The app expects certain env vars (MONGO_URI, JWT_SECRET, etc.). If missing, the app may fail to start or certain features (email, uploads, payments) will not work.
- File uploads: multer stores files in `uploads/` locally before Cloudinary upload. The routes expect multipart/form-data keys:
  - User avatar: `avatar` (single file)
  - Product images: `images` (multiple files, up to 5)
- Category: Product requests include a `category` field that must be a 24‑char MongoDB ObjectId string. Either create a real Category doc in the DB or use a generated 24-hex id for testing (best practice: create the Category first).

--

## API Endpoints (summary)

Authentication

- POST /api/auth/register — Register user
- POST /api/auth/login — Login user
- GET /api/auth/me — Get current user (Protected)

Users

- GET /api/users/profile — Get profile (Protected)
- PUT /api/users/profile — Update profile (Protected; expects `avatar` as file field)
- PUT /api/users/change-password — Change password (Protected)
- POST /api/users/address — Add address (Protected)

Products

- GET /api/products — List products (supports query filters)
- GET /api/products/:id — Get single product
- POST /api/products — Create product (Protected: seller/admin) — multipart/form-data; `images` file fields
- PUT /api/products/:id — Update product (Protected: seller/admin)
- DELETE /api/products/:id — Delete product (Protected: seller/admin)
- POST /api/products/:id/reviews — Add review (Protected)

Orders

- POST /api/orders — Create order (Protected)
- GET /api/orders/myorders — Get my orders (Protected)
- GET /api/orders/:id — Get order by ID (Protected)
- PUT /api/orders/:id/cancel — Cancel order (Protected)
- GET /api/orders — Get all orders (Admin)
- PUT /api/orders/:id/status — Update order status (Admin)

Payments

- POST /api/payments/create-payment-intent — Create payment (Protected)

--

## Testing examples

1. Register (JSON)

```bash
curl -X POST http://localhost:5000/api/auth/register \
   -H "Content-Type: application/json" \
   -d '{"name":"John Doe","email":"john@example.com","password":"Password123","phone":"+1234567890"}'
```

2. Login and use token

```bash
curl -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"john@example.com","password":"Password123"}'

# Copy the returned token and use it in Authorization header for protected routes:
# -H "Authorization: Bearer <TOKEN>"
```

3. Create product (multipart/form-data, with token)

```bash
curl -X POST http://localhost:5000/api/products \
   -H "Authorization: Bearer <YOUR_TOKEN>" \
   -F "name=Gaming Laptop" \
   -F "description=High performance laptop" \
   -F "price=1299.99" \
   -F "category=652e9f4b8c1d2a3f4b5c6d7e" \
   -F "stock=50" \
   -F "images=@./img1.jpg" \
   -F "images=@./img2.jpg"
```

Tip: ensure `category` is a 24‑char hex string (ObjectId) or create a Category document first.

--

## Troubleshooting

- Multer "Unexpected field" — make sure you send the correct form field names:
  - `avatar` for profile avatar (single)
  - `images` for product images (array)
- Validation "Invalid category ID format" — your `category` value must be a 24‑char hex string. Either create the Category in the DB or pass a valid ObjectId string.
- If server crashes on start, check `MONGO_URI` and other required env vars.

--

## Extending & Contributing

- Add more validation or API tests
- Add role-based features, seller dashboards, or inventory webhooks
- PRs are welcome — please include tests where applicable

--

If you want, I can:

- Add a tiny `scripts/createCategory.js` utility to create a Category from env (one command), or
- Add a short server-side check so product creation rejects when `category` doesn't exist (with a clear error message).

Pick one and I'll implement it for you.
