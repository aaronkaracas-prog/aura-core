# mytattoo – change and test record

One line per change. Newest at the top. Each test run says what it covered, so the next run tests something new.

## Nov 13 (page v913–v915, core v9.999.12–v9.999.17)

### Changes

| Version | What changed | Found in |
|---|---|---|
| core v9.999.24 + wrangler.toml | Picture store aura-images bound as AURA_IMAGES – the 22 places that read it first now get the file, not the KV text | Memory map, Nov 14 |
| core v9.999.23 + wrangler.toml | Cloudflare's image tool (IMAGES binding) makes the phone's small and card copies' 720 version; the worker only loads that. Falls back to the old way if the tool fails | Memory crash, all day |
| note | core reads an R2 store AURA_IMAGES in 22 places that is not bound in core – every read falls back to KV; my v9.999.17 "R2 first" did nothing | Read while planning v9.999.23 |
| page v917 | Top bar: a set made from their typed change says "Your Changes"; "Possibilities" only for the Imagine More Possibilities tap (Cover Up said Possibilities after a typed change) | Cover Up runs today |
| setting | config:frame:cover:own – "Every one is that same idea, but drawn as its own design - a different composition, pose and layout, not the same drawing in different colours." | Test 7:22 PM |
| setting | config:frame:cover:own – "Every one is that same idea, drawn as a different design, so no two look alike." (the "completely different design" wording drew snakes, tigers, lighthouses) | Test 7:14 PM |
| setting | config:frame:cover:own – added "Make every one a completely different design, so no two look alike." (the 8 were one design in 8 colours) | Cover Up runs today |
| core v9.999.22 | The sheet's 720 and 240 copies are made while the sheet is loaded for the cut, so the phone's ask never loads the 2304x3456 sheet a second time | Test 6:47 PM (memory) |
| setting | config:talk:addon_words_ms 6000 → 10000 (a card read missed by 0.1s and sent the whole sheet to be read too) | Test 6:47 PM |
| core v9.999.21 | "Drawing it right on your arm now." is caught as a claim (shown to them and sent to the image model before) – any "drawing / imagining / making … now" in a short stretch | Test 6:32 PM |
| core v9.999.20 | My v9.999.19 offer rule took out "…so nothing shows through." as a won't-work sentence, left nothing, and their typed words were drawn – only won't / can't / wouldn't sentences come out now | Test 6:19 PM (forearm cover-up) |
| core v9.999.19 | Add to Existing / Cover Up: when she gives no say-back line, Imagine it draws her own drawing words, else her offer as she said it (question, photo/picture talk, "won't work" reasons, drawing claims taken out) – not their typed words | Retest 5:48 PM |
| core v9.999.19 | Logs: a late card read says when it ends; the job says when it returns (to find the memory kill); picture copies back to two at a time | Retest 5:48 PM |
| page v916 | Cover Up row only ever shows styles that can cover (Fine Line etc. never) | Retest 5:48 PM |
| aura-think v2.27.116 | "in one picture" taken out of her guide (she told Cover Up users "one picture", 8 came back) | Retest 5:48 PM |
| core v9.999.18 + aura-think v2.27.115 | Cover Up: her say-back line (`add`) asked for and kept, like Add to Existing; picture copies one at a time | Retest 5:22 PM |
| page v915 | Cover Up: a style tap shows only Create My Own (no Explore designs), and her pop line talks about the cover-up | Three-flow test |
| page v915 | Cover Up: once a style is chosen, the old style row is taken off the screen | Three-flow test |
| page v915 | Add to Existing / Cover Up: no "Add a photo – Something that inspires you" card when their photo is already in; the line over the chat no longer asks for a photo they already gave | Three-flow test |
| page v915 | Cover Up row: a style she says "would let the tattoo show through" is not offered (Fine Line was offered first) | Three-flow test |
| core v9.999.17 | Add-on sheet cut reads the picture as bytes from storage, not as text, and the phone's card copies wait while the sheet is in memory ("Worker exceeded memory limit") | Three-flow test (same error was cut down before in v9.813 on Nov 3 and v9.900 on Nov 8) |
| core v9.999.17 | "Drawing it on your photo now." is treated as a promise and taken out when nothing is drawn (only "on your arm" was caught before) | Three-flow test |
| core v9.999.17 | Her cover-up advice uses the names on the page's style cards (she named "Dense Botanical", which has no card) | Three-flow test |
| core v9.999.16 | A style is only picked from their own words, not from her reading of the photo | Create runs |
| core v9.999.15 | A new Create starts with a clean brief (an old "rework" was left behind) | Create runs |
| core v9.999.14 | Took out the picture + idea shortcut I added in v9.999.13 (it dropped "instead of the koi"). Their own words go to the image model, as settled | Create runs |
| core v9.999.13 | Chatter is taken out of the drawing words; "coming right up" over nothing is taken out | Create runs |
| page v914 | Only a whole-line "yes" counts as yes ("perfect. make…" is drawn); crumb says Possibilities / Your Changes; stencil thumbnails | Create runs |
| core v9.999.12 | "I can imagine some ideas for you" gets the offer buttons; "Yes, show me" draws at once | Create runs |
| page v913 | Typing on Create after Create My Own no longer restarts the tattoo | Create runs |

### Tests run

