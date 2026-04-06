# Zorvyn Finance Data Processing & Access Control Backend

## Objective
This project is a Finance Data Processing and Access Control Backend system built for the Zorvyn internship screening assignment. It provides a robust, strictly typed, and scalable foundation for managing users (with Role-Based Access Control) and their financial transactions (income and expenses), alongside powerful summary APIs for dashboard visualizations.

## Architecture & Assumptions
*   **Database Stack**: **PostgreSQL + Prisma ORM + Vanilla JavaScript**. PostgreSQL provides robust relational guarantees. Prisma offers type-safe, elegant database access.
*   **Error Handling Philosophy**: The entire codebase utilizes a strict zero `try-catch` architecture credited to Jonas Schmedtmann's Natours project.
    *   `catchAsync`: A higher-order function wraps all controllers.
    *   `AppError`: A custom class for operational errors.
    *   `globalErrorHandler`: All errors funnel through a single point (`errorController.js`) mapping Prisma and JWT errors safely.
*   **Transparent Filtering**: Utilizing **Prisma `$extends`**, the client has been globally extended so `findMany`, `findFirst`, and `findUnique` automatically inject `{ isDeleted: false }` for transactions and `{ active: true }` for users. Controllers never manually filter soft-deleted or deactivated records.
*   **Authentication**: JWT (JSON Web Tokens) are used for stateless auth. Refresh tokens and email verification are intentionally omitted as tradeoffs for this scope.
*   **Soft Deletion**: Transactions are never hard-deleted. They are flagged `isDeleted: true` to preserve financial audit trails.
*   **Rate Limiting**: Implemented via `express-rate-limit` (in-memory) rather than a Redis store for simplicity.

## Setup Instructions

1.  **Clone the repository and install dependencies**:
    ```bash
    npm install
    ```
2.  **Set up your environment variables**:
    Create a `.env` file (or copy from `.env.example`) and fill in:
    ```env
    NODE_ENV=development
    PORT=3000
    DATABASE_URL="postgres://..."
    JWT_SECRET="your_long_random_jwt_secret"
    JWT_EXPIRES_IN=90d
    ```
3.  **Sync Prisma Schema**:
    ```bash
    npx prisma db push
    ```
4.  **Start the Development Server**:
    ```bash
    npm run dev
    ```

## Seeding Data
You can easily seed your database with 3 users (Admin, Analyst, Viewer) and 15 sample transactions:
*   **Import Data**: `node src/dev/seeder.js --import`
*   **Delete Data**: `node src/dev/seeder.js --delete`

*(Passwords for seeded users are set to `password123`)*

## API Endpoints

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/signup` | Register a new user | Public |
| POST | `/login` | Authenticate and receive a JWT | Public |

### 2. Users (`/api/v1/users`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/me` | Get current user profile | Authenticated |
| PATCH | `/me` | Update current user (name, email) | Authenticated |
| DELETE | `/me` | Deactivate current user | Authenticated |
| GET | `/` | Get all users | Admin |
| GET | `/:id` | Get specific user | Admin |
| PATCH | `/:id` | Update specific user | Admin |
| DELETE | `/:id` | Delete user (Hard delete) | Admin |

### 3. Transactions (`/api/v1/transactions`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get all transactions (scoped to user if not admin) | Authenticated |
| POST | `/` | Create a new transaction | Admin, Analyst |
| GET | `/:id` | Get a transaction | Authenticated |
| PATCH | `/:id` | Update a transaction (requires ownership or Admin) | Admin, Analyst |
| DELETE | `/:id` | Delete a transaction (Soft delete, requires ownership or Admin) | Admin |

### 4. Dashboard Summaries (`/api/v1/transactions/dashboard/...`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/summary` | Get total income, expenses, and net balance | Authenticated |
| GET | `/categories` | Get total amounts grouped by category | Authenticated |
| GET | `/trends` | Get 12-month income/expense trends | Authenticated |
| GET | `/recent` | Get 10 most recent transactions | Authenticated |

---

## Example Requests

### POST `/api/v1/auth/signup`
```json
{
  "name": "Jane Doe",
  "email": "jane@zorvyn.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "role": "analyst"
}
```

### POST `/api/v1/auth/login`
```json
{
  "email": "jane@zorvyn.com",
  "password": "password123"
}
```

### POST `/api/v1/transactions`
*(Requires Authorization Header with Bearer Token)*
```json
{
  "amount": 250.50,
  "type": "expense",
  "category": "Software Subscriptions",
  "notes": "Yearly IDE license"
}
```

### GET `/api/v1/transactions/dashboard/summary`
*(Requires Authorization Header with Bearer Token)*
**Response:**
```json
{
  "status": "success",
  "data": {
    "totalIncome": 4400.5,
    "totalExpenses": 1845.5,
    "netBalance": 2555,
    "totalTransactions": 15
  }
}
```