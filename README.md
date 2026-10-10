# dawvq — recovered frontend

Local reconstruction of the rendered dawvq.com frontend. Requires Node.js 20 or later; no dependencies or build step.

The homepage now includes a cobalt particle globe (`public/globe.js`, `globe-math.js`, `globe.css`) with model orbits. It supports pause/resume, reduced motion, and offscreen/hidden-tab suspension. Geographic data in `public/globe-land.geojson` is Natural Earth 1:110m land (public domain), obtained from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson. Everything runs locally without external runtime requests. If the map cannot load, a geometric particle sphere is shown instead.

```sh
npm start
# http://127.0.0.1:4173
npm test
```

Edit the readable HTML files in `public/`, the original styles under `public/_next/static/css/`, and interaction code in `public/app.js`. `public/access-art.js` runs the recovered original background shaders. All assets are served locally.

This is an editable reconstruction, not the lost original Next.js/React source tree. Original HTML, CSS, fonts, icons, and decorative shaders were recovered from publicly served files on 2026-10-10. Raw reference responses and compiled scripts are kept in the ignored `recovery/` directory. `recover.mjs` refreshes the initial public-page capture and overwrites those HTML files; do not run it after editing them unless you intend to replace them.

Open `/panel` for the reconstructed workspace: Overview, API keys, Requests, Setup, Wallet, Profile, Referral program, and Support. The six Setup guides include the captured PowerShell, Unix, and CMD variants where applicable. Editable view templates live in `public/views/`; shared navigation and interaction code lives in `public/panel.js`, with demo request data in `public/panel-data.js`.

The panel supports demo key creation/editing/pause/revocation, model selection and pricing search, request filters/sorting/pagination/CSV export/details, setup navigation and copy controls, wallet amount calculations, referrals, and local tickets/replies. Changes live in memory and reset on a page reload. Personal identifiers and secrets are replaced with demo values. Model names/rates are the captured website content, not independently verified service specifications.

Authentication and registration are visual previews. Form submissions are intercepted, no credentials are saved or sent, and the local server rejects POST requests. Backend authentication, Turnstile, payments, account data and APIs are out of scope. Top-up checkout never creates a real payment; tickets are never sent to support. Original installer commands are displayed as documentation and never executed by the app.

`public/` can be hosted statically with extensionless routes mapped to matching `.html` files. The included server provides that mapping and binds only to loopback.

The orbital homepage uses a fluid full-width layout in public/landing-wide.css. Homepage colors in the recovered landing stylesheet are aligned to cobalt/ice blue. Account and panel routes retain their previous layout. The hero labels fade when crossing the copy and actions.

Globe startup now imports precomputed local points from public/globe-points.js. Regenerate them with node build-globe-points.mjs only when changing the Natural Earth map. Runtime GeoJSON fetching and polygon classification were removed; the earlier fallback description is superseded.
