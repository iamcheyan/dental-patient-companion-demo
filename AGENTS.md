# AGENTS.md — Dental Patient Companion Demo

Demo only. All patient data is mock under `mock/`.

- Chat route: Magpie `group/default` (`MAGPIE_BASE_URL` + `MAGPIE_GATEWAY_KEY`)
- Do not connect real hospital / EMR / LINE / database
- Do not commit secrets (`.env.local`)
- QR codes: `pnpm qr` with `PUBLIC_BASE_URL`
- Tailscale: expose only loopback Next port; never `serve reset` on shared hosts without checking other mappings
- Evidence screenshots live in `docs/screenshots/`
