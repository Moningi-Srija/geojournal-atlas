# GeoJournal Crackathon handoff

## The one-line story

GeoJournal turns scattered travel photos, notes, map history, and plans into one living 3D Memory Atlas that users can import into, search, rediscover, plan from, and share with intention.

## Stage truth rules

- Say **“built today”** for the crackathon build: the redesigned responsive Atlas, demo journey, reviewed import flow, Rediscover, Trip Fit, co-traveler workflow, Inspiration surfaces, and Pro experience.
- Say **“can use the configured OpenAI model”**, not “we trained our AI” and not an unverified model name. Semantic search has a local intent fallback; Nexus shows a labelled sandbox/fallback when the API is unavailable.
- For Dodo, use this exact line: **“GeoJournal has Dodo Test Mode products for Monthly, Annual, and one creator guide. The hosted checkout handoff is validated; no production charge, entitlement, or creator payout is being claimed.”**
- The Dodo promotion code is account credit, not an API key. Do not call checkout production-ready until live products, business verification, webhooks, and entitlement handling have all been verified.
- Say **“The GeoJournal Nexus B2C instance is active in Maximem Synap; the server-side bridge is next.”** The promotion code funded the account, not the frontend. GeoJournal does not send private user memories to Maximem today.
- Say **“The presentation community is seeded demo content.”** The Circle, followers, shared trips, and community stories are populated to demonstrate the interaction design; do not describe those people or posts as live users.
- Instagram support means **user-uploaded export JSON with usable geotags**. It is not a live Instagram account connection and never requires the user’s Instagram credentials.
- Expeditions, seller tools, promoted placements, fulfilment, and creator payouts are presentation previews. One Kyoto guide has a Dodo Test Mode checkout; it is not a fulfilled marketplace purchase.
- Do not claim live fares, availability, automatic leave balance, automatic holiday data, or direct calendar sync. Trip Fit currently accepts manual context and a locally read `.ics` file.

## Delta-4: before and after

| Travel-memory job | Before GeoJournal | With GeoJournal |
| --- | --- | --- |
| Build a travel history | Start an empty journal or manually reconcile Photos, notes, and maps | Parse an export into a review inbox; accept or reject every suggested pin |
| Find a meaningful moment | Remember a date or place, then scroll through separate apps | Search the memory by meaning and bring its pin into focus |
| Relive the past | Wait for an accidental photo resurfacing | See “On this day” and past-month memories inside the Atlas |
| Plan what comes next | Re-explain travel taste, leave, month, calendar, and budget each time | Let Nexus use Atlas memories plus saved Trip Fit context |
| Share a group trip | Duplicate a post across profiles or make everything public | Invite co-travelers; the same memory appears only after acceptance |

**Answer to “Why Delta-4?”**: “This is not a prettier diary. It changes the unit of work from files spread across apps to a reusable memory graph: import, retrieve, resurface, plan, and share happen in one place. Our Delta-4 claim is workflow compression; the next validation step is measuring time-to-build and time-to-find against the current multi-app workflow.”

## Exact 60-second submission pitch

