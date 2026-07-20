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

## Preserved AI-showcase checkpoint

The complete AI-assisted Crackathon version is permanently preserved at Git tag **[`v0.1-ai-showcase`](https://github.com/Moningi-Srija/geojournal-atlas/tree/v0.1-ai-showcase)**, pointing to commit **[`62e98a3`](https://github.com/Moningi-Srija/geojournal-atlas/commit/62e98a3)**. Everything implemented through that commit remains recoverable even if the main product is later simplified for its first mobile release.

That checkpoint contains the full AI-assistant feature set built so far:

- Nexus conversational travel copilot with Atlas-memory context
- Meaning-aware memory search with a configurable OpenAI path
- Trip Fit planning using imported calendar events, leave, budget, month, and preferences
- Memory rediscovery and Atlas Persona recommendations
- Presentation-safe local search and copilot fallbacks when no API key is configured

To inspect it without changing the current branch:

```bash
git switch --detach v0.1-ai-showcase
```

The Maximem private server bridge remains a separately labelled roadmap item; this checkpoint does not claim that private browser memories are already sent to Maximem.

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
