# Offline-First System Documentation

## Overview

This document describes the offline-first implementation for the LearnPlay learning and quiz system. The system allows users to login, play games, and take quizzes even when offline, with automatic synchronization when connection is restored.

## Architecture

### Components

1. **IndexedDB Manager** (`src/utils/indexedDB.js`)
   - Handles all offline data storage
   - Stores quiz results, game progress, and auth tokens
   - Provides sync status tracking

2. **Offline Sync Service** (`src/services/offlineSync.js`)
   - Automatically syncs offline data when online
   - Handles duplicate detection
   - Manages sync retries

3. **Enhanced Auth Context** (`src/contexts/AuthContext.js`)
   - Supports token-based offline login
   - Saves tokens after OTP verification
   - Falls back to stored token when offline

4. **Offline Indicator** (`src/components/OfflineIndicator.js`)
   - Visual feedback for connection status
   - Shows sync progress
   - Displays offline notifications

5. **Service Worker** (`public/sw.js`)
   - Caches static assets
   - Enables offline page access
   - Handles background sync

## Authentication Flow

### First-Time Login (Online Required)

1. User enters email and password
2. Backend sends OTP to email/SMS
3. User verifies OTP
4. Backend returns JWT token
5. **Token is saved to IndexedDB** for offline use
6. User is logged in

### Subsequent Logins (Offline Capable)

1. App checks for stored token in IndexedDB
2. If token exists and is valid:
   - User is logged in offline
   - No OTP required
3. If token expired or missing:
   - User must login online with OTP again

### Token Expiration

- Tokens expire after configured period (default: 30 days)
- Expired tokens are automatically deleted
- User must login online again to get new token

## Offline Quiz Flow

### Taking Quiz Offline

1. User selects quiz (must be cached/available)
2. User answers questions
3. Quiz is completed
4. **Results saved to IndexedDB** with `synced: false`
5. User sees confirmation message

### Data Structure (IndexedDB)

```javascript
{
  id: autoIncrement,
  userId: "user_id",
  quizId: "quiz_id",
  score: 85,
  totalItems: 10,
  correctAnswers: 8,
  timeSpent: 300,
  difficulty: "Medium",
  subject: "Mathematics",
  answers: [
    {
      questionId: "q1",
      questionText: "Question text",
      userAnswer: 0,
      correctAnswer: 0,
      isCorrect: true
    }
  ],
  timestamp: "2024-01-15T10:30:00.000Z",
  synced: false,
  createdAt: 1234567890
}
```

## Automatic Synchronization

### When Sync Occurs

1. **On Connection Restore:**
   - Listens to `online` event
   - Automatically starts sync
   - Shows notification to user

2. **Periodic Sync:**
   - Checks every 30 seconds when online
   - Syncs any unsynced data

3. **Manual Sync:**
   - Can be triggered programmatically
   - `offlineSyncService.manualSync()`

### Sync Process

1. Check if online
2. Verify auth token exists
3. Get all unsynced quiz results
4. For each result:
   - Send to `/api/progress/quiz`
   - If successful: mark as synced
   - If duplicate (409): mark as synced
   - If auth error: clear token, stop sync
5. Get all unsynced game progress
6. Sync game progress similarly
7. Clean up old synced data (7+ days)

### Duplicate Handling

- Backend returns `409 Conflict` for duplicates
- Frontend marks record as synced
- No error shown to user
- Prevents double-counting

## Edge Cases Handled

### Multiple Offline Quiz Attempts
- Each attempt creates separate record
- All synced when online
- Backend handles duplicates

### Token Expiration
- Token checked on app start
- Expired tokens deleted
- User prompted to login again

### Failed Sync Retries
- Sync retries automatically
- Failed items remain unsynced
- Retry on next sync cycle

### Network Interruption During Sync
- Partial sync handled gracefully
- Synced items marked, unsynced remain
- Resume on next connection

## Usage Examples

### Save Quiz Result Offline

```javascript
import indexedDBManager from '../utils/indexedDB';

const quizResult = {
  userId: user._id,
  quizId: quiz.id,
  score: 85,
  totalItems: 10,
  correctAnswers: 8,
  timeSpent: 300,
  difficulty: 'Medium',
  subject: 'Mathematics',
  answers: [...]
};

await indexedDBManager.saveQuizResult(quizResult);
```

### Check Sync Status

```javascript
import offlineSyncService from '../services/offlineSync';

const status = await offlineSyncService.getSyncStatus();
console.log(status);
// {
//   isSyncing: false,
//   isOnline: true,
//   unsyncedQuizzes: 2,
//   unsyncedGames: 0
// }
```

### Manual Sync

```javascript
import offlineSyncService from '../services/offlineSync';

await offlineSyncService.manualSync();
```

## Testing Offline Mode

### Development Testing

1. Build for production: `npm run build`
2. Serve build: `npx serve -s build`
3. Open Chrome DevTools
4. Go to Network tab
5. Check "Offline" checkbox
6. Test login, quiz, and sync

### Production Testing

1. Deploy to production
2. Login and verify OTP
3. Disable network (airplane mode)
4. Take quiz offline
5. Re-enable network
6. Verify automatic sync

## Backend Requirements

See `BACKEND_API_REQUIREMENTS.md` for complete API specifications.

### Key Endpoints

- `POST /api/auth/login` - Login with OTP
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `GET /api/auth/me` - Validate token
- `POST /api/progress/quiz` - Save quiz result
- `POST /api/progress/game` - Save game progress

### Token Requirements

- JWT format
- Include userId, email, role, deviceId
- 30-day expiration (configurable)
- Returned after OTP verification

## Security Considerations

1. **Token Storage:**
   - Stored in IndexedDB (more secure than localStorage)
   - Not accessible via JavaScript injection
   - Cleared on logout

2. **Device Tracking:**
   - Each device gets unique deviceId
   - Token includes deviceId
   - New devices require OTP

3. **Data Validation:**
   - Backend validates all data
   - Prevents duplicate submissions
   - Validates token on every request

## Performance Optimizations

1. **Lazy Loading:**
   - IndexedDB initialized on first use
   - Sync only when online
   - Cleanup runs periodically

2. **Batch Operations:**
   - Multiple records synced in sequence
   - Failed items don't block others
   - Efficient IndexedDB queries

3. **Caching:**
   - Service worker caches static assets
   - Reduces network requests
   - Faster page loads

## Troubleshooting

### Quiz Results Not Syncing

1. Check if online: `navigator.onLine`
2. Check sync status: `offlineSyncService.getSyncStatus()`
3. Check token: `indexedDBManager.getAuthToken()`
4. Check browser console for errors

### Token Not Working Offline

1. Verify token exists: `indexedDBManager.getAuthToken()`
2. Check expiration: Token should have `expiresAt`
3. Verify token was saved after OTP verification
4. Check IndexedDB in DevTools > Application > IndexedDB

### Sync Not Triggering

1. Verify service is initialized: Check console logs
2. Check online event listeners
3. Manually trigger: `offlineSyncService.manualSync()`
4. Check for JavaScript errors

## Future Enhancements

1. **Background Sync API:**
   - Use Background Sync API for better reliability
   - Sync even when tab is closed

2. **Conflict Resolution:**
   - Handle conflicts when same quiz taken on multiple devices
   - Last-write-wins or merge strategy

3. **Offline Game Support:**
   - Cache game assets
   - Store game state
   - Resume games offline

4. **Progressive Enhancement:**
   - Graceful degradation
   - Feature detection
   - Polyfills for older browsers

