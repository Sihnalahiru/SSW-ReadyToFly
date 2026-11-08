# SSW-ReadyToFly — Frozen Master UI & Feature Specification

**Status:** FROZEN — 2026-11-08  
**Project:** Japan Specified Skilled Worker (SSW) Airport Ground Handling study platform  
**Repository:** Sihnalahiru/SSW-ReadyToFly

## 1. Frozen product decisions

| Area | Decision |
|---|---|
| Visual identity | Hybrid aviation command-center identity + premium mobile-first usability |
| Navigation | Hybrid navigation: desktop sidebar / compact drawer and mobile bottom navigation with secondary items in a More area |
| Study experience | Combined learning plus switchable separate study modes |
| Accounts | Four separate user accounts; each account has isolated profile and progress |
| Connectivity | Online-first. Do not promise full offline study; cache only app shell / safe static resources as designed |
| CBT | Fixed existing 14 practice papers plus randomized practice |

These decisions may only be changed with explicit project-owner approval.

## 2. Product boundaries and evidence rules

- Keep this project separate from Hijapan, HelloJP/IRODORI, Caregiver, Food Manufacturing, and all other projects.
- Keep Legacy / Rev 1 and Revised / Rev 2 Ground Handling syllabuses as distinct versions. Never merge their content.
- Keep Aircraft Maintenance Books 1–3 as a separate study track; do not assign them to Ground Handling without evidence.
- Preserve original source filenames, source references, and audit trails.
- Use source-supported content only. Never invent missing lessons, answers, readings, durations, audio, or media mappings. Mark unsupported items PENDING.
- Existing repository assets and D1 records must not be deleted or overwritten during UI implementation.
- Do not perform final D1 schema redesign or bulk content import until UI/features are specified and implemented.
- Existing 14 CBT practice papers are unofficial practice papers, not official examination papers. The existing manifest states 13 papers of 50 questions and a final paper of 4 (654 questions total). Official exam duration remains unverified; do not enable or invent a timed duration.

## 3. Main navigation

Primary destinations:
1. Dashboard
2. Study Center
3. Vocabulary
4. Quiz Center
5. CBT Examination
6. Progress & Analytics
7. Profile & Settings

Navigation behavior:
- Desktop: persistent sidebar with clear active state.
- Mobile: bottom navigation for the most-used destinations; remaining destinations in a compact More menu/drawer.
- Header: brand, connection state, notifications, theme, and account controls as appropriate.
- Avoid overcrowded menus and duplicate navigation.

## 4. Dashboard

- Personalized welcome and profile/avatar.
- Overall study overview and daily target.
- XP, level, and streak only when backed by real progress data.
- Continue Learning / recent activity.
- Ground Handling Legacy, Ground Handling Revised, and Aircraft Maintenance track cards kept distinct.
- Quick actions to Study, Vocabulary, Quiz, and CBT.
- Exam practice summary using the existing practice-paper inventory.
- Recent results and reminders only when actual data exists.
- Empty states must clearly say when data/features are pending; never show fabricated percentages or progress.

## 5. Study Center

- Separate tracks: Ground Handling Legacy, Ground Handling Revised, Aircraft Maintenance Books 1–3.
- Lesson/topic/subtopic navigation based on verified source structure.
- Combined learning mode and switchable separate modes:
  - Combined English + Sinhala explanation + Japanese technical terms.
  - English-focused exam mode.
  - Japanese technical-term recognition mode.
  - Quick revision mode.
- Source/page references and evidence status where available.
- Images/audio only when mappings are verified.
- Keep source revision boundaries visible.

## 6. Vocabulary Center

- Japanese term, reading/furigana, optional romaji, English meaning, Sinhala meaning, technical note, source/page evidence.
- Search, filters, category/set navigation, flashcards, favorites, known/learning/difficult states, spaced repetition, listening/pronunciation where supported.
- Never silently repair uncertain readings or duplicate terms; route them through audit.

## 7. Quiz Center

- Topic/section quizzes and vocabulary practice.
- Randomized practice from approved question records.
- One-question-at-a-time option, answer feedback, explanations, review, bookmarks, wrong-answer review, and attempt history.
- Japanese-only exam presentation rules must be respected where configured.
- No invented questions or answers.

## 8. CBT Examination

- Fixed access to the 14 existing practice papers.
- Random practice mode.
- Question navigation, answer selection, answered/unanswered state, mark-for-review, submit confirmation, result summary, and review of mistakes.
- Persist attempts per user when backend support is ready.
- Label the papers as unofficial practice papers.
- Timer remains disabled/configurable until official duration evidence is available.
- Validate paper/question references and counts before integrating the manifest.

## 9. Progress & Analytics

- Per-user isolated progress.
- Lesson completion, vocabulary mastery, quiz accuracy, CBT attempts/scores, weak areas, study activity, and trends.
- XP, streaks, goals, and achievements only when derived from real activity and transparent rules.
- No placeholder values presented as actual achievements.

## 10. Accounts, profile, and privacy

- Four separate accounts as the initial project requirement.
- Strict user-level data isolation for profile, progress, bookmarks, and exam attempts.
- Registration/login, email verification, password reset, sign-out, profile and avatar settings, and privacy controls.
- Never expose one account's progress to another.
- Security and account limits must be implemented server-side, not only hidden in UI.

## 11. Audio and language support

- Japanese voice playback, word/sentence listening, repeat and playback speed where supported.
- English/Sinhala support where verified resources or device capabilities exist.
- Speech recognition is capability-dependent and must show a clear unsupported state where unavailable.
- Do not claim audio exists until actual audio assets are verified.

## 12. Connectivity and PWA

- Online-first architecture.
- Installable PWA shell and safe static-asset caching.
- API/auth/progress operations remain online and must not be represented as offline-capable.
- Clear online/offline status and graceful network error states.
- No full offline study promise under the frozen decision.

## 13. Visual and interaction standards

- Premium aviation visual language: deep navy, runway/flight-line cues, restrained cyan/blue accents, glass panels, clear typography.
- Mobile-first responsive layout, portrait support, accessible touch targets, keyboard/focus states.
- Dark and light themes.
- Hybrid navigation with minimal primary destinations.
- Consistent cards, dialogs, empty states, loading states, errors, and confirmations.
- Avoid visual clutter and unnecessary menu layers.

## 14. Implementation sequence

1. Repository/runtime audit and resolve root vs deployed `public/` source-of-truth.
2. Shared application shell, hybrid navigation, responsive design tokens, theme and profile shell.
3. Dashboard.
4. Study Center.
5. Vocabulary Center.
6. Quiz Center.
7. CBT Examination.
8. Progress & Analytics.
9. Account/profile settings and four-account server-side policy.
10. Integration, accessibility, security, and browser/device testing.
11. Final D1 schema reconciliation based on implemented feature needs.
12. Verified source-data import and end-to-end testing.

## 15. Completion rules

A feature is complete only when its UI, interactions, data behavior, responsive states, and error/empty states are implemented and tested. A repository commit or a visible screen alone is not proof of runtime completion.
