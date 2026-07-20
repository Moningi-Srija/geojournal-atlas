# GeoJournal — 3D Memory Atlas

GeoJournal turns scattered travel history into a living Atlas you can search, relive, plan from, and share with intention.

## Live product

- **[Open GeoJournal](https://geojournal-atlas-srija-a6b0b.web.app/)**
- **[Open the populated demo](https://geojournal-atlas-srija-a6b0b.web.app/?demo=1)** — no sign-in required

## What works in the demo

- Interactive high-resolution 3D globe with a Leaflet 2D map fallback
- Personal and Circle scopes with clearly authored friend pins
- Google Timeline and geotagged Instagram export review with accept/reject controls
- Meaning-aware Atlas search, Rediscover, and anniversary memories
- Nexus travel copilot with Trip Fit context and a stage-safe local fallback
- Friend profiles and globes, follow relationships, and shared-trip acceptance
- Inspiration feed, country badges, Trophy Case, avatars, and themes
- GeoJournal Pro pricing and Dodo-hosted Test Mode checkout
- Clearly labelled Expeditions and Atlas Market product previews

## Technology

- React 19, TypeScript, and Vite
- Three.js, `react-globe.gl`, Esri satellite imagery, Leaflet
- Firebase Authentication, Firestore, and Firebase Hosting
- Configurable OpenAI responses with local semantic/copilot fallbacks
- Dodo Payments Test Mode; Maximem Synap instance active with the private server bridge planned next

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` only for services you want to enable. The presentation demo remains usable without an OpenAI key.

## Build and verify

```bash
npm run test:import
npm run build
npm run lint
```

Built by **Srija Moningi** for the Antler × Dodo Payments Crackathon.

Current, privacy-first export steps and format limitations are documented in [Importing travel history](docs/IMPORTING_TRAVEL_HISTORY.md).
