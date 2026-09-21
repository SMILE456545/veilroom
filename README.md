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

Deploy the whole repository to Render so the public URL serves both the frontend and the shared backend:

1. Push the latest files to GitHub, including `server.js`, `package.json`, and `render.yaml`.
2. In Render, choose **New + > Web Service** and connect the `SMILE456545/veilroom` repository.
3. Render will read `render.yaml`; use `npm install` for the build and `npm start` for the start command.
4. Open the generated HTTPS URL, for example `https://veilroom.onrender.com`.
5. Share that URL with users. They can log in and use the shared backend from any device.

GitHub Pages alone cannot run `server.js`, so its URL remains a frontend-only demo. The Render URL is the public multi-user site.

The current server stores data in memory for demonstration. A production deployment needs a persistent database, HTTPS, secure password storage, rate limiting, and a proper WebRTC signaling service.
