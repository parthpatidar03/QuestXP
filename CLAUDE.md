# Project conventions

## Announce new user-facing features

Whenever you add a new user-facing feature (not a bug fix, not an internal
refactor), add an entry to the `newFeatures` array in
`frontend/src/pages/Dashboard.jsx`. This is the app's built-in "What's new"
mechanism:

- It renders as a card in the dashboard's "What's new" tab.
- The first time a user visits after the entry is added, it also pops a
  toast (only the first 3 unseen entries per session, tracked per-id in
  `localStorage` as `seen_feature_<id>`).

Each entry needs a unique `id` (versioned, e.g. `my-feature-v1`), a short
`title` and `description`, an icon, and a `toast` with a short celebratory
message. Add new entries at the top of the array so the most recent feature
reads first.
