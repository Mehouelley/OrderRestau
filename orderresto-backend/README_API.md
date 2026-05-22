# OrderResto - Backend API Documentation

Multi-restaurant ordering platform with real-time kitchen and dining room management.

## Backend Structure

> Last update: 2026-05-20
> This document reflects the current Laravel API implementation (token auth + Fedapay integration + kitchen endpoints).

### Framework
- **Laravel 13.0** with Eloquent ORM
- **PHP 8.3+** required
- **MySQL/PostgreSQL** for database

### Architecture
- **Multi-tenant**: Each restaurateur owns one or more restaurants
- **Multi-tenancy filtering**: All endpoints properly isolate data by `restaurant_id`
- **Token-based authentication**: Custom API token system with SHA-256 hashing
- **REST API**: Clean endpoints for public clients, authenticated restaurateurs, and kitchen screens

### Directory Structure

```
orderresto-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php          # Auth: register, login, logout, me
│   │   │   ├── RestaurantController.php    # Restaurant: list public, show, update
│   │   │   ├── TableController.php         # Tables: CRUD operations
│   │   │   ├── CategoryController.php      # Menu categories: CRUD
│   │   │   ├── ProductController.php       # Menu items: CRUD
│   │   │   └── OrderController.php         # Orders: create, list, status updates
│   │   └── Middleware/
│   │       └── ApiTokenAuthentication.php  # Token validation middleware
│   └── Models/
│       ├── User.php                        # Restaurateur user
│       ├── Restaurant.php                  # Restaurant business
│       ├── Category.php                    # Menu categories
│       ├── Product.php                     # Menu items
│       ├── RestaurantTable.php             # Dining tables
│       ├── Order.php                       # Customer orders
│       ├── OrderItem.php                   # Order line items
│       ├── Payment.php                     # Payment records
│       └── ApiToken.php                    # Auth tokens
├── database/
│   ├── migrations/
│   │   ├── 2026_05_05_000001_create_restaurants_table.php
│   │   ├── 2026_05_05_000002_create_categories_table.php
│   │   ├── 2026_05_05_000003_create_products_table.php
│   │   ├── 2026_05_05_000004_create_restaurant_tables_table.php
│   │   ├── 2026_05_05_000005_create_orders_table.php
│   │   ├── 2026_05_05_000006_create_order_items_table.php
│   │   ├── 2026_05_05_000007_create_payments_table.php
│   │   └── 2026_05_05_000008_create_api_tokens_table.php
│   └── factories/
│       └── [To be created]
├── routes/
│   └── api.php                            # API routes
└── bootstrap/
    └── app.php                            # App configuration

```

## API Endpoints

### Authentication (Public)
```
POST /api/auth/register          # Register new restaurateur
POST /api/auth/login             # Login with credentials
GET  /api/auth/me                # Get current user (requires token)
POST /api/auth/logout            # Logout (requires token)
```

### Restaurants (Public)
```
GET  /api/restaurants                       # List all restaurants
GET  /api/restaurants/{slug}                # Show restaurant details
GET  /api/restaurants/{slug}/tables         # List tables by restaurant
GET  /api/restaurants/{slug}/categories     # List menu categories
GET  /api/restaurants/{slug}/products       # List products
```

### Restaurants (Protected)
```
GET  /api/restaurant                        # Show authenticated user's restaurant
PUT  /api/restaurant                        # Update restaurant settings
```

### Tables (Protected)
```
GET  /api/tables                            # List restaurateur's tables
POST /api/tables                            # Create new table
PUT  /api/tables/{id}                       # Update table
DELETE /api/tables/{id}                     # Delete table
```

### Categories (Protected)
```
GET  /api/categories                        # List categories
POST /api/categories                        # Create category
PUT  /api/categories/{id}                   # Update category
DELETE /api/categories/{id}                 # Delete category
```

### Products (Protected)
```
GET  /api/products                          # List products
POST /api/products                          # Create product
PUT  /api/products/{id}                     # Update product
DELETE /api/products/{id}                   # Delete product
```

### Orders (Public & Protected)
```
POST /api/orders                            # Create new order (public)
GET  /api/orders/{id}                       # Get order status (public)
GET  /api/orders/{id}/invoice               # Printable invoice (public)
GET  /api/orders                            # List orders (requires token)
PATCH /api/orders/{id}                      # Update order status (requires token)
```

### Payments (Public)
```
POST /api/payments/confirm                  # Confirm payment and unlock order flow
POST /api/payments/fedapay/create           # Create Fedapay checkout session
GET  /api/payments/fedapay/callback         # Browser callback after payment
POST /api/payments/fedapay/webhook          # Server-to-server webhook
```

