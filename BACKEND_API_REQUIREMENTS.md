# Backend API Requirements for Offline-First System

This document outlines the backend API requirements to support the offline-first learning and quiz system.

## Authentication Endpoints

### 1. Login with OTP Verification (First Time)
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Requires OTP Verification):**
```json
{
  "requiresVerification": true,
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student"
  },
  "message": "OTP sent to email"
}
```

**Response (After OTP Verification):**
```json
{
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt_auth_token_here",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Requirements:**
- First login requires OTP verification (SMS or email)
- After successful OTP verification, return JWT token
- Token should be valid for extended period (e.g., 30 days) for offline use
- Token should include user information in payload

### 2. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt_auth_token_here",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### 3. Get Current User (Token Validation)
**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt_auth_token_here", // Optional: refresh token if needed
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Requirements:**
- Validate JWT token
- Return user data if token is valid
- Return 401 if token is invalid/expired

### 4. Logout
**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Quiz Progress Endpoints

### 5. Save Quiz Result
**Endpoint:** `POST /api/progress/quiz`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_id",
  "quizId": "quiz_id",
  "quizScore": 85,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "timeSpent": 300,
  "difficulty": "Medium",
  "subject": "Mathematics",
  "gameType": "Quiz",
  "answers": [
    {
      "questionId": "q1",
      "questionText": "What is 2+2?",
      "userAnswer": 0,
      "correctAnswer": 0,
      "isCorrect": true
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "progress": {
    "_id": "progress_id",
    "userId": "user_id",
    "quizId": "quiz_id",
    "score": 85,
    "totalItems": 10,
    "correctAnswers": 8,
    "timeSpent": 300,
    "difficulty": "Medium",
    "subject": "Mathematics",
    "gameType": "Quiz",
    "date": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Duplicate - 409 Conflict):**
```json
{
  "success": false,
  "message": "Quiz result already submitted",
  "duplicate": true
}
```

**Requirements:**
- Validate authentication token
- Check for duplicate submissions (same userId + quizId + timestamp within 5 minutes)
- Save quiz result to database
- Update user progress statistics
- Return 409 if duplicate detected (frontend will mark as synced)

### 6. Save Game Progress
**Endpoint:** `POST /api/progress/game`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_id",
  "gameId": "shape-builder",
  "score": 90,
  "level": 5,
  "progress": {
    "completedPuzzles": 5,
    "totalPuzzles": 5
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "_id": "progress_id",
    "userId": "user_id",
    "gameId": "shape-builder",
    "score": 90,
    "level": 5,
    "date": "2024-01-15T10:30:00.000Z"
  }
}
```

## Data Synchronization Endpoint

### 7. Batch Sync (Optional)
**Endpoint:** `POST /api/progress/sync`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quizResults": [
    {
      "userId": "user_id",
      "quizId": "quiz_id",
      "quizScore": 85,
      "totalQuestions": 10,
      "correctAnswers": 8,
      "timeSpent": 300,
      "difficulty": "Medium",
      "subject": "Mathematics",
      "gameType": "Quiz",
      "answers": [],
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "gameProgress": [
    {
      "userId": "user_id",
      "gameId": "shape-builder",
      "score": 90,
      "level": 5,
      "progress": {},
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": {
    "quizResults": 1,
    "gameProgress": 1
  },
  "duplicates": {
    "quizResults": [],
    "gameProgress": []
  }
}
```

## Security Requirements

### Token Management
1. **JWT Token Structure:**
   ```json
   {
     "userId": "user_id",
     "email": "user@example.com",
     "role": "student",
     "deviceId": "device_123",
     "iat": 1234567890,
     "exp": 1234567890
   }
   ```

2. **Token Expiration:**
   - Default: 30 days for offline use
   - Configurable via settings
   - Token refresh mechanism recommended

3. **Device Tracking:**
   - Include deviceId in token
   - Track trusted devices
   - Require OTP on new devices

### Duplicate Prevention
1. **Quiz Result Deduplication:**
   - Check: userId + quizId + timestamp (within 5 minutes)
   - Return 409 Conflict if duplicate
   - Frontend will mark as synced

2. **Idempotency:**
   - Use unique identifiers for each submission
   - Handle retries gracefully
   - Prevent double-counting

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (Invalid/expired token)
- `403` - Forbidden
- `409` - Conflict (Duplicate submission)
- `500` - Internal Server Error
- `503` - Service Unavailable (Offline)

## Database Schema Recommendations

### Progress Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  quizId: ObjectId (ref: Quiz), // Optional
  gameId: String, // For games
  score: Number,
  totalItems: Number,
  correctAnswers: Number,
  timeSpent: Number, // seconds
  difficulty: String, // Easy, Medium, Hard
  subject: String, // Mathematics, English, Filipino
  gameType: String, // Quiz, Game
  answers: Array, // Detailed answers
  date: Date,
  createdAt: Date,
  updatedAt: Date,
  // Indexes
  // userId + quizId + date (for duplicate detection)
  // userId + date (for user progress queries)
}
```

### User Collection Updates
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String,
  verified: Boolean,
  trustedDevices: [{
    deviceId: String,
    lastLogin: Date,
    token: String
  }],
  // ... other fields
}
```

## Implementation Notes

1. **OTP Verification:**
   - Send OTP via email or SMS on first login
   - Store OTP with expiration (5-10 minutes)
   - Verify OTP before issuing token

2. **Token Storage:**
   - Issue JWT token after OTP verification
   - Include deviceId in token
   - Set appropriate expiration

3. **Duplicate Detection:**
   - Use composite key: userId + quizId + timestamp window
   - Return 409 for duplicates (not an error, just already processed)
   - Frontend handles 409 by marking as synced

4. **Offline Support:**
   - Accept requests with valid tokens even if user session expired
   - Validate token signature and expiration
   - Return user data if token is valid

5. **Sync Endpoint:**
   - Process batch of quiz results and game progress
   - Handle duplicates gracefully
   - Return summary of synced items

## Testing Checklist

- [ ] First login requires OTP
- [ ] OTP verification returns token
- [ ] Token allows offline login
- [ ] Token expiration handled correctly
- [ ] Quiz results saved successfully
- [ ] Duplicate quiz results prevented
- [ ] Game progress saved successfully
- [ ] Batch sync works correctly
- [ ] Token validation on all protected routes
- [ ] Error handling for invalid tokens
- [ ] Error handling for network failures

