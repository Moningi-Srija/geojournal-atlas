# GeoJournal — 3D Memory Atlas

GeoJournal turns scattered travel history into a living Atlas you can search, relive, and share with intention.

## Live product

- **[Open GeoJournal](https://geojournal-atlas-srija-a6b0b.web.app/)**
- **[Open the populated demo](https://geojournal-atlas-srija-a6b0b.web.app/?demo=1)** — no sign-in required

## Mobile V1 product

- Interactive high-resolution 3D globe with a Leaflet 2D map fallback
- Personal and Circle scopes with clearly authored friend pins
- Google Timeline and geotagged Instagram export review with accept/reject controls
- On-device Atlas keyword search, Rediscover, and anniversary memories
- Friend profiles and globes, follow relationships, and shared-trip acceptance
- Inspiration feed, country badges, Trophy Case, avatars, and themes
- A truthful Expeditions Coming Soon screen, with no fake inventory or checkout
- No paid AI calls, API keys, credits, or external digital-subscription checkout in the V1 runtime

The temporary Firestore-compatible uploader is capped at three compressed photos per memory. A production migration to Firebase Storage is required before public media scale or video; see [Mobile V1 media and capacity](docs/MOBILE_V1_MEDIA_CAPACITY.md).

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
- Local in-browser memory search with no paid model dependency
- Historical Dodo and Maximem showcase work preserved only in the tagged Crackathon checkpoint

## Run locally

```bash
npm install
npm run dev
```

No OpenAI key is used or required by Mobile V1.

## Build and verify

```bash
npm run test:import
npm run build
npm run lint
```

Built by **Srija Moningi** for the Antler × Dodo Payments Crackathon.

Current, privacy-first export steps and format limitations are documented in [Importing travel history](docs/IMPORTING_TRAVEL_HISTORY.md).
