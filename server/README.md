# LearnPlay Backend (Express + MongoDB)

Auth API with JWT stored in httpOnly cookies.

## Setup

1) Install deps
```
cd server
npm install
```

2) Create `.env` with:
```
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/learnplay
JWT_SECRET=change_me_to_a_long_random_string
NODE_ENV=development

# Email Configuration (required for email verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM_NAME=LearnPlay
```

3) Run
```
npm run dev
```

## Endpoints
- GET /api/health
- POST /api/auth/register { name, email, password, role? }
- POST /api/auth/login { email, password }
- POST /api/auth/logout
- GET /api/auth/me (requires cookie)

Cookie name: `lp_token`.
