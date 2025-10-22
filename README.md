## Running the code

Run `npm i` to install the dependencies.

### Linux quick start

1. Install Node.js 20.x and npm (for Debian/Ubuntu-like distros: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs`).
2. Clone or copy this repository to your Linux host.
3. Make the helper script executable: `chmod +x run-dev.sh`.
4. Start both servers with `./run-dev.sh`. The script installs dependencies on first run, then launches the API (`npm run server`) and the Vite dev server (`npm run dev`) together. Stop with `Ctrl+C`, which shuts both down cleanly.

## Development

Start the frontend:

```
npm run dev
```

Start the Express API (separate terminal):

```
npm run server
```

The API defaults to `http://localhost:4000`. The frontend will target `VITE_API_URL` (falls back to `http://localhost:4000/api`).

### Environment variables

- `ADMIN_PASSWORD` (optional): overrides the default admin password (`admin123`).
- `JWT_SECRET` (optional): secret used to sign auth tokens.
- `VITE_API_URL` (optional): set in the frontend environment if the API runs elsewhere.
  
