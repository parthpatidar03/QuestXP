# UI 001 - Professional Product Redesign

## Goal

Remove the generic neon blue-purple AI look and move QuestXP toward a professional learning-product interface.

## Design Direction

The previous UI leaned on esports styling:

- dark navy backgrounds
- electric blue accents
- purple/blue gradients
- glow effects
- condensed display typography
- quest/mission language everywhere

That made the product feel less trustworthy for a serious learning workflow.

The new direction is restrained product UI:

- warm neutral background
- white and off-white surfaces
- dark readable text
- green primary actions
- amber XP accents
- system-style typography
- quieter gamification language

## Files Added

```text
PRODUCT.md
DESIGN.md
Docs/UI-001-PROFESSIONAL-REDESIGN.md
```

## Files Updated

```text
README.md
Docs/README.md
Docs/FILE-STRUCTURE.md
frontend/tailwind.config.js
frontend/src/index.css
frontend/src/App.jsx
frontend/src/components/NavBar.jsx
frontend/src/components/Course/CourseCreationForm.jsx
frontend/src/components/Dashboard/XPLeaderboardSidebar.jsx
frontend/src/pages/Auth.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/pages/LandingPage.jsx
frontend/src/pages/Profile.jsx
```

## What Changed

### Product and design context

`PRODUCT.md` and `DESIGN.md` now define the intended product feel.

Why:

Design agents and future implementation passes need a stable source of truth. Without this, each page can drift back into generic styling.

Effect:

Future UI work should follow the professional learning-workspace direction instead of neon game-dashboard styling.

### Global visual tokens

Updated `frontend/src/index.css` and `frontend/tailwind.config.js`.

Changed:

- background from dark navy to warm neutral
- cards from dark glass panels to light bordered surfaces
- primary accent from electric blue to green
- XP accent remains amber
- typography changed from `Space Grotesk` and `Barlow Condensed` to `Inter`
- removed glow-first component styling

Effect:

The whole app inherits a calmer professional baseline.

### Auth screen

Updated `frontend/src/pages/Auth.jsx`.

Changed:

- lighter auth layout
- clearer product copy
- quiet form styling
- Google button switched to outline theme

Effect:

Login/signup now feels more like a real product entry point and less like a generated SaaS/gaming screen.

### Dashboard

Updated `frontend/src/pages/Dashboard.jsx`.

Changed:

- stat cards are cleaner and more readable
- "quests" language reduced on the main surface
- empty state now says "No courses yet"
- primary action uses green
- removed glow-heavy hero treatment from the active-course area

Effect:

The dashboard now prioritizes course state and progress over decorative gamification.

### Navigation

Updated `frontend/src/components/NavBar.jsx`.

Changed:

- simplified logo
- removed neon shield/glow treatment
- light top bar
- quieter XP and notification styling

Effect:

The app shell now feels more like a trusted learning workspace.

### Landing page

Updated `frontend/src/pages/LandingPage.jsx`.

Changed:

- removed gradient text
- removed ambient glow background
- replaced hype copy with direct product value
- made the hero illustration quieter

Effect:

The public page is less "AI generated" and more direct.

## Verification

Frontend build:

```bash
cd frontend
npm run build
```

Result:

```text
Build passed.
```

Known warning:

Vite still reports large JS chunks. This is not caused by the redesign and should be handled later with code splitting.

Local visual check:

```text
http://localhost:5173/login
http://localhost:5173/dashboard
```

Result:

The redesigned auth screen and dashboard render with the new light professional palette.

## Remaining UI Work

Some deeper screens still contain old dark/neon styling:

- course detail page
- lecture player
- quiz tab
- notes tab
- doubt chatbot
- roadmap page

Those should be restyled in a follow-up pass after the main shell is stable.