Record with hard cuts between prepared screens. Keep the cursor still while speaking. Open the presentation Atlas directly at [https://geojournal-atlas-srija-a6b0b.web.app/?demo=1](https://geojournal-atlas-srija-a6b0b.web.app/?demo=1); do not spend recording time signing in or navigating through onboarding.

| Time | Screen and click path | Say exactly |
| --- | --- | --- |
| 0:00–0:17 | Direct `?demo=1` Atlas; no clicks | “Hi, I’m Srija Moningi, a 2025 IIT Bombay Computer Science graduate, and I’ve spent the past year working as a Platform Software Engineer at Oracle. I love building AI products that make everyday data feel meaningful—and that’s what led me to create GeoJournal.” |
| 0:17–0:26 | Hold on the populated globe | “If your journeys live in a paper journal, disappear inside Google Photos, or sit as pins on a wall map, GeoJournal is gold for you.” |
| 0:26–0:37 | **Circle** → point to `17 visible pins` → **Mine** → rotate globe | “It turns those fragments into one living 3D Memory Atlas. Circle brings trusted explorers onto my globe in a different color; Mine returns to only my memories.” |
| 0:37–0:48 | Hard cut to **Memories → Sync → Use demo Timeline sample**; accept one row, reject one, then complete **Import** | “A consent-first inbox reads Google Timeline or geotagged Instagram exports. I accept or reject every suggestion, and accepted pins default to private.” |
| 0:48–0:55 | Hard cut to **Nexus → Trip Fit** with context prefilled | “Nexus connects memory with leave, month, calendar, and budget context to shape the next trip.” |
| 0:55–1:00 | Hard cut to **Memories → Pro**, annual plan selected | “Dodo Test Mode checkout is validated. Maximem Synap is active, with the private server bridge next.” |

If the Dodo Test Mode URL is not configured, say **“sandbox”** rather than **“Test Mode.”** Do not show or enter any access code in the recording.

## Exact five-minute finalist demo

Open [the direct presentation demo](https://geojournal-atlas-srija-a6b0b.web.app/?demo=1) in a fresh tab. This route loads the populated, repeatable demo without sign-in. Prefill Trip Fit before going on stage. Do not improvise extra features.

### 0:00–0:35 — Founder, audience, problem

**Screen:** Direct `?demo=1` Atlas, fully loaded and still.

**Say:** “Hi, I’m Srija Moningi, a 2025 IIT Bombay Computer Science graduate, and I’ve spent the past year working as a Platform Software Engineer at Oracle. I love building AI products that make everyday data feel meaningful—and that’s what led me to create GeoJournal. If your journeys live in a paper journal, disappear inside Google Photos, or sit as pins on a wall map, GeoJournal is gold for you. The memory is not missing; it is fragmented. Photos preserve media, a journal preserves feeling, and a map preserves place, but none gives the whole journey back. GeoJournal turns those fragments into a living Atlas.”

### 0:35–1:10 — Core Atlas

**Click path:** **Circle** → point to the legend showing `17 visible pins` and the two pin colors → open one friend pin → close its card → **Mine** → drag the globe → open the Kyoto pin → close its card → **Density** → **2D map** → **3D globe**.

**Say:** “This is the core experience running today. Every pin connects a place, date, photographs, and the story behind it. Circle overlays trusted explorers in violet alongside my teal memories, with the author identified on every entry; Mine returns to my personal Atlas. I can move through the world spatially, see my travel density, or switch to a familiar map without losing the memory layer. The interface also adapts to mobile. GeoJournal is not asking travelers to organize another folder; it gives their history a shape they want to return to.”

### 1:10–1:55 — Solve the empty-map problem

**Click path:** **Memories → Sync → Use demo Timeline sample** → accept one suggestion → reject one suggestion → **Import accepted memory** → **Done**. Point to the updated Atlas count or newly added pin.

**Say:** “A beautiful globe is useless if a new user sees an empty world. Sync parses current device-based Google Timeline exports and older Timeline or Records JSON, then creates suggestions instead of silently publishing anything. I choose what belongs, reject what does not, complete the import, and every accepted item defaults to private. The Instagram path works the same way for archive JSON when a post contains a usable geotag. This is export import—not a direct Instagram API connection—and GeoJournal never asks for social credentials.”

### 1:55–2:35 — Retrieval and Rediscover

**Click path:** Close Sync → **Memories → Rediscover** → point to **On this day** and **Past Julys** → close Memories → top search: `crimson streets` → submit.

**Say:** “Once history is here, GeoJournal makes it useful. Rediscover intentionally brings back anniversaries and memories from this month in earlier years. Search is about meaning, not only place names: ‘crimson streets’ brings Kyoto into focus from the journal text. When an OpenAI connection is configured, it can interpret the query against Atlas context; if that call fails, a local intent index keeps this demo useful and labels the result honestly.”

### 2:35–3:20 — Nexus and practical Trip Fit

**Click path:** Clear search → **Nexus → Trip Fit** → show home city, leave days, month, budget, holiday notes, and saved calendar events → close Trip Fit → choose **Find my best trip window** only if the response path was pretested.

**Say:** “Nexus turns a memory product into a future-travel copilot. Trip Fit captures the constraints that make advice usable: where I start, leave remaining, preferred month, budget style, office or public-holiday notes, and a calendar exported as an ICS file and read locally. Nexus can ground a recommendation in those constraints and the memories already in my Atlas. Today’s response depends on the configured OpenAI connection; I am not claiming live fares, booking inventory, or a proprietary foundation model.”

### 3:20–4:00 — Intentional sharing

**Click path:** Close Nexus → **Add memory** → scroll to **Who can see this?** and **Add co-travelers** → close → **People → Shared trips** → in demo, accept the prepared invite if it is present.

**Say:** “Travel is social, but memories should not be public by accident. Each entry starts private and can be shared with close friends or the explorer community. A traveler can tag co-travelers, but the memory appears on a friend’s Atlas only after that friend accepts. Public friend profiles can open into their own globe. In authenticated use this is a Firestore-backed invitation workflow; the prepared demo illustrates the same acceptance contract without needing two people on stage.”

If the prepared invite is absent, stop after showing the visibility and co-traveler controls. Say **“The two-account acceptance flow is implemented, but I will not manufacture a live invite on stage.”**

### 4:00–4:20 — A personal identity, not another generic profile

**Click path:** Close People → profile avatar → **Open studio** → switch **Neon cartography** to **Passport editorial** → close.

**Say:** “The Atlas also becomes expressive. Atlas Persona reads the places, categories, photographs, and recurring motifs in my own memories, then builds a travel archetype and an AI-ready art direction. This is a labelled concept preview—it does not upload or replace my photo—but the personalization logic is live and grounded in my Atlas.”

### 4:20–4:40 — Inspiration without hidden advertising

**Click path:** Close People → **Inspire → Inspiration** → **Expeditions** → **Atlas Market**.

**Say:** “The Atlas can also inspire the next journey. Today’s presentation community stories are clearly seeded examples that demonstrate the discovery experience; Expeditions and most seller tools are labelled previews. The Kyoto guide opens a real Dodo Test Mode checkout, with no real charge or fulfilment claim. Paid placements are marked Promoted rather than disguised as recommendations.”

### 4:40–5:00 — Business, sponsors, global day zero

**Click path:** Close Inspire → **Memories → Pro** → select **Monthly**, then **Annual** → point to the checkout status → close on the globe.

**Say:** “GeoJournal Pro is a monthly or annual subscription, not AI credits. Both plans open Dodo-hosted Test Mode checkout. The GeoJournal Nexus B2C instance is active in Maximem Synap; private memory writes wait for the server bridge and consent controls. Our US beachhead is independent travelers and creators reached through clubs and shareable Atlases. I’d love one sharp piece of feedback: what would make you trust GeoJournal with your full travel history?”

## What is live, conditional, and roadmap

| Status | Capabilities |
| --- | --- |
| **Live in the build** | Responsive landing and onboarding; populated presentation profile; interactive WebGL globe; `Mine` and `Circle` scopes with 17 visible demo pins across two clearly labelled colors; friend Atlas viewing; 2D map; pins and memory cards; personal density view; Journal, Insights, and Rediscover; current and older Google Timeline JSON parsing; Instagram export JSON parsing when coordinates exist; per-row accept/reject review and completed local demo import; private/public/close-friends visibility; authenticated co-traveler invitations; prepared demo invite; local Trip Fit context and `.ics` parsing; achievements, profile themes, seeded Inspiration examples; Atlas Persona derivation and style switching; Monthly/Annual Pro selector. |
| **Conditional or sandboxed** | OpenAI-enhanced semantic search and Nexus require a valid configured API key and model access; both have presentation-safe labelled fallbacks. Cloud-persisted imports and real social collaboration require authentication and Firebase access. Dodo Monthly, Annual, and Kyoto Test Mode links are configured and no real charge is possible. The presentation account uses explicitly seeded people, stories, shared trips, and local memories to make the interaction contracts repeatable on stage. |
| **External proof, not yet app data flow** | Dodo Test Mode catalog and hosted checkout handoff are validated. The `GeoJournal Nexus` Maximem Synap B2C instance is active. The browser app does not contain a Synap secret and does not send private memories there. |
| **Presentation preview** | Creator expedition inventory, trip-group advertising, seller publishing, promoted-placement operations, fulfilment, creator payouts, and AI image generation. The Kyoto checkout is real Test Mode; the product delivery workflow is not. |
| **Roadmap** | Production Dodo checkout with verified business, webhooks, and entitlements; server-side Maximem ingestion/retrieval with consent, deletion, and graceful fallback; direct provider connections where platform permissions allow; automatic public/office-holiday and leave-system sync; live travel inventory; saved AI-generated travel portraits; PWA and App Store/Play Store releases. |

## Google Timeline export instructions

Google Timeline is increasingly stored on the user’s device, so do not promise that every account will find it in Google Takeout.

### iPhone or iPad

1. Open **Google Maps**.
2. Tap the profile picture or initial.
3. Open **Settings → Personal content → Export Timeline data**.
4. Save the JSON to **Files**.
5. In GeoJournal, open **Memories → Sync → Google Timeline → Choose JSON file**.

### Android

1. Open the device **Settings** app.
2. Open **Location → Location services → Timeline**.
3. Choose **Export Timeline data** and save the JSON.
4. In GeoJournal, open **Memories → Sync → Google Timeline → Choose JSON file**.

Labels can vary by Android manufacturer and Google Maps version. GeoJournal accepts common current files such as `location-history.json` or `Timeline.json`, plus the older `Records.json`. If the export option is missing, check that Maps and Google Play services are updated and that Timeline is enabled for the intended Google account.

## Top-10 judge Q&A

**What exactly did you build today?**
“Today I rebuilt the experience around a responsive 3D Atlas and added the stage-safe demo, consent-first import review, current Timeline parsing, Rediscover, Trip Fit, co-traveler acceptance, friend Atlases, Inspiration, and the Pro subscription surface.”

**Why is this Delta-4 rather than another journal?**
“A journal captures; GeoJournal compounds. It compresses a multi-app workflow into one loop: import history, retrieve by meaning, resurface over time, plan from it, and share selectively. I am treating four-times-better as a hypothesis to validate with time-to-build and time-to-find tests, not inventing a benchmark on stage.”

**Who is the first customer?**
“Frequent independent travelers who already keep photos, notes, or map history but cannot use them together. The first US channels are independent-travel clubs, travel-journaling and creator communities, with a shareable Atlas as the acquisition loop.”

**Why will users pay?**
“The core Atlas earns trust for free. Pro monetizes repeated value: deeper search, memory-grounded planning, richer imports, and personalization. A predictable monthly or annual subscription fits that value better than metered AI credits.”

**How did you choose $6 monthly and $49 annual?**
“It is an initial pricing hypothesis, not a proven optimum. Six dollars is a low-friction ‘one coffee’ price for recurring memory search, rediscovery, and planning. The annual plan gives about 32% savings and rewards the long-term habit GeoJournal needs. I chose subscription over AI credits because users are paying for a trusted travel companion, not tokens; I would validate it with pilot conversion and willingness-to-pay.”

**How is this different from Google Photos, Day One, Polarsteps, or AI trip planners?**
“Those products are strong at media resurfacing, journaling, route capture, or planning. GeoJournal’s wedge is the connected loop across all five jobs: import, spatial memory, semantic retrieval, nostalgia, and memory-grounded future planning.”

**Is the AI proprietary? What is the moat?**
“No proprietary foundation model is claimed. The near-term advantage is a user-permissioned travel memory graph plus explicit acceptance, rejection, revisit, and planning signals. That context can improve ranking without pretending the base model is ours.”

**Is Google or Instagram connected live?**
“No credentials and no scraping. Users upload their own exports. Google parsing supports common current and legacy Timeline JSON. Instagram support is limited to archive records that actually contain usable coordinates; direct account connection is roadmap.”

**How do you protect location privacy?**
“Imported suggestions are reviewed before saving and accepted items default to private. Publishing is an explicit per-memory choice. Co-travelers must accept before a shared memory appears on their Atlas. Production work will add data export, deletion, retention controls, and a privacy review before scaling.”

**Is Dodo live?**
“Yes in Test Mode: Monthly, Annual, and the Kyoto creator guide open Dodo-hosted checkout, and no real charge is possible. That validates the handoff only. Production still needs business verification, live products, verified webhooks, entitlements, and creator payout operations.”

**How are you using Maximem?**
“The promotion is redeemed and the `GeoJournal Nexus` B2C instance is active in Synap. Nexus shows that infrastructure proof, but the browser does not hold a Synap key or send private memories. The next step is a server-side fetch-before-answer and ingest-after-consent loop with deletion and fallback controls.”

**Can this become a mobile app?**
“Yes. The responsive web experience is the first surface. The path is PWA, then a Capacitor shell for shared code, followed by native auth, deep links, share sheet, notifications, and store-specific privacy work before TestFlight and Play internal testing.”

## Failure-safe demo plan

- **Firebase or sign-in fails:** open the direct `?demo=1` route. Local demo Add, accept/reject, and final import remain usable; avoid claiming that these demo writes are cloud-persisted or that seeded profiles are live users.
- **OpenAI fails:** use the exact search `crimson streets`; the local index should focus Kyoto and label itself offline. Open Nexus only to show Atlas context and Trip Fit, and say the response layer is in sandbox.
- **Google or Instagram file fails:** use **Use demo Timeline sample** or **Use demo Instagram sample**, accept and reject suggestions, complete the local demo import, and point to the new pin.
- **WebGL or graphics stutter:** click **2D map** in the bottom dock. Do not troubleshoot WebGL on stage.
- **Dodo does not open immediately:** stay on the Pro plan selector, point to the sandbox/Test Mode label, and continue. Never type a promotion code, card number, API key, or secret during the demo.
- **Remote photos fail:** continue with the globe, pins, and text. Do not refresh repeatedly; the product story does not depend on image delivery.
- **Shared-trip invite is missing:** show **Add memory → visibility/co-travelers** and explain the acceptance contract; do not create a second account live.
- Keep the final one-minute MP4, pitch deck PDF, GitHub page, and deployed app URL open locally before presenting. If the live app fails completely, play the MP4 and narrate the same five moments.

## Rehearsal and submission checklist

### Product preflight

- [ ] Run `npm run build` and `npm run lint`; resolve errors before recording.
- [ ] Test the deployed URL in a fresh Chromium tab at 100% zoom and at a mobile width.
- [ ] Confirm the direct [`?demo=1` URL](https://geojournal-atlas-srija-a6b0b.web.app/?demo=1) opens a populated Atlas without sign-in.
- [ ] In a fresh demo session, confirm **Mine** shows the personal Atlas and **Circle** shows `17 visible pins`, with teal personal pins and violet friend pins.
- [ ] Confirm globe drag, Kyoto pin, **Density**, **2D map**, and return to **3D globe**.
- [ ] Confirm **Memories → Rediscover** shows **On this day** and **Past Julys**.
- [ ] Confirm `crimson streets` focuses Kyoto both with and without the API connection.
- [ ] Confirm both local import samples open the review queue; accept/reject works; and the final demo import completes and adds its accepted pin.
- [ ] Prefill and save Trip Fit: Bengaluru, a leave balance, preferred month, budget, holiday note, and optional test `.ics` events.
- [ ] Test the prepared demo invite. If it is unreliable, remove that click from the live route and use the fallback line.
- [ ] Confirm Atlas Persona says **Presentation preview** and **Concept mode**.
- [ ] Confirm Expeditions and seller operations visibly say preview, Kyoto says Dodo Test Mode, and promoted content is labelled.
- [ ] Confirm Monthly, Annual, and Kyoto open Dodo Test Mode. Never call them production payments or fulfilled purchases.
- [ ] Turn off notifications, close personal tabs, hide bookmarks, and keep power connected.

### Speaking rehearsal

- [ ] Record the exact 60-second script twice; keep the stronger take at or under 60 seconds.
- [ ] Rehearse the five-minute path three times with a visible timer; target 4:40 so applause or a slow click does not cause overtime.
- [ ] Pause after “the memory is not missing; it is fragmented” and after the Delta-4 answer.
- [ ] Use one outcome per screen. Do not list every future feature.
- [ ] Practise the Dodo, Maximem, privacy, competition, and “what was built today” answers without reading.

### 5:00 PM handoff

- [ ] GitHub repository is pushed and opens without private keys, promotion codes, or access codes.
- [ ] Deployed app URL works in a logged-out browser.
- [ ] One-minute video has clear audio and readable UI.
- [ ] Submission contains team name, member name, GitHub URL, deployed demo URL, and video URL.
- [ ] Pitch deck PDF and editable deck are backed up locally.
- [ ] Submit before the 5:30 PM deadline; use the remaining time only for verification and rehearsal.
