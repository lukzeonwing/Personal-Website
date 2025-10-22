
  # Personal Website

  This is a code bundle for Personal Website. The original project is available at https://www.figma.com/design/aJ622OXvHKwiye18DBPbIZ/Personal-Website.

  ## Running the code

Run `npm i` to install the dependencies.

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
  
