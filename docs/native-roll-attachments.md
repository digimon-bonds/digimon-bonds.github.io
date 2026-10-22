# Native roll attachments — local review only

Status: publication authorized by the user after local review on `codex/native-roll-attachments`.

## Evidence inspected before implementation

Real topic: `/t58p25-escola-depois-do-ultimo-sinal` and `/t58p50-escola-depois-do-ultimo-sinal`.

The native frame is `.post#p<ID>`, with `.postprofile#profile<ID>` and `.postbody > .content`. The Skin 2.0 marks these frames with `data-bos-post`.

The official generator in the inspected examples is account `/u1`, currently Omegamon. Identification uses the native profile ID, not only the account name and never links embedded in a message. Nested post-shaped HTML inside another post is excluded.

Server-generated roll content contains the preamble `O membro 'MEMBER' realizou a seguinte ação:`, the configured `!@DIGIMON#$BONDS%&` marker, a horizontal separator and a flat image payload. Normal narration by account 1 is insufficient.

The already installed public `/99191.js` formatter replaces that preamble with `.vantagem`, `.padrao` and `.desvantagem` groups. It marks the post `data-rolls-royce-processado="true"` and provides `data-sucessos`. This implementation does not change that formatter or reproduce its calculation.

## Association

One read of the same topic URL recovers the original preamble after the existing formatter has removed it from the live DOM. The response must have the same origin and pathname, succeed, and be at most two million characters. It is parsed without executing its scripts; only metadata is retained.

The member in that preamble must match the immediately preceding narrative post, with a verifiable native account ID. A consecutive sequence of verified rolls for that same member shares the first source post. An intervening message, missing predecessor, mismatch or ambiguous identity leaves the roll separate. No cross-page guessing or nearest-author search is used.

The live DOM must still have the same predecessor, native author identity, dice image URLs and ordering. Only an already formatted roll with a supplied success label is mirrored. Guests or templates without verifiable profile IDs fall back to the normal separate posts.

## Presentation and integrity

An open-by-default `details` card is placed after the source `.content`, outside the narrative. Each official roll has its own entry and verification link. Advantage, normal and disadvantage groups keep their own supplied totals; no totals are combined.

Only a clone of the rendered `.content` is displayed. Dice image attributes and ordering are preserved; duplicate IDs are removed only from the clone. Success labels are copied verbatim from `data-sucessos`. There is no face interpretation, random generation, success computation, new roll endpoint, BBCode substitution or posting request.

The original automatic post, its profile, native controls, IDs, anchors and content remain in place. A Skin 2.0 CSS rule hides its outer frame only after the mirror has mounted successfully. The mirror has no editing controls. Native server permissions remain unchanged. A direct hash link to the official roll reveals the original post.

## Fallback

Missing/mismatched data, duplicated IDs, unknown formatting, an orphan roll, missing CSS, disabled/failed Skin 2.0, an unsuccessful topic read or any caught rendering exception keeps/restores separate posts. Restoration removes only generated mirror cards and presentation attributes, never a native post or its content. Without JS the hiding markers are never installed.

The existing bridge starts the module once. Mutation observers reuse the first metadata read; normal subsequent page mutations do not issue further topic reads. Unknown newly inserted posts without metadata stay visible until a normal page reload.

## Validation

- 283 automated tests passed, including six association/recognition regressions.
- 20 browser checks passed against real public example posts #523 and #524.
- Browser checks cover exact original content/profile preservation, exact dice HTML/order, copied totals, idempotence, default-open state, official-link fallback, classic-skin fallback, missing CSS, changed source images, rendering exceptions, failed reads, one successful metadata read, observer stability, duplicate DOM IDs, consecutive rolls, editing the source narrative and removing the source post. Removing the source in the local test reveals the unchanged official roll as an independent post; editing the source leaves the same official result. Native server permissions and the ability to request further rolls are unchanged.
- Mobile preview: 390px viewport and 390px document width, all five original dice images loaded.
- Production build passed locally. The preview phase performed no GitHub push, workflow dispatch, backend deployment, forum edit, roll request or post deletion. Publication was authorized afterwards; the implementation remains unchanged.

Local review artifacts (outside the repository):

- `C:/Users/mt164/Documents/Codex/native-roll-preview.mjs` — reproducible local preview/test server, port 4229.
- `C:/Users/mt164/Documents/Codex/native-roll-desktop.png`
- `C:/Users/mt164/Documents/Codex/native-roll-mobile.png`

The preview uses public message content and known native profile IDs from those same messages. No administrator posting/editing controls or credentials are included in the preview fixtures.

## Changed files

- `site/forum-native-rolls.js` — recognition, association, visual mirroring, read caching and fallback.
- `site/forum-skin/forum-app-bridge.js` — registration through the existing bridge.
- `site/forum-skin/bonds-os.css` — Skin 2.0 presentation and responsive layout.
- `site/forum-skin/forumeiros-loader.js` — future cache revision, still local/unpublished.
- `scripts/forum-native-rolls.test.mjs` — automated recognition and association tests.
- `docs/native-roll-attachments.md` — this review record.
