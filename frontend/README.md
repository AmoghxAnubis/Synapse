# Synapse frontend

See the root README for installation and model setup.

- `npm ci`
- `npm run dev` for local development
- `npm run build` then `npm run start` for local production
- `npm run lint -- --max-warnings=0`

Browser requests use the protected same-origin API forwarder. Backend tokens are never configured as NEXT_PUBLIC variables. Pair at /sign-in using the token created by the backend.
