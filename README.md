# Veilroom

Veilroom now includes a small shared backend for cross-user login, contact requests, messages, and chat deletion.

## Run locally

```powershell
npm start
```

Open http://localhost:3000.

Demo accounts:

- `mira` / `veilroom`
- `noah` / `nightgarden`
- `admin` / `admin123`

## Public deployment

GitHub Pages can host the frontend, but it cannot run `server.js`. Deploy this project to a Node host such as Render, Railway, Fly.io, or a VPS and expose its HTTPS URL. Then configure the frontend to use that backend URL, or serve the frontend from the same Node host as this project.

The current server stores data in memory for demonstration. A production deployment needs a persistent database, HTTPS, secure password storage, rate limiting, and a proper WebRTC signaling service.
