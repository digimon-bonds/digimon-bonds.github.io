# Native roll attachments

Status: initial release published after user approval; global permalink, quote alignment and spoiler fixes reviewed on 2026-10-23.

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

The original automatic post, its profile, native controls, IDs, anchors and content remain in place. A Skin 2.0 CSS rule hides its outer frame only after the mirror has mounted successfully. The mirror has no editing controls. Native server permissions remain unchanged. Ordinary hash links (`#ID` or `#pID`) focus the attached result without revealing a duplicate original. “Ver post oficial” adds the explicit `bos_roll_post=ID` view: that roll is shown only as its original post, without a mirrored copy.

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
- `site/forum-skin/forumeiros-loader.js` — cache revision for the CSS and existing bridge module.
- `scripts/forum-native-rolls.test.mjs` — automated recognition and association tests.
- `docs/native-roll-attachments.md` — this review record.


## Global correction — 2026-10-23

Inspected `/t79p25-ikebukuro-dama-de-seda`, source #556 (Myrddin, native `/u16`) and automatic roll #557 (`/u1`). The same roll had one supplied success and one original dice image. The prior permalink behavior deliberately revealed the original alongside the mirror; this explains the duplicated mobile presentation when opening last-message links. Hash permalinks now keep one attached representation on every viewport. Explicit official-view links keep one standalone original, and still preserve all native content.

The narrative used a native 800px `blockquote`, while the content column was wider. Global quote margins now center these constrained blocks instead of forcing them left. Their width and text alignment remain intact. Native `dl.codebox.spoiler` headers and `.spoiler_content` bodies now use the dark palette with white text; hidden attributes and native spoiler toggles are unchanged. All selectors apply to Skin 2.0 throughout the forum, with no topic or post ID selectors.

Validation: 284 automated tests passed; 21 browser regression checks passed, including source editing/removal, original contents, multiple consecutive rolls, image fidelity and fallback. Another 13 browser checks passed at both 1280px and 390px using the actual #556/#557 markup, covering both hash formats, explicit official-only rendering, centered quote geometry, dark/white opened spoilers and no horizontal overflow. Mobile width was 390px with 375px scroll width (vertical scrollbar). These are Chromium browser checks at mobile width, not a claim of a physical iPhone/Safari test.

Local evidence: `C:/Users/mt164/Documents/Codex/native-roll-fix-desktop.png`, `C:/Users/mt164/Documents/Codex/native-roll-fix-mobile-full.png`; reproducible additional preview `C:/Users/mt164/Documents/Codex/native-roll-fix-preview.mjs` on port 4230. No live posts were edited, deleted or rolled during validation.


## Loading and last-message automation — 2026-10-23

The existing identity bridge now starts the roll observer before DOMContentLoaded. It captures verified native preambles before the installed formatter erases them when execution order permits, avoiding a second request in that case. Otherwise it reuses a same-origin topic reader with in-flight deduplication and a 30-second cache, also used by the existing activity feed and last-message cards. Failed reads are not cached. Observation is coalesced per animation frame, without recurring polling for rolls.

A mounted mirror hides its official frame atomically using an owned inline display declaration, retaining/restoring the exact previous display and priority. This remains consistent if CSS is rewritten or a post frame is replaced. Hash navigation focuses only after the mirrored target is present. Cancelling the layer during a pending read cannot mount a late mirror. Recognition failures continue to leave the official post visible.

Home, forum and topic-list `.lastpost` cards replace the displayed author, avatar and destination only after the same strict immediate-source association verifies that the linked last post is a native bot roll. Regular narrator messages, orphan rolls, foreign links and failed reads remain unchanged. The original card nodes are retained for restoration, and no stored author, timestamp, post content or server permission is edited. Two readers at a time service last-message cards, sharing identical page requests with the activity feed.

Validation: 288 automated tests and 31 browser checks passed. Additional browser checks cover exact inline-style restoration, external display rewrites, replacement post frames, cancellation during reads, two last-message cards sharing one read, source-author navigation and exact card fallback, and native preamble capture without any topic request. Desktop/mobile layout checks from the preceding revision remain applicable; a physical Safari device is not available in this session.

Deployment maintenance: official checkout v7.0.1, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0 and deploy-pages v5.0.1 releases/manifests were inspected through the GitHub API; JavaScript actions use Node 24. Runner is pinned to ubuntu-24.04; token permissions and Pages hosting remain unchanged.
