# Nuevo León Primer Lugar Generator

This version includes:

- Static front-end app
- Locked watermark: `primerlugar.mx`
- PNG generation and sharing
- Public phrase suggestions
- Moderation page
- Netlify Functions backend
- Netlify Blobs storage

## Important deployment note

This backend version should be deployed with **Netlify Git deploy** or **Netlify CLI**, because it needs dependencies and Netlify Functions.

Netlify Drop is fine for static sites, but for this version use Git/CLI.

## Deploy with GitHub + Netlify

1. Create a GitHub repository.
2. Upload all files in this folder.
3. In Netlify, choose **Add new site → Import an existing project**.
4. Select the GitHub repository.
5. Use the included `netlify.toml`.
6. Add an environment variable:

```text
ADMIN_TOKEN=choose-a-long-secret-password
```

7. Deploy.

## Deploy with Netlify CLI

```bash
npm install
npm run build
npx netlify deploy --build
npx netlify deploy --build --prod
```

## Admin moderation

Open:

```text
https://YOUR_SITE/admin.html
```

Paste the same `ADMIN_TOKEN`.

## How phrase storage works

- Public suggestions are submitted to `/api/phrases`.
- They are stored as pending records in Netlify Blobs.
- You approve/reject them in `/admin.html`.
- Approved phrases are returned by `/api/phrases`.
- The generator occasionally uses approved public phrases.
- Local phrases are still stored only in the visitor's browser using `localStorage`.

## Change watermark before launch

In `index.html`, search for:

```html
<input id="siteReference" value="primerlugar.mx" disabled />
```

Replace `primerlugar.mx` with your final domain.
