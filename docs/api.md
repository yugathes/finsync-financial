# API Documentation

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Interactive Documentation
- **Swagger UI**: `{BASE_URL}/api/docs`
- **OpenAPI Spec**: `{BASE_URL}/api/docs/spec`

## Authentication
Currently using session-based authentication. All authenticated endpoints require a valid session.

## Error Handling
All API responses follow a consistent error format:

```json
{
  "message": "Error description",
  "status": 400
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## API Endpoints

### Health Check

#### GET `/api/health`
Returns the API health status.

**Response:**
```json
{
  "status": "OK",
  "message": "API is working",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

### User Management

#### POST `/api/user/sync`
Synchronize user data (upsert operation).

**Request Body:**
```json
{
  "id": "string",
  "email": "user@example.com",
  "monthlyIncome": 5000
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "monthlyIncome": 5000,
  "createdAt": "2025-01-13T10:30:00.000Z",
  "updatedAt": "2025-01-13T10:30:00.000Z"
}
```

### Monthly Income

#### GET `/api/monthly-income/:userId/:month`
Get monthly income for a specific user and month.

**Parameters:**
- `userId` (string) - User UUID
- `month` (string) - Month in YYYY-MM format

**Response:**
```json
{
  "id": "income-uuid",
  "userId": "user-uuid", 
  "month": "2025-01",
  "amount": 5000,
  "createdAt": "2025-01-13T10:30:00.000Z",
  "updatedAt": "2025-01-13T10:30:00.000Z"
}
```

#### POST `/api/monthly-income`
Set monthly income for a user.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "month": "2025-01",
  "amount": 5000
}
```

#### PUT `/api/monthly-income/:userId/:month`
Update monthly income for a specific user and month.

**Request Body:**
```json
{
  "amount": 5500
}
```

### Commitments

#### GET `/api/commitments/:userId`
Get all commitments for a user.

**Parameters:**
- `userId` (string) - User UUID

**Response:**
```json
[
  {
    "id": "commitment-uuid",
    "userId": "user-uuid",
    "type": "static",
    "title": "Rent",
    "category": "Housing",
    "amount": 1200,
    "recurring": true,
    "shared": false,
    "groupId": null,
    "startDate": "2025-01-01T00:00:00.000Z",
    "createdAt": "2025-01-13T10:30:00.000Z",
    "updatedAt": "2025-01-13T10:30:00.000Z"
  }
]
```

#### GET `/api/commitments/:userId/:month`
Get commitments for a specific user and month.

**Parameters:**
- `userId` (string) - User UUID
- `month` (string) - Month in YYYY-MM format

#### POST `/api/commitments`
Create a new commitment.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "type": "static",
  "title": "Rent",
  "category": "Housing", 
  "amount": 1200,
  "recurring": true,
  "shared": false,
  "groupId": null,
  "startDate": "2025-01-01"
}
```

**Required Fields:**
- `userId` (string)
- `type` (string) - "static" or "dynamic"
- `title` (string)
- `category` (string)
- `amount` (number)
- `startDate` (string) - ISO date string

**Optional Fields:**
- `recurring` (boolean) - defaults to true
- `shared` (boolean) - defaults to false
- `groupId` (string) - for shared commitments

#### PUT `/api/commitments/:id`
Update an existing commitment.

**Parameters:**
- `id` (string) - Commitment UUID

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "amount": 1300,
  "category": "Updated Category"
}
```

#### DELETE `/api/commitments/:id`
Delete a commitment.

**Parameters:**
- `id` (string) - Commitment UUID

**Response:**
```json
{
  "success": true,
  "message": "Commitment deleted successfully"
}
```

### Payments

#### POST `/api/payments/:id/paid`
Mark a commitment as paid for the current month.

**Parameters:**
- `id` (string) - Commitment UUID

**Request Body:**
```json
{
  "userId": "user-uuid",
  "amount": 1200
}
```

#### DELETE `/api/payments/:id/:month`
Mark a commitment as unpaid (remove payment record).

**Parameters:**
- `id` (string) - Commitment UUID
- `month` (string) - Month in YYYY-MM format

#### GET `/api/payments/:userId/:month`
Get all payments for a user in a specific month.

**Parameters:**
- `userId` (string) - User UUID
- `month` (string) - Month in YYYY-MM format

**Response:**
```json
[
  {
    "id": "payment-uuid",
    "commitmentId": "commitment-uuid",
    "month": "2025-01",
    "amount": 1200,
    "paidAt": "2025-01-15T10:30:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### Dashboard

#### GET `/api/dashboard/:userId`
Get dashboard data for a user.

**Parameters:**
- `userId` (string) - User UUID

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "monthlyIncome": 5000
  },
  "currentMonth": {
    "month": "2025-01",
    "income": 5000,
    "totalCommitments": 2230,
    "paidCommitments": 1200,
    "unpaidCommitments": 1030,
    "balance": 2770
  },
  "commitments": [
    {
      "id": "commitment-uuid",
      "title": "Rent",
      "amount": 1200,
      "category": "Housing",
      "type": "static",
      "paid": true
    }
  ],
  "recentPayments": [
    {
      "id": "payment-uuid",
      "commitmentId": "commitment-uuid",
      "amount": 1200,
      "paidAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

## Data Models

### User
```typescript
interface User {
  id: string;           // UUID
  email: string;        // Email address
  password?: string;    // Hashed password (optional)
  monthlyIncome?: number; // Default monthly income
  createdAt: Date;
  updatedAt: Date;
}
```

### MonthlyIncome
```typescript
interface MonthlyIncome {
  id: string;           // UUID
  userId: string;       // Foreign key to User
  month: string;        // YYYY-MM format
  amount: number;       // Income amount
  createdAt: Date;
  updatedAt: Date;
}
```

### Commitment
```typescript
interface Commitment {
  id: string;           // UUID
  userId: string;       // Foreign key to User
  type: 'static' | 'dynamic'; // Commitment type
  title: string;        // Commitment name
  category: string;     // Category (Housing, Food, etc.)
  amount: number;       // Commitment amount
  recurring: boolean;   // Whether it repeats monthly
  shared: boolean;      // Whether it's shared with others
  groupId?: string;     // UUID for shared commitments
  startDate?: Date;     // When commitment starts
  createdAt: Date;
  updatedAt: Date;
}
```

### CommitmentPayment
```typescript
interface CommitmentPayment {
  id: string;           // UUID
  commitmentId: string; // Foreign key to Commitment
  month: string;        // YYYY-MM format
  amount: number;       // Amount paid
  paidAt: Date;        // When payment was made
  createdAt: Date;
  updatedAt: Date;
}
```

## Rate Limiting
API endpoints are rate-limited to prevent abuse:
- General endpoints: 100 requests per minute per IP
- Authentication endpoints: 10 requests per minute per IP

## Pagination
For endpoints that return lists, pagination is supported:

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

## Filtering and Sorting
Some endpoints support filtering and sorting:

**Query Parameters:**
- `sort` (string) - Field to sort by
- `order` (string) - "asc" or "desc"
- `filter[field]` (string) - Filter by field value

**Example:**
```
GET /api/commitments/user123?sort=amount&order=desc&filter[category]=Housing
```

## Webhooks
Future implementation will support webhooks for real-time updates:

- Payment notifications
- Commitment reminders
- Monthly summaries

## SDK and Client Libraries
Official client libraries are planned for:
- JavaScript/TypeScript
- Python
- React Native

## Versioning
API versioning will be implemented using URL versioning:
- Current: `/api/` (v1 default)
- Future: `/api/v2/`

Breaking changes will result in new version releases with migration guides.