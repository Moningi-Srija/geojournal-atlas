# Importing travel history into GeoJournal

Verified against official Google and Meta guidance on **20 July 2026**.

GeoJournal should use user-requested export files instead of asking for Google or Instagram credentials. The browser reads the selected JSON, prepares suggestions, and saves only memories the user accepts. Accepted imports are private by default.

## What GeoJournal can import today

| Source | Recommended export | What can become a pin |
| --- | --- | --- |
| Google Maps Timeline | Current device Timeline JSON | Visits and route points that contain coordinates and a date |
| Legacy Google Location History | Extracted `Records.json` or Semantic Location History JSON | Coordinate-bearing records and visits |
| Instagram | Extracted posts/reels JSON from an Accounts Center export | Photos or videos for which Meta includes usable coordinates and a date |

Google and Meta do not publish stable field-level schemas for these consumer export files. GeoJournal therefore detects supported structures by their content, not only by filename.

## Google Maps Timeline

Google now stores Timeline on each signed-in device. An encrypted Google backup is different from a readable JSON export and cannot be uploaded to GeoJournal.

### Android

1. Open the phone's **Settings** app.
2. Open **Location → Location services → Timeline**.
3. Under Timeline, choose **Export Timeline data**.
4. Tap **Continue**, select a storage location, and tap **Save**.
5. In GeoJournal, open **Memories → Sync → Google Timeline** and select the exported JSON.

Google documents the export action but does not guarantee an Android filename or public JSON schema. Timeline requires a current Google Maps app and is not available on Android Go. See [Google Maps Timeline help for Android](https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DAndroid&hl=en).

### iPhone or iPad

1. Open **Google Maps**.
2. Tap the profile picture or initial.
3. Open **Settings → Location & Privacy**.
4. Tap **Export Timeline data**.
5. In the iOS share sheet, tap **Save to Files**, choose a folder, and save.
6. In GeoJournal, open **Memories → Sync → Google Timeline** and select `location-history.json`.

Google explicitly documents `location-history.json` as the iOS filename. See [Google Maps Timeline help for iPhone and iPad](https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DiOS&hl=en).

### Older Google Takeout files

`Records.json` and older Semantic Location History files remain useful for legacy accounts and archives, but Takeout is no longer the primary route for modern device-local Timeline data.

1. Create an archive from [Google Takeout](https://takeout.google.com/).
2. Download the ZIP or TGZ archive to a desktop computer.
3. Extract the archive.
4. Select the relevant Location History JSON inside GeoJournal; do not upload the ZIP/TGZ itself yet.

Google notes that archive contents vary and that `archive_browser.html` describes the formats included in a particular Takeout. See [Google's Takeout instructions](https://support.google.com/accounts/answer/3024190?hl=en).

### Important Google caveats

- Timeline is off by default and retention depends on the user's auto-delete settings.
- Data is stored per device, so a user may need to export more than one phone.
- The result should be described as “memories found in this export,” not a guaranteed complete travel history.
- Google's current Maps Data Portability schema does not document a Timeline/Location History object. A direct Timeline OAuth sync should not be promised until Google provides an official supported route. See the [Maps Data Portability schema](https://developers.google.com/data-portability/schema-reference/maps).

## Instagram posts and geotags

### Request the export

1. In Instagram, open **Settings**.
2. Open **Accounts Center → Your information and permissions**.
3. Choose **Export your information → Create export**.
4. Select the Instagram profile and choose **Export to device**.
5. Choose the relevant information, ideally **posts and reels** (stories are optional).
6. Select **All time** and **JSON**. Low media quality is enough for a metadata test; use high quality when the photos themselves will be imported.
7. Start the export. When Meta says it is ready, download it and extract the ZIP.
8. In GeoJournal, choose the posts or reels JSON file from the extracted archive.

Meta says export preparation may take up to 30 days and a completed export remains available for four days. See [Meta's official Instagram export guide](https://www.facebook.com/help/instagram/181231772500920).

### What “Instagram geotag import” really means

Instagram lets users add, edit, or remove a place tag on a post, but Meta's export documentation does not promise that every visible place tag will be present in JSON or that it will contain coordinates. Meta also does not publish a stable Instagram-export JSON schema.

GeoJournal should therefore say:

> Import your Instagram photos, captions, and dates. When Instagram includes location data, we map it automatically; you can review or add missing locations before saving.

An exported file can contain coordinates in media metadata (for example, photo/video EXIF) without containing the visible venue tag. Exact GPS can reveal a home or another sensitive place, so each suggestion must be reviewed before import.

Official references: [export Instagram information](https://www.facebook.com/help/instagram/181231772500920), [add or edit a post location](https://www.facebook.com/help/instagram/841545179210359), and [locations that can be tagged](https://www.facebook.com/help/instagram/1618893218361276).

### Why file import is the correct first version

- Meta's documented media API can only read media owned by professional accounts, not personal Instagram accounts.
- Its published media fields do not include a post-location field.
- Instagram oEmbed is for rendering a public post; Meta explicitly prohibits extracting or persisting its metadata for another purpose.

See Meta's [Instagram media API reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media) and [oEmbed restrictions](https://developers.facebook.com/docs/instagram-platform/oembed).

## Testing an export safely

Never send a password, session cookie, access token, or entire private archive to a developer. For compatibility testing:

1. Copy one or two representative JSON objects into a new file.
2. Replace captions, usernames, media paths, IDs, and exact home coordinates with dummy values.
3. Keep the original field names and nesting.
4. Upload only that redacted fixture.

This is enough to add parser support without exposing the account.

## Production follow-ups

- Accept a complete Instagram ZIP locally, with ZIP-bomb and path-traversal protection, and resolve archive-relative media paths.
- Put locationless Instagram items into a confirmation queue instead of discarding them.
- Let the user search for or drop a pin for a missing place; never silently geocode ambiguous text.
- Parse very large Google exports in a Web Worker and deduplicate exports from multiple devices.
- Keep provenance such as Timeline visit, route sample, Instagram venue, EXIF coordinate, or user-confirmed location.
- Delete raw parsing state when the import dialog closes and persist only accepted normalized memories.
