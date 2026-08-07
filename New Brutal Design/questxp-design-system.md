# QuestXP neo-brutalist design system

Implementation spec. Written to be handed to Claude Code as the single source of truth for the visual layer. Treat every rule here as binding unless a section says otherwise.

**Product context:** QuestXP is an AI-powered gamified learning platform at questxp.in. Users name a topic, the system generates a quest line, users clear quests and earn XP. 130+ active users. Audience is students, mostly on mobile.

**Design direction:** neo-brutalism. Hard borders, zero radius, offset shadows with no blur, saturated flat color, monospace for data. The register is arcade cabinet and trading card, not corporate SaaS with thick borders.

---

## 1. Non-negotiables

These four rules produce 80% of the look. If a component violates one of them, it is wrong.

1. `border: 3px solid var(--ink)` on every container, card, input, and button. 4px on section dividers and top-level panels.
2. `border-radius: 0` everywhere. No exceptions, including avatars, badges, and inputs.
3. `box-shadow: Npx Npx 0 var(--ink)`. Blur radius is always `0`. Spread is always absent. Offset is always positive x and positive y, equal to each other.
4. Flat saturated fills only. No gradients, no blur, no opacity-based tints, no glassmorphism, no soft shadows.

---

## 2. Tokens

### Color

Six colors. Each is bound to one meaning in the product. Do not use a color outside its meaning, and do not introduce a seventh.

| Token | Hex | Meaning | Used on |
| --- | --- | --- | --- |
| `--ink` | `#0A0A0A` | Structure | All borders, all shadows, body text |
| `--paper` | `#FFFDF5` | Canvas | Page background, default card fill |
| `--xp` | `#FFD93D` | XP and rewards | XP meter fill, primary CTA, XP badges, "today" |
| `--violet` | `#7B5CFF` | Level and progression | Level badge, drill quests, CTA band |
| `--streak` | `#FF6B35` | Streaks and urgency | Streak counter, active calendar days, boss quests |
| `--mint` | `#3DDC97` | Cleared and success | Completed quests, pass states, success toasts |
| `--slate` | `#EDEAE0` | Empty state | Unfilled meter segments, missed days, empty pips |

`--slate` is the only neutral. It exists so an empty slot reads as empty rather than as a color with meaning.

**Text on color:** always `--ink`, except on `--violet` where it is `#FFFFFF`. Never gray text. Never opacity on text.

### Type

| Role | Family | Weights | Used on |
| --- | --- | --- | --- |
| Display | `Archivo Black` | 400 only | h1, h2, h3, stat numbers, level badges, rank numbers |
| Body | `Archivo` | 400, 500, 600 | Paragraphs, list items, names |
| Mono | `JetBrains Mono` | 400, 700 | All data, labels, eyebrows, XP values, timers, nav links, buttons |

Do not substitute Space Grotesk. It is the default neo-brutalist choice and reads as templated.

The mono face carries a lot of weight here. Anything that is a number, a unit, a status, or a label goes in mono at 700 with `text-transform: uppercase` and `letter-spacing: 0.1em` to `0.16em`. Anything that is a sentence goes in body. Display is for headings and for numbers big enough to be a headline.

**Scale:**

```
h1        clamp(42px, 6.6vw, 76px)   display, line-height 1.02, tracking -0.02em
h2        clamp(30px, 4.2vw, 46px)   display
h3        20px to 21px               display
lead      19px                       body
body      17px                       body, line-height 1.6
small     15px to 16px               body
label     12px to 13px               mono 700, uppercase, tracking 0.1em+
```

Minimum font size is 11px anywhere in the product.

### Shadow

| Token | Value | Used on |
| --- | --- | --- |
| `--sh-sm` | `3px 3px 0 var(--ink)` | Small buttons, chips, nav logo |
| `--sh` | `6px 6px 0 var(--ink)` | Cards, panels, steps |
| `--sh-lg` | `10px 10px 0 var(--ink)` | Hero panel, stat bar, modals |

Shadow offset scales with element size. A chip never gets `--sh-lg`, a modal never gets `--sh-sm`.

### Spacing

Section padding `76px` desktop, `56px` mobile. Card padding `20px` to `24px`. Grid gap `24px` to `26px`. Internal gaps `6px`, `10px`, `12px`, `16px`. Content max-width `1120px` with `24px` gutters.

