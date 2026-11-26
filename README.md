# BagaSchool

Prototype of a lesson-planning web app for French primary school teachers
(weekly timetable, yearly plans and progressions, lesson plans, assessments with
curriculum objectives). The app's interface is in French.

- Static PWA: plain HTML/CSS/JS, no build step, no dependencies.
- Data is stored locally in the browser (IndexedDB). No server, no account.
  Backup and device transfer use JSON export/import (Réglages page).
- Deployed with GitHub Pages from `main`: every push updates the app.

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Curriculum data
`js/competences.js` currently holds a small verbatim extract of the French cycle 3
programme (see the source URL in the file). It has not yet been checked against the
Bulletin officiel. See `PLAN.md` (French) for scope, limits and next steps.
