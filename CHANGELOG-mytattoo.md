# mytattoo – change and test record

One line per change. Newest at the top. Each test run says what it covered, so the next run tests something new.

## Nov 13 (page v913–v915, core v9.999.12–v9.999.17)

### Changes

| Version | What changed | Found in |
|---|---|---|
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

### Not fixed yet (seen, not in the go list)

- Cover Up bar says "Possibilities" after a change
- The 8 cover-ups are one design in 8 colours
- Swipe dots don't follow the swipe
- Tattoo page picture row opens scrolled
- Lettering sheet font flash
- Cover Up home card clipped
- Add-on cards 2 and 3 of the first sheet had no title (the card reader gave no answer)

### Next test (new ground, not a repeat)

- After the next fix: Cover Up on the micro butterfly wrist, Japanese from her advice, an idea she accepts, then finalize and artist files
- Add to Existing on the koi sleeve (big, dark) – watch for the memory error