---

## 3. Interaction

Every clickable element gets the same physical press. This is the single most important interaction rule in the system, and it must be consistent across every button, card, and link-as-button in the product.

```css
.pressable {
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}
.pressable:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}
.pressable:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 var(--ink);
}
```

Hover lifts toward the light source by 1px and grows the shadow. Active drops the element the full shadow distance and kills the shadow, so the element appears pressed flat against the page. Scale the translate values with the shadow size: a `--sh` element presses `6px`, a `--sh-lg` element presses `10px`.

No fade transitions, no scale transforms, no easing curves longer than 0.12s. The system should feel mechanical.

**Focus:** `outline: 4px solid var(--violet); outline-offset: 3px`. Never remove it, never replace it with a border change. Violet is used for focus because it is the only token not already carrying a hover or fill state.

---

## 4. Component recipes

### Button

```
base      mono 700, 14px, border 3px ink, radius 0, padding 11px 18px, shadow sm, pressable
primary   background xp
secondary background paper
emphasis  background violet, color white
large     16px, padding 15px 26px, shadow default, presses 6px
```

One primary button per view. Everything else is secondary.

### Card

```
border 4px ink, radius 0, shadow default, background paper, pressable if clickable
```

Cards with a status get a colored header strip: `border-bottom: 3px solid ink`, `padding 12px 16px`, mono 700 uppercase 12px, background set by the status color. The card body stays `--paper`. Never fill an entire card with a saturated color, it destroys readability and flattens the hierarchy.

### Quest card

The core object of the product. Three-part structure, top to bottom.

```
header   quest type (left) + XP value (right), colored by type:
         concept = xp, drill = violet, boss = streak
body     h3 title, one-line description
footer   estimated time (left) + difficulty pips (right)
```

Difficulty pips: four `12px` squares, `2px solid ink`, filled `--ink` when on and `--slate` when off. Wrap in `role="img"` with an `aria-label` stating the difficulty, since the visual encoding is not readable by assistive tech.

### XP meter (signature element)

Twelve discrete segments in a bordered track. Not a continuous bar. This is the element the design is remembered by, so do not simplify it into a percentage fill.

```
track    display flex, gap 4px, border 3px ink, padding 5px, background white
segment  flex 1, height 30px, border 2px solid ink, background slate
filled   background xp
```

**Animation:** segments fill left to right, one every `90ms`, triggered by IntersectionObserver at `threshold: 0.4`, disconnecting after the first fire so it plays once per page load. Under `prefers-reduced-motion: reduce`, set all filled segments immediately with no interval.

Wrap in `role="img"` with an `aria-label` giving the real numbers, for example "Experience meter, 8 of 12 segments filled, 2,480 of 3,000 XP toward level 8".

### Streak calendar

28-day grid, `repeat(7, 1fr)`, `6px` gap, cells `aspect-ratio: 1` with `2px solid ink`. Quested days `--streak`, today `--xp`, missed `--slate`. Always ship a visible key below it, because color alone is not an accessible encoding.

### Leaderboard row

Rank square `30px` with `2px solid ink`, display font. Top three ranks get `--xp`, `--mint`, `--violet` in order. Rows separated by `2px solid ink`, last row has no border. The current user's row gets a full-bleed `--xp` background using negative horizontal margin equal to the panel padding.

### Input

```
border 3px ink, radius 0, background white, padding 11px 14px, body 16px
focus: outline 4px violet, offset 3px
```

16px minimum on mobile inputs, or iOS zooms the viewport on focus.

### Empty and error states

Empty states get a bordered box with `--slate` fill, mono 700 uppercase label, and one primary button. Errors get `--streak` as a header strip on a `--paper` box, never a red-filled panel. State what happened and what to do, in one sentence, no apology, no "Error:" prefix.

---

## 5. Tailwind config

