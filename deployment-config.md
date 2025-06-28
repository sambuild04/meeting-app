# 🔧 Deployment Configuration

## Environment Variables for Production

When deploying, set these environment variables in your deployment platform:

### For Railway/Render:

```bash
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app-name.railway.app
```

### For Frontend (if deploying separately):

```bash
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

## Automatic URL Detection

The app automatically detects the deployed URL, but you can override it with:

1. **Railway**: Set `FRONTEND_URL` in environment variables
2. **Render**: Set `FRONTEND_URL` in environment variables
3. **Vercel**: Set `VITE_API_URL` and `VITE_SOCKET_URL` in environment variables

## CORS Configuration

The server automatically configures CORS for:
- `http://localhost:5173` (development)
- Your deployed frontend URL (production)

## Health Check

The app includes a health check endpoint at `/health` for deployment platforms.

## Build Commands

- **Build**: `npm run build`
- **Start**: `npm run start`
- **Health Check**: `GET /health` 