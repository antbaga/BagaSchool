# Sync relay

Small Cloudflare Worker that lets a teacher's devices share their data and send remote-control
messages to each other. It only stores and forwards **encrypted** data: the encryption key is
generated on the first device and passed to the others through the pairing QR code; it never reaches
the relay.

- One Durable Object per "space" (a set of linked devices). The space id is a random 128-bit value.
- Each collection is stored as one encrypted blob with a version number. Writes with an outdated
  version are rejected and the client merges, then retries.
- Remote-control messages are relayed to the other connected devices and never stored.
- A space that is not written to for about 13 months is deleted.

## Deploy

Deployed by `.github/workflows/deploy-worker.yml` on every push to `main` that touches `worker/`
(or by running the workflow by hand). The repository needs two secrets:

- `CLOUDFLARE_API_TOKEN`: a token created from the "Edit Cloudflare Workers" template.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Cloudflare dashboard (Workers & Pages, right column).

The Worker's URL (`https://bagaschool-sync.<your-subdomain>.workers.dev`) then goes in `js/config.js`.
Allowed web origins are set in `wrangler.toml` (`ALLOWED_ORIGINS`).

## Run locally

```
npx wrangler dev --port 8787
```
then in the app's browser console: `localStorage.setItem("bagaschool-sync-url", "http://127.0.0.1:8787")`.