| When | Flows | Covered | Report |
|---|---|---|---|
| Nov 13 5:48 PM (core v9.999.18, think v2.27.115) | Cover Up (micro butterfly wrist: thin-line light-grey hummingbird, then "the darker hummingbird"), Add to Existing (koi sleeve: lotus idea button, change) | Say-back draw on Cover Up; memory after two add-on sheets | Results below |
| Nov 13 5:22 PM (page v915, core v9.999.17) | Add to Existing (fine-line wildflower forearm, Dotwork moon), Cover Up (koi sleeve, Blackwork, a fine-line pink idea that can't hide it) | Add-on: idea, Imagine it, Fine-Tune, finalize, 11 artist files. Cover Up: style row, style tap, Create My Own, held constraint, Imagine it | Results below |
| Nov 13 PM | Create (Fine Line, Rosie lettering), Add to Existing (koi sleeve), Cover Up (micro butterfly wrist) | Style pick, talk, changes, Fine-Tune, finalize, artist files | https://claude.ai/artifact/FjZsKgk9meW3fEzmofxmUn |
| Nov 13 AM | Create ×3: style first; chat box only (golden retriever, sunflowers, surfing, realism); with a picture | Changes on each, artist files | https://claude.ai/artifact/APSC7KrvZkKQxv1eFgmkNY |

### Retest results – Nov 13 5:22 PM

| Fix | Result |
|---|---|
| 1. Memory error after add-on sheets | NOT FIXED – killed at 17:25:26 and 17:27:56, both while the phone's 9 picture copies were being made after a sheet; the second kill failed 8 of them |
| 2. Cover Up style tap | Fixed – Blackwork card shows Create My Own only, cover-up line |
| 3. Her advice vs. the row | Fixed – she said Japanese and Blackwork, Neo-Traditional a maybe; row was exactly those three |
| 4. "Drawing it on your photo now" | Not seen this run (she didn't say it) |
| 5. Photo prompt / photo card / old row after Create My Own | Fixed – none shown. One card of the chosen style (Blackwork) still shows |
| NEW: Cover Up draws the idea she turned down | She said a fine-line pale-pink peony won't hide the koi and offered a dark Blackwork peony; Imagine it drew their typed words – 8 fine-line pink peonies. On Cover Up her say-back line (`add`) is not asked for or kept, so their typed words (with "honestly I kind of want") went to the image model |

### Retest results – Nov 13 5:48 PM

| Item | Result |
|---|---|
| Cover Up draws her say-back | NOT FIXED – she still gave no `add` line (her replies had `choose`, then `prompt`/`lines`), so their typed words went again: "I want to cover it up with: I was thinking something tiny and minimal over it, like a single thin line hummingbird in really light grey. ok yeah that makes sense, let's do the darker hummingbird then." → 8 tiny fine-line hummingbirds. $0.065 |
| Memory, one copy at a time | NOT FIXED – no kill after the first koi sheet; killed at 17:59:23 after the change sheet, ~20s after the turn's own work ended |
| Cover Up row | Fine Line offered first again – her read described the tattoo as "a small fine-line butterfly … one of the easier pieces to cover" |
| Her line on Cover Up | "One picture, drawn right over your photo" – Cover Up draws 8 |

### Test – Nov 13 6:19 PM (core v9.999.19, page v916, think v2.27.116)

| Item | Result |
|---|---|
| Cover Up row | Fixed – Japanese, Neo-Traditional, Blackwork, Ornamental; no Fine Line though her read said "fine line wildflower piece" |
| She holds the rule | Yes – "tiny fine line stars won't hide those wildflowers", offered a solid blackwork moon and stars |
| Imagine it draws her offer | NOT YET – my offer rule took out her whole say-back ("…so nothing shows through" read as a reason), so their typed words were sent again; 8 fine-line moon-and-stars. $0.065. Fixed in core v9.999.20 |

### Test – Nov 13 6:32 PM (core v9.999.20) – Cover Up works end to end

| Item | Result |
|---|---|
| Cover Up row | Japanese, Neo-Traditional, Blackwork – no Fine Line |
| She holds the rule | "fine line butterflies won't hide what's underneath" – offered fuller butterflies with solid dark wings and rich colour |
| Imagine it draws her offer | FIXED – sent "I want to cover it up with: Love it - fuller butterflies with solid dark wings and rich color will actually swallow that wildflower piece while still looking soft and feminine. Drawing it right on your arm now." → 8 bold, dark-winged butterflies over the forearm. $0.065 |
| Change | "deeper navy and one more small butterfly by my wrist" → done |
| Artist files | Locked in "Deep Ocean" – 7 files at 6:38 |
| Still wrong | "Drawing it right on your arm now." shown to them and sent with her offer (fixed in v9.999.21); bar says "Possibilities" after a change; the 8 are one design in 8 colours |
| Memory | No kill this run |

### Test – Nov 13 6:47 PM (core v9.999.21) – Add to Existing, butterfly wrist, memory logs

| Item | Result |
|---|---|
| Add-on | "a second smaller butterfly following it, with a dotted trail looping between them" – she said it back, Imagine it sent her line ("a second smaller fine-line butterfly following the first, with a dotted trail looping between them") → 4 designs. Change "make the dotted trail a bit longer so it curls up toward my palm" → 4 versions |
| Memory kill | Both turns: killed 10s (18:49:29) and 8s (18:51:26) AFTER "job returned" – the job and its late card reads were finished. Each time the phone was loading the new cards: 8 card copies plus a small copy of the whole 2304x3456 sheet (?w=720), each made by loading the full picture into the worker. The second kill failed the copies still running |
| Card reads | One per sheet missed the 6s limit by 0.1s ("came back 6.1s after it began"), which sends the whole 10 MB sheet to be read too |

### Test – Nov 13 7:05 PM (core v9.999.22 + 10s card reads) – Add to Existing, koi sleeve

| Item | Result |
|---|---|
| Sheet small copies | Made at the cut; the phone's asks came back in 36-73 ms (read, not made) |
| Card reads | 4 of 4 card by card, 6.8s and 6.9s – no whole-sheet read, no LOOKCOPY |
| First sheet (dragon head) | No crash |
| Change sheet (red eyes, gold scales) | Crash at 19:09:07 – 20s after the job returned and 10s after the last card copy finished; nothing logged was running. All 8 cards had already loaded, so nothing on screen broke this time |

### Test – Nov 13 7:14 PM – Cover Up, butterfly wrist, new wording

| Item | Result |
|---|---|
| Row | Blackwork, Neo-Traditional, Japanese |
| Her idea / their idea | They asked for "a rose with a little swallow, something bold"; she agreed, they said "neo traditional, let's see it" |
| Words sent | "I want to cover it up with: a neo-traditional rose with a swallow, bold saturated color with heavy black shading, covering the whole old tattoo and larger than it, on my wrist." (her own drawing words) $0.065 |
| The 8 | Now 8 different designs – but only 2 are a rose and swallow; the rest are a snake, moth, dagger, tiger, lighthouse, peony with a butterfly. "Completely different design" pulled them off their idea |

### Test – Nov 13 7:22 PM – Cover Up, butterfly wrist, "same idea, drawn as a different design"

| Item | Result |
|---|---|
| Words sent | "I want to cover it up with: a neo-traditional rose with a swallow, bold, covering the butterfly, same spot on the wrist, larger than the old tattoo." (her offer) $0.065 |
| The 8 | All 8 are a rose and swallow – but one layout in 8 colourways again (Bold Colourways, Warm Sunset, Purple Moon, Black & Grey…) |

### Test – Nov 13 7:40 PM – Cover Up, butterfly wrist, "different composition, pose and layout" – PASSED

| Item | Result |
|---|---|
| What Imagine it drew | Her words: "a large neo-traditional rose with a swallow, bold outlines and solid saturated color, covering the old tattoo completely and extending past its edges on the wrist, cover-up" |
| The 8 | All 8 a rose and swallow, each arranged differently: flying over, swooping around, rising above, perched, diving, wrapping around, wings spread, a curve. Same red-rose palette |
| Memory | No crash |

### Test – Nov 13 7:55 PM (page v917) – Cover Up top bar

| Item | Result |
|---|---|
| Typed change ("make the koi more orange and add some water splashes") | Bar: Your Designs › This Design › Your Changes – FIXED |
| Imagine More Possibilities | Its tap sends "Imagine 8 possibilities", which the page reads as no words of theirs → still "Possibilities" (checked in the page; not drawn again) |
| After a change | The options under a changed set are Finalize / Fine-Tune / Start Over – no Imagine More Possibilities (unchanged) |

### Test – Nov 13 8:12 PM (core v9.999.23, image tool on) – Add to Existing, forearm, hummingbird

| Item | Result |
|---|---|
| Cards | All 8 + 14 loaded and look as before (logo, title box); no "[IMAGES] failed" lines |
| First sheet | No crash |
| Change sheet | Crash at 20:15:57, 17s after the job returned, while two card copies were still being made – those two took 21-22s instead of 1-5s |
| Change words | Their typed line went to the image model as typed ("love the hummingbird, can you make it a little bigger and add a few tiny dots trailing behind its wings") – she gave no change line this time |
| Pattern | The last four crashes all came after a CHANGE sheet; a first sheet crashed only twice all day |

### BEFORE test – Nov 14 5:40 AM (core v9.999.23) – the fixed memory test

Add to Existing, koi sleeve: one sheet (hannya mask idea), then three changes on card 1 ("make the mask red with gold horns", "dark storm clouds behind the mask", "a few small lightning strikes in the clouds").

| Turn | Crash |
|---|---|
| Sheet | none |
| Change 1 | 05:43:50 – 21s after the job returned |
| Change 2 | 05:45:57 – 18s after |
| Change 3 | 05:47:48 – 19s after |

**3 crashes out of 3 changes.** The AFTER test is the same four turns; done = 0 crashes, cards unchanged. (Change words were her line this time, e.g. "make the hannya mask red with gold horns".)

### AFTER test #1 – Nov 14 5:59 AM (core v9.999.24, picture store connected) – same four turns

| Turn | Crash |
|---|---|
| Sheet | none |
| Change 1 | 06:02:20 – 19s after the job returned, 16s after the phone's last card copy finished |
| Change 2 | 06:04:11 – 19s after |
| Change 3 | 06:06:13 – 18s after, 15s after the last copy |

**Still 3 of 3.** The cut now reads the sheet from the store ("r2_get OK") and every card loaded on the phone, but the crash comes ~15s after everything has finished. What is left inside the worker is the image library's memory from the cut (the 2304x3456 sheet as 32 MB of pixels, which it never gives back) – the next piece is the cut itself.

### Core v9.999.25 – Nov 14 (handed back, step 2: the image tool cuts the sheet)

- The cut no longer loads the whole drawn sheet in the worker. Cloudflare's image tool makes a half-size copy, the worker finds the cards on that (the same rules as before), then the tool cuts each card out of the full sheet and only that card is loaded.
- Column edges are re-measured at full size on a 128 px wide strip of the sheet (the tool cuts it), because on two add-on sheets the half-size copy put an edge up to 57 px off.
- Checked before handback: on 22 real sheets (11 add-on/cover, 11 Create – 148 cards) the method gave exactly the same cards and artwork as the old cut, on every edge. The code itself was then run locally against three test sheets (including an odd size) with a stand-in for the image tool: every card came out at exactly the expected size.
- If anything doesn't come out right (wrong size back from the tool, no cards found, tool error), it falls back to the old cut, unchanged.
- Cost: about 11-15 image-tool cuts per sheet. 5,000 a month are free, then $0.50 per 1,000 (about half a cent a sheet).
- Next: one sheet checked by eye ("cut by the image tool" in the log), then AFTER test #2 – the same four turns on the koi sleeve. Done = 0 crashes, cards unchanged.

### AFTER test #2 – Nov 14 6:34 AM (core v9.999.25, the image tool cuts the sheet) – same four turns

| Turn | What happened | Crash |
|---|---|---|
| Sheet (hannya mask) | Log: "cut by the image tool, the sheet never loaded whole" · 17.4s · 4 cards, titles read 4 of 4 · 74s turn | none |
| Change 1 – "make the mask red with gold horns" | Red mask, gold horns; cut by the tool (06:37:44-55) | none |
| Change 2 – "dark storm clouds behind the mask" | Dark clouds behind the mask; cut by the tool (06:41:03-18) | none |
| Change 3 – "a few small lightning strikes in the clouds" | Small yellow lightning in the clouds; cut by the tool (06:42:59-43:11) | none |

**0 crashes out of 3 changes** (BEFORE and AFTER #1 were 3 of 3, each ~18s after the job returned). Logs checked through 06:44:59. Cards look the same as before (white card, clean edges). Image model cost unchanged; the image tool did about 11-15 cuts a turn (free tier).

Words sent (from the later log pulls – a job's lines only arrive when it ends): change 1 "make the hannya mask red with gold horns", change 2 "add dark storm clouds behind the hannya mask", change 3 "add small lightning strikes in the dark storm clouds behind the hannya mask" – each from her line, not the typed words. Nothing refused. Sheet $0.1282; the change costs are cut off the log line.

Seen, not fixed (proposed, waiting on go): (1) LOGS cuts every line at 600 characters and the sent words at 400, so change lines lose the model and price; (2) pull-logs.ps1 never retries a minute whose second pull got no answer – 06:42 lost change 3's lines (recovered by hand with LOGS 06:42). "r2_get ERROR" still shows twice (06:34:54, 06:39:25).

### Core v9.999.26 + pull-logs.ps1 – Nov 14 (handed back, Aaron: go)

- LOGS keeps each line up to 2,000 characters (was 600), and the "sent:" line keeps the words up to 1,500 (was 400) – change lines now show the model and the price.
- pull-logs.ps1: a minute whose second pull gets no answer is asked again on the next passes (up to 10), and the outcome is noted in pull-errors.txt.

### Check of v9.999.26 – Nov 14 7:01 AM (one change on the koi sleeve)

- Typed: "love it, now add a few gold koi scales falling around the mask". Her line sent: "add a few gold koi scales falling around the hannya mask".
- The log now has the whole sent line (1,454 characters) and the price: gpt-image-2.5-flare $0.139965. Cut by the image tool in 18.9s, no crash.
- Card 1: gold scales falling around the mask; the storm clouds and lightning from the earlier changes are still there.
- Seen, not fixed: (1) while it drew, the screen showed her line "...Here are some versions of that change on you - tap the one you love..." before any versions existed, then the same sentence again when they arrived; (2) card 1 is printed "ONI MASK" though the picked card was named "Hannya Mask" – the card reader calls the same mask Oni on some cards and Hannya on others.
- pull-logs.ps1: the app would not download the .ps1; the new script was given as a paste-in block. Not confirmed yet that it is in place (the copy on disk was still the old one at 07:08).

### Core v9.999.27 – Nov 14 (handed back, Aaron: go)

- While a change draws, a sentence of hers that points at pictures before they exist ("here are some…", "tap the one…", "Finalize it", "Fine-Tune it") is taken out of the line shown. Checked on today's three lines: "On it - gold koi scales falling around the mask it is."
- On a change sheet the card reader is told the name of the card being changed (from pickname:) and keeps it unless a card's main subject is different. First sheets unchanged. The log line says "told the name to keep".

### Check of v9.999.27 – Nov 14 7:24-7:31 AM (koi sleeve)

- 07:24 typed "love number 2, can you add a small gold crescent moon above the mask" (after tapping card 2): the lettering check answered LETTERING: "love number 2" and the lettering sheet came up ("Love it. Before I imagine it, let's get the lettering exactly right."), nothing drawn. NEW BUG - not fixed yet.
- 07:30 typed "no lettering, I just want a small gold crescent moon above the mask": lettering none; her line sent "add a small gold crescent moon above the hannya mask, no lettering"; $0.14022; cut by the image tool 20.4s.
- While it drew the screen showed only "Got it - no lettering, just the small gold crescent moon above the mask." (her "Here it is." taken out) - fix 1 works.
- Card reader "told the name to keep: Hannya Mask": all 4 cards Hannya Mask - fix 2 works. Card 1 shows the gold crescent moon above the mask.

### Phone scroll on the photo flows – Nov 14 7:45 AM (page v918 handed back, Aaron: go on hero)

- Add to Existing, Cover Up and See It On You (hero picture + Add a photo / Photo tips): the screen scrolls by 11px at 375x812, 2px at 390x844, 182px at 390x664 (an iPhone in Safari with its bars showing). Create Your Own Tattoo fits.
- Cause: on phones the hero is always full width (mt-shell.html `@media (max-width:899px){ .phero img{width:100% !important;max-height:none !important} }`), so a 2:3 picture is 1.5x the screen width tall whatever the screen height. The desktop rule already caps it at `calc(100dvh - 262px)`, which is exactly header + composer + buttons on a phone too.
- Tried in the page: with the cap on phones there is no scroll at any size; at 390x664 the picture is 268x402 with black either side (blends into the black page). Lettering "love number 2" bug parked by Aaron - rare in practice, he will circle back.

### Check of page v918 – Nov 14 7:54 AM (phone sizes)

| Screen | 375x812 | 390x844 | 390x664 |
|---|---|---|---|
| Add to Existing | no scroll, hero 367x550 | no scroll, 388x582 | no scroll, 268x402 |
| Cover Up | no scroll, 367x550 | no scroll, 388x582 | no scroll, 268x402 |
| Create Your Own Tattoo (style row + I have an idea / I have a picture) | no scroll | – | scrolls 126px |
| See It On You (same layout as Create) | no scroll | – | scrolls 119px |

Correction: See It On You is the Create layout, not the hero + Add a photo layout; my earlier "11px" for it was a stale reading. The hero fix does not touch the Create layout; it only scrolls on a short screen (iPhone Safari with its bars showing).

### Aaron's phone walk 7:56-8:08 – findings (nothing changed yet)

- Dido: 07:30:19 "Let's add the name, Dido" (a change on card 4) – the lettering check answered LETTERING: none; the 4 were drawn with no lettering sheet. Same check said "love number 2" WAS lettering at 07:24. It runs on the default (cheapest) model – config:source:lettering:model is not set.
- Style taps open three different things: (1) home / Create row / Discover (data-sinfo) -> the full style card, Create My Own / Explore designs; (2) her style chips (data-cho) -> "X it is." with Imagine / I'll tell you my idea; (3) the style row under her reply to a picture (data-card) -> the full style card again, with Explore designs mid-conversation.
- Create screen: style tap -> style card -> Create My Own -> "Your Idea" screen with an Add a photo button; "I have an idea" with a style chosen lands on the same screen.
- "I kept what we talked about – tap my butterfly" (crumbLeave) shows 1.5s after leaving a design, even if they have opened another screen by then.
- Start screens at 375x812: none scroll. At 390x664: Create 126px, See It On You 119px, Ink It 63px; Add/Cover none; Get Inspired none.

### Core v9.999.28 + page v919 – Nov 14 (handed back, Aaron: "go on all")

Core v9.999.28
- Correction to the 8:08 findings: Dido's name was not misread - on a change to a design the lettering is read in the same call as her say-back; at 07:29:44 that call took over 15s, its lettering went with it, and the backstop check is off on that road. Now, when her say-back is late, the short lettering check (letterFind) reads their change; new lettering brings up the sheet first, as on every other road. Log: "[TURN:LETTER] her say-back was late - the lettering check read their change: ...".

Page v919
- One rule for a style tap. Browsing (home, Discover, the styles page): the big card, Create My Own / Explore designs, unchanged. On Create and See It On You: the tap picks the style (lit, "Choose a style – Neo-Traditional", her line "Neo-Traditional it is. Now tap I have an idea ... or I have a picture"); I have an idea starts the tattoo in that style and opens the box; I have a picture starts it and opens their photos; typing an idea straight in starts it in the style with their words right after. In the chat (her style choices, the style row under her reply to a picture, a style row on the welcome): "X it is." - after their idea or picture "Want me to imagine it in X?" Imagine it / Tell you more first; before it "Imagine designs / I'll tell you my idea". No big card and no Explore designs mid-conversation; her style choices no longer open a big preview first.
- After a style start (Create My Own, I have an idea) there is no Add a photo button under her question; the line reads "X – now tell Aura your idea below." The + in the box still takes a photo.
- "I kept what we talked about" shows only if nothing was tapped since leaving and something was said or drawn.
- Short phone screens (height up to 760): the start pages' own line goes, style cards 84px, the hero shorter and full width. Checked at 390x664: Create, See It On You, Ink It all 0px.
- Tested in the live page with the new code put in by hand (no image drawn): Create -> Neo-Traditional lit -> I have an idea -> her "Neo-Traditional it is. What would you like in it..." with the box focused; a picture sent from Create, her style choices, Chicano -> "Chicano it is. Want me to imagine it in Chicano?" -> Imagine it sent "Imagine some ideas for me in the Chicano style" with the style; Tell you more first sent "Let's create my own in the Japanese style"; a tap outside cleared the pick.

### Check of core v9.999.28 + page v919 live – Nov 14 8:36-8:43 AM (phone 390x844)

- Create -> Japanese tapped: lit, "Choose a style – Japanese", no big card. I have an idea -> "Japanese it is. What would you like in it - a koi, a dragon...? Tell me your idea." with the box focused; no Add a photo under it.
- Idea "a koi swimming up a waterfall, with my golden retriever sitting on a rock watching it" -> Imagine it -> 8 drawn in Japanese (gpt-image-2.5-flare, 62s, cut by the image tool). Lettering none.
- Card 1 -> Fine-Tune It -> "let's add the name, Dido": her say-back came in 3.1s with the lettering "Dido" -> "Love it - first, pick how you'd like your new lettering to look." + Choose my lettering, nothing drawn. (This went the normal road; the new late road only runs when her say-back takes over 15s.)
- Tattoo Styles page (browsing): American Traditional -> the big card with Create My Own / Explore designs, unchanged.

### Page v920 – Nov 14 (handed back, Aaron: go)

- The Your Idea hero, approved by Aaron: phone img_mwgn32xxrlcn (1024x1536, $0.042), computer img_mwgn5w6c0tg6 (2048x1024, $0.048) - "YOUR IDEA / Tell Aura Anything", a woman lost in thought with a koi, rose, dog's face, compass and butterfly rising as glowing violet linework.
- A tattoo started from a style (I have an idea after a style, Create My Own) shows this hero instead of the style banner; the style is a tag on it ("Chicano"); a tap opens the box; the back arrow on it still goes back. I have an idea with no style is unchanged.
- Tested in the live page with the new code put in by hand: Create -> Chicano -> I have an idea -> the hero with the Chicano tag, her "Chicano it is. What would you like in it - a portrait, roses, praying hands, a lowrider, lettering, family? Tell me your idea.", no scroll at 390x844 (hero 582px); a tap on it put the cursor in the box; at 1280x800 the wide picture with the tag centered on it.

### Check of page v920 live – Nov 14 9:01 AM

- Phone 390x844: Create -> Fine Line -> I have an idea -> the Your Idea hero with the "Fine Line" tag, no scroll (hero 582px); her line "Fine Line it is. What would you like in it - flowers, a name, a small symbol, a delicate animal? Tell me your idea."; a tap on the picture put the cursor in the box.
- Computer 1280x800: Tattoo Styles -> Japanese -> Create My Own -> the wide hero (1076x538) with the "Japanese" tag centered, no scroll; her line "Japanese it is. What would you like in it - a koi, a dragon, a tiger, a snake, waves, cherry blossoms? Tell me your idea."

### Pictures drawn – Nov 14 (Aaron approved each)

- Your Idea, redrawn without the words "YOUR IDEA": phone img_mwgr9w2hr6jf (1024x1536), computer img_mwgrah3fhuix (2048x1024).
- Get Inspired, "GET INSPIRED / Anything Can Be Ink": phone img_mwgr8hwbe2b3 (1024x1536), computer img_mwgread8ns7o (2048x1024).
- Your Pick, "YOUR PICK / Make It Ink" with an empty frame: phone img_mwgr97p5olp8 (frame 20.21-79.49% across, 25.26-70.96% down), computer img_mwgrevmv13z4 (frame 59.77-88.23% across, 8.50-74.61% down).
- Each picture cost $0.042-0.054; about $0.37 for all of them.

### Core v9.999.29 – Nov 14 (handed back, Aaron: go)

- The rule that a picture sent from Create is one they like, not their skin, now covers Get Inspired (job4) too. A fresh start sets new_flow and clears the brief. She is told they are making a new tattoo from this picture: she says what she sees and offers to imagine it. Her read is her say-back, so a yes draws the 8 from it.
- Checked the other job4 lines in core: the "their tattoo" choices skip job4 already, and the section is still recorded as job4.

### Page v921 – Nov 14 (handed back, Aaron: go)

- Your Idea: the new pictures. The back arrow on the picture is gone; the header's arrow is the only one. On phones it can be as tall as 100dvh - 194px (it was 262px less).
- Get Inspired: the new hero, shown whole. On phones it is sized to fit with its two choices: (100dvh - 410px) x 2/3 wide, or (100dvh - 340px) on short screens. The back arrow moved to the card's corner. On computers it is 2:1.
  - The buttons are now "Show me real tattoos" / "Search anything in the world". The results row, her page line, the page's own line and the "choose first" line all use the new names.
- Your Pick: the picture they tapped sits in the hero's frame (tall hero on phones, wide hero from 900px). The heart and ✕ stay. The title and source sit small under the frame; on a computer they sit on the hero's dark left side with Work on this.
- Work on this (Get Inspired): goes straight to her with the picture: a new tattoo, page job4, fresh, no words, no inspire flags. Nothing is parked by the chat box, and there is no fixed "Tell me what you'd like to change or add" line. Ink It's Work on this is unchanged.
- Tested in the live page with the code put in by hand. The sends were caught, so the model was not called.
  - 390x844: Get Inspired hero 289x434, the choices end 33px above the chat box. Your Pick fits with no scroll. Your Idea hero 390x586 with one back arrow.
  - 390x664: Get Inspired hero 216x324. Your Pick is 343x632 with no scroll.
  - 1280x800: Get Inspired hero 938x469. Your Pick is 1040x521 with the orangutan in the frame.
  - Work on this sent `said:"" fresh:true page:job4 photo` with no inspire flags.
  - Back on Get Inspired, "Harley Davidson" went to the search (it waited for a choice), not to her.
- Her read of the picture is still to be checked: it needs core v9.999.29 live.

### Live test of v921 + core v9.999.29 – Nov 14 11:26-11:27 (pta_b2047549fa23c06a, phone 390x844)

- Get Inspired > Show me real tattoos > "t rex" > T-REX Skull Dotwork Tattoo (Tattoodo) > Work on this.
  - She read it: "That's a great one - a T-rex skull in black and gray, heavy shading with fine dotwork, sitting on the inner forearm... I'd love to imagine a brand-new design from this picture for you - just say the word, or tell me what you'd want different." Buttons: Yes, show me / I have my own idea. Nothing was parked.
- "i love it but i want the whole t rex not just the skull, roaring, with some jungle leaves around it": her say-back, then Imagine it. Nothing was drawn on this turn.
- Imagine it: `job=rework body_photo=false`, so it went to the change road. Sent: the photo + "i love it but i want the whole t rex not just the skull, roaring, with some jungle leaves around it". One picture came back on the stranger's arm (img_mwgss2gen7kx) instead of 8. Nothing refused.
- Cause: her first read wrote job "rework" because the picture is a tattoo on an arm.

### Core v9.999.30 – Nov 14 (handed back, Aaron: go)

- On a picture they like (not their skin, not the old inspire road), a job of rework or cover becomes "from": the tattoo is made from the picture. The kept brief is corrected too. Imagine it then takes the proven Create road: the new-tattoo 8 from the picture.

### Live test of core v9.999.30 – Nov 14 11:45-11:54 (pta_b2047549fa23c06a, phone 390x844)

- Owl (Shoulder Owl Tattoo, Pinterest) > Work on this.
  - Her read: "Now that's a piece - a great horned owl in black and gray realism ... Want me to imagine some ideas made from this picture?"
  - "love this but i want the owl flying with its wings spread out and a pocket watch hanging from its claws" got her say-back, then Imagine it.
  - Imagine it drew the 8 from the picture plus "Great horned owl in black and gray realism, flying with its wings spread, a pocket watch hanging from its claws". All 8 show the owl in flight with the watch, each in a different style.
- T-rex skull again > Work on this > "yeah but make it the whole dinosaur walking, coming out of a volcano behind it" > Imagine it.
  - Drew the 8 from "Whole T. rex dinosaur walking, emerging from a volcano behind it, heavy black and grey with fine dotwork shading". All 8 show a full T-rex walking in front of a volcano.
- In both runs her read wrote no job (`job=-`), so the v9.999.30 rule did not need to run. It is in place for when she writes rework/cover again.
- Seen: r2_put ERROR lines while the sheets were saved (11:46:42-50, 11:54:34-40). Both sheets saved and showed.

### Core v9.999.31 + page v922 – Nov 14 (handed back, Aaron: "that's the right approach ... when they click on it to see it bigger we can grab that one")

- Seen (Aaron, about 12:0x): a Get Inspired picture, then Work on this, said "I couldn't open that photo from its website". The core logs from 11:58-12:09 show only health checks: two of the four failure exits (not on the search's list; over 6MB or under 2KB) wrote no line, and an over-6MB picture never tried Brave's copy.
- Core: inspire_take takes `grab` (fetch only; the conversation's state is untouched) and `mark_only` (state only, no fetch).
  - Order: the full picture; if over 6MB, shrunk to 2048 wide by Cloudflare's image tool; if refused, broken, too small or the tool fails, Brave's copy (the one on their screen).
  - Every failure logs "[INSPIRE] take failed (...)" with the reason and the address.
- Page: the Your Pick card grabs its one picture as it opens. Work on this uses that picture plus a mark_only call, with no second fetch.
  - If the grab fails, the card says "I couldn't get this picture from its website – try another one." and Work on this is not offered.
  - Nothing else is grabbed: not the search results, only the card they open.
- Tested in the live page with the new page code put in by hand (core not live yet), 390x844:
  - A Northern Lights picture (istockphoto) was grabbed as the card opened (64KB).
  - Work on this sent that same picture to her at once: `said:"" page:job4 fresh:true`, photo 64447 characters, caught so the model was not called.
  - A picture from no search showed the card's note, with no Work on this.

### Live check of core v9.999.31 + page v922 – Nov 14 12:20-12:21

- "Search anything in the world" > "grand canyon at sunset": 16 pictures grabbed as if their cards opened, all ok.
  - Mostly 33-110KB in 0.2-0.8s. Wikimedia's full photo was 4012KB in 5.0s (under 6MB, kept whole).
  - Flickr answered http 403. The log says why, and Brave's copy was used (38KB); before v9.999.31 that picture would have shown "I couldn't open...".
- A second batch failed "not on this search's list". My own test overlapped two searches (someone tapped Show me real tattoos mid-test), so the grand canyon tattoo list landed under the "milky way" words. Every failure logged its reason. In normal use a second search can't start while one runs.
- Not exercised yet: the shrink of a picture over 6MB (none came up).

### Seen – Nov 14 12:25-12:26 (Aaron, phone, pta_707fbdf8793f775d)

- See It On You > Minimalist ("Minimalist it is. What would you like ...") > a golden retriever puppy, no words.
  - Her reply: "That puppy is adorable - tongue out, totally photogenic. I can turn this into some minimalist tattoo designs from your photo, want me to show you a few?"
  - The core took it as their body (`body_photo=true`, `job=from`).
- "Yes, show me" twice: each time "a bare yes is not a change - nothing drawn", and her "Here we go..." was removed, so she showed "Want me to imagine it?". It went round and round with no image model call.
- Cause: job3 was left out of "a picture on a new tattoo is one they like".

### Core v9.999.32 – Nov 14 (Aaron: "see it on you is literally just create a tattoo ... there's no such thing as see it on you until you've locked in a tattoo")

- job3 joins job0/job4 in the fresh picture rule and is no longer excluded from the later-turn rule. Placement sends (`placed`, `onme_project`) are never taken there.
- Her page note for job3 now says it is the Create road until the tattoo is locked in, and that a picture while designing is one they like.
- Other job3 lines checked: the style start already includes job3; the "their tattoo" choices already skip it.

### Live test of core v9.999.32 – Nov 14 12:39-12:41 (pta_b2047549fa23c06a, phone 390x844)

- See It On You > Minimalist > a golden retriever puppy (a Get Inspired picture put in as their photo), no words.
  - The core logged "a picture sent from the See It On You page (the Create road until it is locked in) - a picture they like" and "her read of their picture is her say-back".
  - Her line: "That little golden retriever puppy is a sweetheart - the sitting pose and soft face would make a lovely minimalist piece. Want me to imagine some ideas from this picture?"
- "Yes, show me" (`body_photo=false`): "their own words were a yes - Imagine it runs now".
  - Sent: the picture + "Redraw everything in the Minimalist style - take the subject from my picture, but not its colors or its look." + "a minimalist line drawing of a golden retriever puppy sitting with a soft, sweet face" + no lettering.
  - 8 Minimalist puppies came back (Sitting Puppy, Looking Up, Sweet Face, Resting Puppy, Back View, Playful Step, Profile, Sleeping Puppy). Heading: "See It On You · Your Designs". Nothing refused.

### Waiting card animation – preview (Nov 14, Aaron: go)

- Aaron's direction: Aura comes alive while the image is made. An energy field is the main show, with her butterfly moving through it in six stages: materialize, appear, expand, travel, dissolve, reform. It loops with no visible restart. The card, progress bar, tips, chat bubble and chat box stay as they are.
- The preview is one HTML page drawn on a canvas: no video, no new pictures, no outside service. It is published privately at https://claude.ai/artifact/DYpEedSbDMdQPDQ6FRYmNx.
  - Field: 220-560 glowing particles (scaled to the area) flow in a pattern that changes every 10s cycle, eased in so nothing jumps.
  - Her butterfly is drawn in code: blue monarch wings, violet glow, veins and white edge spots, flapping. It follows one continuous curve, faster while it travels.
  - It dissolves into its own shape's points and reforms where the curve goes next.
  - The animation pauses when it is off screen or the tab is hidden; reduced motion shows a still frame.
- Checked by rendering at 390 wide: 60 fps, no errors. Found and fixed an invisible butterfly in expand/travel: the ribbons left near-zero transparency set before the butterfly was drawn.
- Not in the page yet: it goes in as the next page version once Aaron approves the preview.

### Waiting card animation – eight stages (Nov 14 13:20-13:55)

- Aaron: my first code-drawn butterfly looked like "bad clip art". The GIFs he sent were 6-frame animations; I had only looked at the first frame of each.
- His pictures are now the art. Her: his blue monarch with violet fire. The faint butterfly she forms from: his field picture. Petals: from the field picture.
- The draw img_mwgwrth9ar4i ($0.053) was rejected by Aaron.
- His 8-stage storyboard: Awaken, Materialize, Emerge, Expand, Flow, Dissolve, Reform, Renew. Each stage is its own background, blended into the next. The same monarch moves on her own layer, and stars and petals on theirs. Aaron: "Aura is the monarch ... her aura ... that's where all the movement is".
- The eight backgrounds were drawn without a butterfly (1536x1024, about $0.0415 each):
  - 1 img_mwgxijbqkdck (thin; kept as an alternative)
  - 1b img_mwgxpn5hrmha
  - 2 img_mwgxqafqe987
  - 3 img_mwgxqzor1cnv
  - 4 img_mwgxrkcd32gc
  - 5 img_mwgxs7k7y1b9
  - 6 img_mwgxsrc9ajz4
  - 7 img_mwgxte7afmpj
  - 8 img_mwgxtxr7q7u2
- Preview page aura-alive.html (to go at mytattoo.world/aura-alive): the backgrounds load from the picture store; her pictures are inside the page. The Claude preview can't load pictures from the store.

### Waiting card animation – Aaron's frames, redrawn sharp (Nov 14 14:00-14:35)

- Aaron: the backgrounds I drew made no sense ("it's not a space silhouette ... it's her aura coming off of her and expanding"; "no ring of fire"). His storyboard frames ARE the animation. Built a player that holds each frame, slowly pushes in, and melts into the next; Renew melts into Awaken.
- His GIF (6 frames x 0.45s) shown as-is and smoothed in the Claude preview.
- References stored in the picture store via wrangler kv put: img_arefmonarch (his monarch), img_areff1-8 (the 8 storyboard frames). SHOW_IT with data-URI refs never reached core: the command was too big for RUN.
- Redrawn 1024x1024 with his monarch + each frame as references (raw, exact size):
  - 1 Awaken img_mwgz6rs9xo7f
  - 2 Materialize img_mwgz7ju62kh1
  - 3 Emerge img_mwgz3mtodbu2
  - 4 Expand img_mwgz8a3p981v
  - 5 Flow img_mwgz92620a4k
  - 6 Dissolve img_mwgz9t1s2llt
  - 7 Reform img_mwgzaitpwwwo
  - 8 Renew img_mwgzb9pglj11
- Cost: about $0.057 for each frame without the butterfly, $0.065 for each with her; about $0.50 in all. The monarch is identical across all of them.
- Player page aura-alive.html (for mytattoo.world/aura-alive) loads the eight at w=720.

### Waiting card animation – his GIF, then 12 sharp frames (Nov 14 14:35-15:10)

- The eight placed frames played as a slideshow, and two had no butterfly. Aaron: "it's supposed to be like an animated gift ... an aura pulsating off of the butterfly slightly moving". Rule from here: every frame has the butterfly.
- His GIF (6 frames) went up as-is with speed buttons and a soft blend. Aaron: "very close" but too fast. He picked Slowest (1.3s a frame).
- GIF frames stored as refs img_agifg1-6. Redrawn 1024x1024 with his monarch: 6 keyframes (about $0.069 each) + 6 in-betweens (about $0.078 each), about $0.88 in all.
- Play order: 1 K1 img_mwh0ytk9ma8q, 2 M1-2 img_mwh0zjpayai6, 3 K2 img_mwh10axqbjrr, 4 M2-3 img_mwh0mtcbw5bb, 5 K3 img_mwh114a8cr1f, 6 M3-4 img_mwh11y7jy4y7, 7 K4 img_mwh130gimj5k, 8 M4-5 img_mwh13sc9zeyn, 9 K5 img_mwh14kx1crtr, 10 M5-6 img_mwh15bhrr28q, 11 K6 img_mwh1652zypud, 12 M6-1 img_mwh16uwvwzd0.
- aura-alive.html now plays the 12 at w=720, 1.3s each, blend over the last third of each step; the faster speeds stay as buttons. Checked at phone size before handing over.
- Done in page v923 (below). Was: once Aaron approves: put it into the live waiting card (mt-shell.html .gca, replacing the WAIT_ART stills). Ask first.

### Page v923 – Aura alive in the real waiting card (Nov 14, Aaron: go)

- mt-shell.html: the waiting card's picture area is now a square (up to 340px, centred) that plays the 12 frames at 1.3s with the soft blend - the same as mytattoo.world/aura-alive.
- Removed: the six WAIT_ART stills (about 150KB of the page), the shine sweep and the twinkling sparks over them. The desktop-only 190px height rule is gone (the square sizes itself).
- One clock (ALIVE_T0, reset when a drawing starts), so a card rebuilt when its words change carries straight on. Frames load 3s after the page opens (auras.guide/image/<id>?w=720); her mark shows underneath until all 12 are in. The loop stops when no waiting card is on screen. Reduce-motion: frame 3 (the centred monarch), still.
- Unchanged: the card's words, their quote, the bar, the tips, the timing, when it shows/hides. Every drawing uses this card (design, on you, change, ideas). Core unchanged.
- Deploy note: the home page is KV `page:mytattoo.world/` (the direct key wins over any shell key - see core's PAGES note). `_shell_mt_shell` serves only mytattoo.world/shell and `_shell_mt_design` is not read while the direct key exists. The first two v923 puts went to those two (from the old put-shell4.ps1); the third, to `page:mytattoo.world/`, made v923 live (checked 60s after the put).
- Tested on /shell at phone size with a real drawing ("a hummingbird sipping from a hibiscus flower, fine line on my forearm", then "yes"): all 12 frames loaded, canvas 642x642 in a 321px square, card 536px tall on an 844px screen; it played through "Refining the details" -> "Almost there" -> "All done!" without restarting, then the designs arrived (THE SIP) and the loop stopped. Desktop 1440: card 236px wide, picture 202px square (it was 190px tall before).


### Core v9.999.33 + page v924 – her words match the screen, search stays in reach (Nov 14, Aaron: go)

From his phone walk 16:24-16:36 and the logs:
- MEASURED 16:28:20 (Get Inspired > scary clown > Work on this > Show me some ideas): the image model got "This is what I want to do with it: [they sent a photo, with no words]" - core's own note. Core: the note never goes into their words; with no words the middle sentence drops ("This is a picture I like. Show me 8 different tattoo designs from it...").
- MEASURED 16:28:11: "I'm imagining amazing designs for you now" right after she called it "a full-on horror clown". Core: the first designs of a new tattoo get a name in a few words (nameIdea: her last line + their words; dial config:source:name_idea:model, else the heard dial; time config:talk:name_idea_ms, default 3000) - "I'm imagining your horror clown tattoo now." (config:say:imagining_named). No answer in time: the fixed line stands.
- MEASURED 16:33:03 (Create, dragon, sword and axe): "Should I go ahead and imagine some designs for you, or is there any particular style you have in mind?" over a card reading Pick a style / Show me some ideas. Core: her say-back of a new idea (and her read of a picture with its card) ends on one fixed line naming the card - "Tap Show me some ideas, or pick a style first." (config:say:card_point), or with a style already picked "Tap Imagine it when you're ready." (config:say:card_point_style). Logged as [TURN:CARD-POINT].
- Page: the home line "Choose what you'd like to do - or just tell Aura below." is gone.
- Page: after a Get Inspired search the two choices dock in one row right above the chat box (#insDock), always in view; the lit one shows what was searched; tapping the other searches the same words there. The big pair and the pinned line at the top step aside while the dock is up.
- Page: the style card explains itself - "Optional - pick a style and every design comes in it."; Show me some ideas says "A mix of designs, each in a different style", or "All in <style>" once one is picked; last line "Or keep telling me about it below."
- Page: the trail carries the search - Get Inspired > "Scary clown" > This Picture > Your Designs > This Design. "Scary clown" brings the same results back (no new search; the tattoo stays in In Progress); This Picture goes to the top of the conversation; back from the picture goes to the results.
- Note: her asking before drawing on Create is right (2026-11-01 later rule: she says it back and waits for the go) - my earlier flag was wrong.

### Core v9.999.35 – my test of v9.999.34/v925 (Nov 14, 17:28-17:36)

Tested at phone size:
- Get Inspired > Show me real tattoos > "koi fish swimming up a waterfall" (98 found). The dock was up while it searched, and the page line stepped aside. I opened "koi swimming up waterfall" (a red and orange koi climbing a blue waterfall, from Pinterest) and tapped Work on this.
- Her read, 17:30:57 [TURN:CARD-POINT] card_point_offer: "That's a classic Japanese koi climbing through crashing waves - bold color, red and gold fish against all that turquoise water, done in a really solid traditional style. Great pick to build from. Tap Yes, show me, or I have my own idea." Her "Want me to imagine some designs made from this picture?" went. The card under it was Yes, show me / I have my own idea - a match.
- The name was found in the background at 17:30:59: "koi fish and waves". Then Yes, show me - her line while drawing: "I'm already picturing those vivid koi swimming through the rolling waves for you." 8 came back; card 1 TRADITIONAL JAPANESE (the koi in red and black climbing teal waves). Trail: "koi fish swimming up a waterfall" > This Picture > Your Designs.
- Create, typed "i want a lighthouse with a storm and a little boat for my dad, he was a fisherman": her own full reply came with her style card ("What feel should it have?" - the new Optional line, Show me some ideas / A mix of designs, each in a different style, Or keep telling me about it below). It ended "Tell me more if you want, or I can show you some ideas. Pick a style for it below - or tell me what you'd like to make from it." - not pointed: a third road. Japanese tapped (its own "Japanese it is." pop-up), Imagine it - her line: "I'm imagining your lighthouse storm boat tattoo now." Card 1 STEADFAST LIGHT.
- Home: the "Choose what you'd like to do" line is gone.
- From the 17:12 log (v9.999.33, wolf): sent to the image model: "This is a picture I like. This is what I want to do with it: a howling wolf head and chest against a big full moon, black and grey with stippling, a lone pine off to the side, and flowing ink swirls trailing down from the fur. Show me 8 different tattoo designs from it, each in a different tattoo style..." - no bracket note.

Fixed in core v9.999.35:
- Her style card under her own reply on a new tattoo with nothing drawn gets the same ending ("Tap Show me some ideas, or pick a style first."); an offer of hers that runs two sentences goes whole.
- The name reads the way a person says it ("lighthouse and little boat in a storm", not "lighthouse storm boat").

### Core v9.999.34 + page v925 – found in my own test of v9.999.33/v924 (Nov 14, 17:09-17:14)

Tested at phone size: Get Inspired > Search anything in the world > "wolf howling at the moon" > the dock (stays over the chat box while scrolling; switching to Show me real tattoos searched the same words there) > a black-and-grey wolf and moon picture > Work on this > Yes, show me > 8 designs (card 1 STIPPLING REALISM) > trail "wolf howling at the moon" > This Picture > Your Designs > tapping the search brought the same results back with the dock.
- Page: the trail lost the search as soon as Work on this started the conversation over (askAura rebuilds the first turn) - it read "Your Idea". The search now follows the new first turn (CRUMB_SRCH.first). Patched live in the browser and checked: "GET INSPIRED / This Picture".
- Page: the line "Tap Show me real tattoos or Search anything in the world, then tell Aura what to look for below." stayed under the results - it steps aside with the big pair once something is searched.
- Core: her picture read ended "I'd love to imagine some designs made from this picture for you - or tell me what you'd change about it." (no question) and the card under it was Yes, show me / I have my own idea - not the style card. The ending now names the card that will be there: style card -> "Tap Show me some ideas, or pick a style first."; her picture read with no styles -> "Tap Yes, show me, or I have my own idea." (config:say:card_point_offer); typed idea -> as before. Her last sentence goes when it is her offer, question or not.
- Core: Yes, show me goes down the GO road, where her line is written by drawStartSay told never to repeat the idea - it said "I'm picturing it now, letting the details come together in my mind." The tattoo's name is now found in the background right after her say-back (picture read or typed idea; kept as go_name with its idea, 30 minutes) and her line calls it by that name only ("...imagining your howling wolf designs now"). The choose-card road uses the same kept name first, so neither waits.

### Not fixed yet (seen, not in the go list)

- Swipe dots don't follow the swipe
- Tattoo page picture row opens scrolled
- Lettering sheet font flash
- Cover Up home card clipped
- Add-on cards 2 and 3 of the first sheet had no title (the card reader gave no answer)

### Next test (new ground, not a repeat)

- After the next fix: Cover Up on the micro butterfly wrist, Japanese from her advice, an idea she accepts, then finalize and artist files
- Add to Existing on the koi sleeve (big, dark) – watch for the memory error
