# SouthQA — Performance & Logic Audit Playbook

A repeatable method for hyper-detailed performance/logic QA of animation-heavy websites
(GSAP, Lenis, Barba, Swiper, smooothy, Webflow, etc.). Written for an AI model (Opus,
Fable, or similar) to execute, but every step is also human-followable.

**Give the model this file plus the repo, and say:**
> "Run the SouthQA playbook on this codebase. Audit for performance and logic errors,
> numbered by impact, with a brief fix per finding. Do not change any code."

---

## Core principle

**Symptoms → suspects → evidence.** Never audit by generically scanning for "bad code."
First get the user's *observed symptoms* (where exactly does it stutter?), build a mental
model of the site's architecture, then hunt for mechanisms that would produce *those
specific symptoms*. Generic findings are the garnish; symptom-matched findings are the meal.

A finding only makes the report if you can articulate the **mechanism**: what work happens,
on which thread, triggered by what, at the moment the user perceives the problem.

---

## Phase 0 — Clarify before reading anything

Ask the user (2–4 targeted questions max):

1. **Where do the stutters/bugs appear?** (initial load / first scroll / during transitions /
   end of transitions / specific component / idle) — this is the single most valuable input.
2. **Which devices/browsers?** (Safari ≠ Chrome for filters/blur; touch devices often run a
   different code path entirely)
3. **Scope:** JS repo only, or also probe the live/staging site? (Always push for live-site
   probing — half the findings live in the served HTML/CSS/assets, not the JS.)

Map every answer to a "hotspot" and keep the list visible while auditing. Every hotspot
must end up with at least one explaining finding, or you're not done.

## Phase 1 — Understand the architecture (read, don't skim)

1. Read `CLAUDE.md` / README / any architecture docs **first**. They tell you the intended
   lifecycle rules — bugs are often violations of the project's *own* stated rules.
2. Read the **entire** entry file(s). Not grep-samples — every line. On a 2,500-line file
   this is cheap and it's where 80% of logic bugs surface. Take notes per module.
3. While reading, reconstruct the **lifecycle timeline**. For a Barba/SPA-style site:
   - What runs at first load (`once`)?
   - What runs before/during/after a navigation (beforeEnter → leave → enter → afterLeave →
     afterEnter)?
   - What is created per-navigation vs once? What tears each thing down?
   - Draw the exact order of operations at the *moments the user reported stutters*
     (e.g. "end of transition" = container swap + destroy + re-init + refresh, all in
     one or two frames).
4. `package.json`: note library versions — known bugs (e.g. smooothy 0.0.35's broken
   `destroy()`) are version-specific.

## Phase 2 — Hunt with the known-mechanism checklist

These are the mechanisms that cause 90% of jank on animated sites. For each, actively
search the code and the served CSS (grep terms in parentheses):

### Paint & compositing (the stutter classics)
- **Animated `filter: blur()`** (`blur(`) — cost ≈ radius² × area, per element per frame.
  Many split words each blurring = many filtered layers. Worst above the fold and in Safari.
- **`backdrop-filter`** (`backdrop-filter`) — re-blurs its backdrop every frame *anything*
  moves behind it. Persistent UI (nav, buttons) with backdrop blur taxes every animation.
- **`mix-blend-mode`** (`mix-blend-mode`) — forces expensive compositing of everything
  beneath; a full-viewport fixed blend layer taxes the entire site permanently.
- **Animated `clip-path` on large areas** (`clipPath`, `clip-path`) — repaints the clipped
  region every frame; viewport-sized = full-screen repaint per frame.
- **Transforms on huge elements** — scaling/translating an element the height of the whole
  document creates a giant composited layer (GPU memory + raster cost). Check transition
  code: is the "old page" frozen to viewport height before being animated?
- **Persistent `will-change`** (`will-change`) — layers held alive forever.

### Main-thread bursts (hitch at a specific moment)
- **Synchronous init/destroy piles**: everything that runs in one frame at transition end —
  SplitText.create (forced layout per element), Swiper constructors, dozens of
  ScrollTriggers, then `ScrollTrigger.refresh()` (full layout pass, expensive with pins).
  Count the `data-*` animation attributes in the served HTML to size the burst.
- **`ScrollTrigger.refresh()` timing** — does it land while other animations are mid-flight?
- **`gsap.ticker.lagSmoothing(0)`** — disables GSAP's hitch-masking; long frames render as
  visible jumps. Standard with Lenis, but check whether it amplifies the bursts above.
- **Layout thrash in loops** — reads (`getBoundingClientRect`, `offsetWidth`) interleaved
  with writes inside `forEach`/`onUpdate`.

### Lifecycle leaks (site degrades over time / after navigations)
- **Killed tweens don't kill their ScrollTriggers.** `tween.kill()` does NOT kill an
  attached `scrollTrigger`. Any registry that does `anims.forEach(a => a.kill())` leaks STs
  on every rebuild (resize, font-load re-split). Look for `scrollTrigger?.kill()` alongside —
  its absence in a kill-loop is a finding.
- **Re-split cascades**: `SplitText` with `autoSplit: true` re-splits when fonts load or on
  resize → kills + rebuilds all consumer tweens in one frame. Anything that makes fonts load
  *late* moves this hitch into the user's first interaction.
- **Every `init()` needs a `destroy()`** that is actually called; every `document`/`window`
  listener needs a teardown path (AbortController or stored ref). Simulate 3 navigations
  mentally: do instances/listeners/ScrollTrigger counts grow?
- **Library-specific teardown bugs**: check whether `destroy()` methods actually remove what
  the constructor added (read the lib source in `node_modules` if suspicious).
