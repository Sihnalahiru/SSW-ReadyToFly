# ReadyToFly UI Implementation Log

## 2026-11-08 — Master decisions frozen and UI foundation started

### Frozen decisions
- Hybrid aviation command-center + premium mobile-first UI.
- Hybrid navigation.
- Combined learning + switchable separate study modes.
- Four separate user accounts.
- Online-first connectivity.
- Fixed 14 existing practice papers + randomized practice.
- Japanese-only official-style exam mode; English-only international practice mode.
- Preserve the exact selected Lottie assets and their intended placements.

See [MASTER_FEATURE_SPEC.md](./MASTER_FEATURE_SPEC.md) for the authoritative specification.

### Implemented in this step
- Added the frozen master feature specification.
- Replaced the initial placeholder dashboard with an aviation-themed dashboard layout.
- Added separate cards for Ground Handling Legacy, Ground Handling Revised, and Aircraft Maintenance.
- Added Vocabulary Center and Quiz Center navigation destinations with explicit pending-data states.
- Added desktop sidebar entries and a mobile bottom navigation bar.
- Added responsive dashboard styling.
- Added CBT mode-selection UI: Japanese-only official-style mode and English-only international practice mode.
- Added the current official SSW Ground Handling No. 1 structure and independent pass thresholds: written 30 questions / 45 minutes / 20 correct; practical 15 questions / 30 minutes / 10 correct.
- Added the three original Lottie files under the deployed `public/assets/animations/` directory without renaming:
  - `Airplane arrival at airport.lottie` — welcome/login screen.
  - `Passports in pink and blue.lottie` — section transition loader.
  - `Trophy.lottie` — reserved for real earned achievements.
- Added the Lottie player component and loader markup, styling, and transition behavior.
- Updated the service-worker cache version and included the Lottie assets.
- Kept root source files and deployed `public/` copies synchronized.

### Official exam source
MLIT / Japan Aeronautical Engineers' Association, `航空分野（空港グランドハンドリング）特定技能評価試験実施要領`, dated 7 April 2026, effective 1 August 2026. Official guideline states Japanese test language, 30 written questions / 45 minutes and 15 practical questions / 30 minutes for No. 1; each section independently requires at least 65% (20/30 and 10/15).

### Not yet completed
- Full browser/device runtime testing of the Lottie player and animations.
- Actual CBT question-engine wiring and proof that every question/answer follows the selected language mode.
- Full study, vocabulary, quiz, progress, and profile functionality.
- Four-account server-side limit and isolation verification.
- Backend/API and final D1 schema reconciliation.
- Source-data validation and import.
- Production deployment verification after these commits.

### Safety notes
- No study questions, answers, vocabulary meanings, or media mappings were invented.
- The 14 existing practice papers remain classified as unofficial practice papers and are separate from the official No. 1 exam format.
- Existing source files and D1 records were not deleted or changed in this UI step.
- GitHub asset presence and deployed-path availability have been checked; actual browser rendering and live Cloudflare deployment still require runtime verification.