### Kitchen (Public with access code)
```
POST /api/kitchen/access                    # Validate kitchen access code
GET  /api/kitchen/{slug}/orders             # Kitchen board order feed
PATCH /api/kitchen/orders/{id}              # Kitchen status update
GET  /api/kitchen/orders/{id}/ticket        # Printable kitchen ticket
```

### Media (Public)
```
GET /api/media/{path}                       # Serve uploaded files from storage/app/public
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd orderresto-backend
composer install
cp .env.example .env
php artisan key:generate
```

### 2. Database Setup
```bash
php artisan migrate
php artisan db:seed  # Optional: populate with test data
```

### 3. Start Development Server
```bash
php artisan serve
```

The API will be available at `http://localhost:8000/api`

### 4. Frontend Development
In the frontend directory, ensure `vite.config.ts` has the proxy configured:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

Then run:
```bash
npm run dev
```

## Authentication

### Token-Based Authentication
1. User registers/logs in
2. Backend generates token and stores hashed version
3. Client sends token in `Authorization: Bearer {token}` header
4. Middleware validates token and attaches user to request
5. Endpoint executes with user context

### Token Storage
- Tokens stored in `api_tokens` table
- Tokens are hashed with SHA-256 before storage
- Tokens have optional expiry time
- Tokens deleted on logout

## Multi-Tenancy

All endpoints that modify data are properly scoped to the authenticated user's restaurant:

```php
// Example: Restaurateur can only update their own restaurant
$user = $request->user();                              // From token
$restaurant = $user->restaurants()->latest()->firstOrFail();  // User's restaurant
$table = $restaurant->tables()->findOrFail($id);      // Must belong to user's restaurant
```

Public endpoints (list restaurants, show menu) do not require authentication.

## Data Models

### User
- id, name, email, password (hashed), created_at, updated_at
- Relationships: HasMany restaurants, HasMany apiTokens

### Restaurant
- id, owner_id (FK), name, slug (unique), phone, email, address
- opening_hours (JSON), access_code (4-digit kitchen access), max_capacity
- Relationships: BelongsTo owner (User), HasMany categories, tables, orders, products

### Category
- id, restaurant_id (FK), name, sort_order, created_at, updated_at
- Relationships: BelongsTo restaurant, HasMany products

### Product
- id, category_id (FK), restaurant_id (FK), name, description, price (cents)
- prep_time_minutes, image_url, available (boolean), sort_order
- Relationships: BelongsTo category, restaurant; HasMany orderItems

### RestaurantTable
- id, restaurant_id (FK), name, status (libre/occupée), estimated_free_at
- Relationships: BelongsTo restaurant, HasMany orders

### Order
- id, restaurant_id (FK), table_id (FK nullable), customer_phone, order_type (sur_place/emporter)
- status (nouvelle/en_cours/prete/servie/annulee), special_instructions, total (cents)
- estimated_prep_minutes, served_at (timestamp)
- Relationships: BelongsTo restaurant, table; HasMany orderItems, payments

### OrderItem
- id, order_id (FK), product_id (FK), quantity, unit_price (cents)
- Relationships: BelongsTo order, product

### Payment
- id, order_id (FK), method (fedapay), status (pending/confirmee/echec)
- transaction_id, amount (cents), customer_phone
- Relationships: BelongsTo order

### ApiToken
- id, user_id (FK), token (hashed), expires_at, created_at
- Relationships: BelongsTo user

## Response Format

All responses are JSON:

### Success Response
```json
{
  "id": 1,
  "name": "Le Jardin Gourmand",
  "slug": "le-jardin-gourmand",
  "phone": "+221 77 123 45 67"
}
```

### Error Response (Future Implementation)
```json
{
  "error": "Validation failed",
  "messages": {
    "email": ["Email already exists"]
  }
}
```

## Testing

Run test suite:
```bash
php artisan test
```

All tests should pass with 0 errors.

## Next Steps

1. **Create factory data**: Populate database with test restaurants, products
2. **Implement Dashboard endpoints**: Revenue stats, active orders
3. **Implement Kitchen screen**: Real-time order display via access_code
4. **Harden Payment integration**: improve idempotency, webhook retries, and observability
5. **WebSocket integration**: Real-time updates for live order tracking
6. **Error handling**: Proper HTTP status codes and validation messages
7. **API documentation**: Auto-generated via OpenAPI/Swagger

## Frontend Integration

The React frontend (in `src/`) is configured to:
1. Call API endpoints at `/api/*`
2. Store auth token in localStorage
3. Include token in Authorization header for protected requests

Current status:
- No mock fallback in runtime API calls (`src/services/api.ts`).
- File uploads (restaurant logo/product image) are sent as `multipart/form-data`.
- Fedapay checkout redirects back to frontend payment route with query parameters.

See `src/services/api.ts` for HTTP client configuration.