If QuestXP is on Tailwind, extend rather than fight it.

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        paper: '#FFFDF5',
        xp: '#FFD93D',
        violet: '#7B5CFF',
        streak: '#FF6B35',
        mint: '#3DDC97',
        slate: '#EDEAE0',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        body: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderWidth: { 3: '3px' },
      boxShadow: {
        'nb-sm': '3px 3px 0 #0A0A0A',
        nb: '6px 6px 0 #0A0A0A',
        'nb-lg': '10px 10px 0 #0A0A0A',
        'nb-hover': '5px 5px 0 #0A0A0A',
        none: 'none',
      },
      borderRadius: { DEFAULT: '0', none: '0' },
    },
  },
}
```

Then the pressable pattern as a component class:

```css
@layer components {
  .nb-press {
    @apply transition-[transform,box-shadow] duration-[80ms] ease-out;
  }
  .nb-press:hover { @apply -translate-x-px -translate-y-px shadow-nb-hover; }
  .nb-press:active { @apply translate-x-[3px] translate-y-[3px] shadow-none; }
}
```

Override the radius scale to `0` globally so no stray `rounded-lg` from an old component or a UI library survives the migration.

---

## 6. Migration order

Work in this sequence. Each step should leave the app in a shippable state.

1. **Tokens.** Add CSS variables and the Tailwind extension. Load the three Google fonts with `display=swap` and `preconnect`. Ship nothing visual yet.
2. **Global reset.** Set `border-radius: 0` globally, kill all existing `box-shadow` values that contain a blur radius, replace the body font. The app will look broken and half-migrated. That is expected and it is why this step is early.
3. **Primitives.** Button, Input, Card, Badge, Panel. Everything downstream inherits from these, so getting them right removes most of the remaining work.
4. **Quest card and XP meter.** The two components that carry the identity. Build the meter with the segment animation and the reduced-motion path.
5. **Dashboard.** Streak calendar, leaderboard, stat bar.
6. **Landing page.** Hero, steps, quest board, CTA.
7. **Long tail.** Modals, toasts, empty states, settings, auth screens. Audit for surviving rounded corners and blurred shadows.

---

## 7. Anti-patterns

Reject these on sight during review.

- Any `box-shadow` with a nonzero blur radius.
- Any `border-radius` above `0`.
- Gray text. Use `--ink` or the color's own darkest reading, never a mid gray.
- `opacity` on text to indicate de-emphasis. Change the element, not the alpha.
- A saturated color filling an entire card body.
- More than one primary button in a view.
- Space Grotesk, Inter, or any of the default AI-generated font pairings.
- Colors used decoratively rather than by their assigned meaning.
- Difficulty pips, calendar cells, or meter segments shipped without an accessible label.
- Emoji as icons in production. The one fire emoji on the streak chip is acceptable as a deliberate arcade reference; anything beyond that becomes noise.
- Animation longer than `120ms` on an interaction, or any animation that ignores `prefers-reduced-motion`.

---

## 8. Quality floor

Every screen must pass all of these before merge.

- Responsive to `320px` with no horizontal scroll. Multi-column grids collapse to single column at `900px`.
- Keyboard reachable, with the violet focus ring visible on every interactive element.
- `prefers-reduced-motion: reduce` kills all animation and transition, and sets `scroll-behavior: auto`.
- Every color-coded status has a text or shape backup.
- Text contrast at 4.5:1 minimum. Ink on all six colors passes. White on violet passes. Ink on violet does not, so do not use it.
- Inputs at 16px minimum on mobile.
- Touch targets 44px minimum on mobile, which means the `11px` button padding grows to `14px` below the `900px` breakpoint.

---

## 9. Reference implementation

A complete working landing page built to this spec exists as `questxp-brutalist.html`. Read it for the exact CSS on the XP meter animation, the press interaction, the quest card structure, and the responsive collapse. Where this document and that file disagree, this document wins.

## 10. Open decisions

Flagging these rather than deciding them, since they need product input.

- **Dark mode.** Not specified. Neo-brutalism inverts badly, because `--ink` borders and shadows disappear against a dark canvas. If dark mode is required, the borders become `--paper` and the shadows become a saturated color rather than black, which is a meaningfully different system and needs its own token set.
- **Second theme.** Consider a quieter alternate theme behind a toggle if QuestXP will be shown to institutional users or reviewers who read trend-forward styling as a negative signal.
- **Placeholder content.** The reference file contains invented figures for average quest length, median streak, and leaderboard names. The 130+ user count is real. Replace or verify everything else before production.