- **Infinite/ambient loops** (clock tickers, marquees, `repeat: -1` with `onUpdate`) running
  while off-screen, and per-frame attribute writes (`setAttribute` in `onUpdate`).

### Logic bugs (read line-by-line for these)
- **Falsy-check bugs**: `querySelectorAll(...) || fallback` is dead code (NodeList is never
  falsy). Same for `getAttribute() || default` when `"0"` is a valid value.
- **Init-order races**: synchronous event dispatch (e.g. SplitText's `onSplit`) requires
  listeners attached *before* the dispatcher runs — verify registry ordering.
- **Guards placed after the work they guard.**
- **Debug flags shipped** (`debug: true`, `markers: true`, verbose logging).
- **Both halves of every documented invariant** (if docs say "X must run before Y", verify).

## Phase 3 — Probe the live site (don't trust the repo alone)

The served page is the ground truth for asset weight, DOM size, and Webflow/CMS-added CSS.
All doable with `curl` + a few lines of Node:

```bash
# 1. Pull key pages (home + every template type + the page hosting each reported hotspot)
curl -s https://SITE/ -o home.html    # repeat for other pages

# 2. Stats per page (Node one-liner over the HTML):
#    - approx DOM nodes:        /<[a-z]/gi
#    - <img> count, loading=lazy vs eager, srcset/sizes presence
#    - <video>, autoplay
#    - every data-* animation attribute your JS targets (sizes the init burst per page,
#      and tells you WHICH page actually hosts each component — don't assume)
#    - <script>/<link> tags (what else loads: jQuery, webflow.js, analytics)

# 3. Pull the site CSS and grep it:
#    @font-face (formats! ttf/otf = unoptimized; woff2 = good), font-display,
#    rel=preload for fonts, backdrop-filter, mix-blend-mode, will-change, filter:blur
#    → then locate WHICH selectors carry the expensive properties and find those
#      elements in the HTML (a blend mode on a full-viewport fixed div ≠ on a button)

# 4. Weigh suspect assets:
curl -sI URL | grep -i content-length     # hero images, fonts, slider images, JS bundle

# 5. Check responsive-image sanity: sizes="100vw" (or huge caps like 4096px) on images
#    that render small = oversized downloads AND oversized decodes (decode hitches
#    land exactly when the element scrolls/slides into view).
```

Key cross-checks:
- **Fonts**: format (woff2?), preloaded?, `font-display` value. Late fonts + autoSplit =
  first-interaction re-split hitch (see Phase 2). This single check explains a huge share
  of "stutter on first scroll" reports on split-text sites.
- **Find the hotspot component's actual page** — grep the attribute across all fetched
  pages. Inspect its real markup: image `sizes`, element counts, fixed positioning.
- **CSS effects map**: for each `backdrop-filter`/`mix-blend-mode` hit, determine the
  element's size and persistence (full-viewport + fixed = critical; small button = low).

## Phase 4 — Cross-reference, verify, rank

1. **Map every finding to a hotspot** (or mark it "general"). A hotspot with no finding
   means keep digging.
2. **Verify each mechanism before reporting.** Re-read the exact lines; confirm the API
   behavior (does `revert()` kill scrub triggers? does the lib's `destroy()` actually work?).
   If the project docs contain warnings ("tween.kill() does NOT kill its ScrollTrigger"),
   check the codebase honors its own warning everywhere — authors usually fix it in one
   place and miss another.
3. **Rank by user impact**, not by how clever the finding is:
   - Critical = direct cause of a reported symptom
   - High = site-wide frame-budget drain
   - Medium = correctness bug or wasted work with visible-but-small effect
   - Low = hygiene, dead code, shipped debug flags
4. **Output format**: numbered list, most impactful first. Per finding: one-sentence
   mechanism ("what work, when, why it janks"), file:line references, and a one-line fix.
   Do not change code unless asked. End with a suggested starting order (cheapest
   high-impact fixes first).

---

## Quick-reference: symptom → likely mechanisms

| Symptom | Check first |
|---|---|
| Stutter on **first scroll** | Late font load → autoSplit re-split; blur-filter scroll anims firing simultaneously (`toggleActions`); lazy image decode; ScrollTrigger leak on re-split |
| Stutter at **end of page transition** | Synchronous destroy+re-init burst in the "after" hook; `ScrollTrigger.refresh()` mid-animation; `lagSmoothing(0)` turning the long frame into a jump; scroll-position snap |
| Stutter **during transition** | Animated clip-path on viewport-sized wrapper; transform on full-document-height element (old page not frozen); full-viewport blend/backdrop layers underneath |
| **Slider/carousel** stutter | Oversized image variants decoding mid-slide (`sizes` attr!); per-frame style writes; update loop running while hidden; wheel/scroll library conflicts |
| Site **degrades after navigating around** | Teardown gaps: window/document listeners, ST leaks, library destroy() bugs, matchMedia accumulation — simulate 3 round-trips |
| **Idle** jank / hot laptop | `repeat:-1` loops with onUpdate running off-screen; mousemove handlers driving hidden elements; per-frame setAttribute |
| Everything slightly heavy **everywhere** | Full-viewport `mix-blend-mode` / `backdrop-filter` layers; persistent will-change; giant composited layers |

## Report skeleton

```markdown
TL;DR: one paragraph mapping each reported hotspot to its primary cause.

## Critical — direct causes of reported symptoms
1. <Title> (hotspot: X)
   Mechanism, evidence (file:line / measured bytes / counts). **Fix:** one line.

## High — site-wide drains
## Medium — bugs & wasted work
## Low — hygiene
...
**Where I'd start:** cheapest high-impact combination.
```
