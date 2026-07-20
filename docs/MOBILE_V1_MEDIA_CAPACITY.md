# Mobile V1 media and capacity

Status reviewed on **20 July 2026**. These are planning estimates, not guaranteed Firebase limits for this specific project.

## Product decision

- Ship photos first; keep video out of the first public release.
- Current compatibility limit: **3 compressed photos per memory**.
- Production target: upload media to Firebase Storage and keep only media paths and metadata in Firestore.
- Future video beta: **1 video, up to 60 seconds, 720p, target 15–25 MB, no feed autoplay**.

## Why video is not in V1

The current app stores compressed image data inside each Firestore `pins` document. Firestore has a hard **1 MiB document limit**, so video cannot be stored there and even several detailed photos can fail. Base64 also adds roughly one-third overhead.

Cloud Storage for Firebase now requires the **Blaze** billing plan. A Spark project receives Storage 402/403 errors, even when a default bucket exists. No-cost allowances can still apply on Blaze. Before media migration, confirm the project plan and bucket location in Firebase Console.

Official references:

- [Firestore usage and limits](https://firebase.google.com/docs/firestore/quotas)
- [Firebase Storage billing change](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Resumable web uploads](https://firebase.google.com/docs/storage/web/upload-files)

## Current no-cost capacity

Firestore provides one no-cost database per project with 1 GiB stored, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day, and 10 GiB outbound/month. Authentication account count is not the immediate constraint; reads and media transfer are.

The V1 queries now filter and cap each Atlas request at 100 documents instead of downloading the entire public collection. With the current inline-photo model, start with a **25–100 daily-active-user closed beta** and monitor transfer closely; photo-heavy feeds can hit outbound limits before read limits. After the Storage/thumbnail migration, roughly **500–1,000 daily active users** can fit the free Firestore read allowance when usage averages about 50–100 document reads per person per day.

| Architecture | Practical planning estimate |
| --- | ---: |
| Text-only Firestore memories | roughly 250,000–400,000 stored posts, but daily reads bind first |
| Current inline-photo model | small beta only; document size and Firestore transfer bind early |
| Storage target, 3 optimized photos/post (~1.65 MB) | roughly 3,000 posts within 5 GB |
| Storage target, 60-sec video (~20 MB) | roughly 250 videos within 5 GB |

The 5 GB media examples assume the bucket qualifies for that no-cost allowance. Bucket region and billing plan must be checked in the console; the repository cannot reveal either one reliably.

## Storage migration before public launch

1. Firebase Console → **Usage and billing**: confirm Spark or Blaze and create budget alerts.
2. Storage → **Files/Usage**: confirm the bucket location and its applicable no-cost allowance.
3. Add Firebase Storage initialization, tested Storage rules, App Check, per-user quotas, and resumable uploads.
4. Store thumbnails/display assets under `users/{uid}/memories/{memoryId}/...`; Firestore stores paths and metadata only.
5. Paginate feeds and load thumbnails first. Open full media only when the user opens a memory.
6. Migrate legacy Base64 photos, verify every upload, then remove the inline copy.
7. Add video only after transcoding, poster creation, cleanup, reporting, blocking, and moderation exist.

## Store subscription note

The Crackathon Dodo Test Mode checkout is intentionally absent from Mobile V1. Digital app subscriptions need a compliant native billing plan for each storefront. Dodo can still be evaluated later for web sales or eligible physical travel services; the app should not expose a presentation checkout as a real subscription flow.

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738)
