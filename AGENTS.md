# Multiplication Learning Tool

Build a small, friendly multiplication learning tool for a 10-year-old using plain HTML, CSS, and JavaScript.
Help the child learn the 1–9 times tables through ordered series and shuffled flashcards.
Keep the implementation small and save success-rate statistics in the browser's localStorage.

## Fresh Start

- Implement this plan from scratch using only current working files.
- Do not inspect previous commits, historical diffs, other branches, tags, reflogs, or deleted file contents.
- Do not restore or reuse a previous implementation.
- Preserve existing Git history and unrelated user changes.
- Git status, staging, reviewing current changes, and creating new commits are allowed.
- This plan replaces the email-app requirements. The learning tool must not access Gmail, Google OAuth, or existing credentials and tokens.
- Preserve unrelated credential files without reading their contents, and keep them ignored and outside the served directory.

## Stack and Structure

- Use plain HTML, CSS, and JavaScript for all application behavior.
- No frontend framework, build pipeline, backend API, database, accounts, or external services.
- Put the static application in `public/`, with a small `index.html`, stylesheet, and JavaScript files.
- Use system fonts and local assets; the app must not depend on remote scripts or resources.
- A simple local static server is sufficient. Serve only `public/`, never the project root, which may contain private files.
- Provide a short `README.md` with local run instructions and repeatable test instructions.
- Keep any development or test tooling separate from the browser application.

## Features

Implement these features in order:

1. A start screen with three practice choices, followed by a separate table choice only when needed; the final choice starts practice immediately.
2. Series practice for a selected table, in order from ×1 to ×9.
3. Flashcard practice in mixed order for one table or all tables.
4. Clear answer feedback, progress, and a round summary.
5. Persistent success-rate statistics using localStorage.
6. Installable PWA support for iPhone and iPad, including offline practice.

## Practice Choices

Show exactly these three primary choices on the start screen:

- Apply the focused-decision pattern below: show the practice modes first, without a table selector or a separate **Start practice** button on that screen.
- Choosing **Series 1–9** or **Mixed 1–9** opens a table-choice screen containing tables 1–9. Tapping a table immediately starts that round.
- Choosing **Mixed all** immediately starts the round, since no table choice is needed.
- Apply the direct-progression pattern below: the final practice choice starts the round, with no additional **Continue**, **Start practice**, or confirmation tap.
- Provide a way back from the table-choice screen to the practice modes. Keep the chosen mode clear on the table screen and the mode and table clear during practice.
- Avoid extra setup screens, repeated selection summaries, and decorative footer slogans. Keep installation help on the start screen only, collapsed by default. Keep statistics available as a secondary destination without adding steps to starting practice.

### Series 1–9

- Let the child choose a times table from 1 to 9.
- Practice that table in sequence: for table 4, show 4 × 1, 4 × 2, and so on through 4 × 9.
- Show one question at a time and the position in the series, such as “Question 3 of 9”.
- Include each multiplier exactly once in a nine-question round.

### Mixed 1–9

- Let the child choose a times table from 1 to 9.
- Present its nine questions as flashcards in shuffled order.
- For example, table 4 might start with 4 × 7, then 4 × 2, then 4 × 9.
- Include each multiplier exactly once per round, with no repeated or missing questions.
- Shuffle again when the child starts another round.

### Mixed all

- Use flashcards drawn from all 81 combinations of the 1–9 times tables.
- Both factors must be between 1 and 9 inclusive; do not include 0, 10, or higher tables.
- Shuffle a deck containing every ordered pair exactly once. Treat 3 × 4 and 4 × 3 as separate practice questions.
- Show progress through the deck and allow the child to stop at any time; completing all 81 questions is not required to save progress statistics.
- This choice does not require a table selection.

## Questions and Answers

- Display multiplication using the × symbol, with large, readable numbers.
- Provide a labeled numeric answer field using `type="number"`, `inputmode="numeric"`, `min="0"`, and `step="1"` to request numeric entry on iPhone and iPad. Retain explicit whole-number validation; input attributes alone must not determine whether an answer is valid.
- Apply the state-based action pattern below: **Check answer** is the primary action before a valid submission; **Next** replaces it after checking.
- Hide unavailable actions rather than showing disabled buttons. Keep **Check answer** available for empty or invalid input so activation can explain what to enter.
- Support typing an answer and pressing Enter to check it. Verify the numeric keyboard on physical iOS devices when available, and report emulation separately.
- Accept only a whole-number answer. Empty, whitespace-only, negative, decimal, or nonnumeric input must show simple guidance without affecting the score.
- Compare the answer with the product of the two factors.
- After checking, give clear feedback: encouraging confirmation for a correct answer, or a kind correction showing the full equation for an incorrect answer.
- Keep feedback visible until the child chooses Next; do not automatically advance on a timer.
- Lock the checked question so repeated clicks, Enter presses, or answer changes cannot score it again.
- When replacing **Check answer** with **Next**, prevent a double tap, repeated click, or held Enter key from activating the replacement action as part of the same gesture. Feedback must remain visible until a separate, intentional Next action.
- Each checked question counts as exactly one attempt. Only a correct first submitted answer counts as a success.
- Flashcards show the question first and reveal the answer only after submission. Use the same objective answer checking as series practice, not self-reported “I knew it” scoring.
- Do not reveal solutions to upcoming questions.
- Include **Back to choices** so the child can stop a round or change modes. Preserve scored answers, but do not count unanswered questions as incorrect.

## Progress and Feedback

- Show current-round correct answers, answered questions, and success rate only on the round-results screen. During practice, show the question position and answer feedback without a running score panel. Keep lifetime results in the dedicated statistics view.
- Define success rate as `correct answers / answered questions × 100`, rounded consistently for display.
- Before any answers, display “No answers yet” rather than a misleading 0% or an invalid number.
- Show a summary when the round finishes, with the correct count, answered count, success rate, **Practice again**, and **Back to choices**.
- Practice again keeps the selected mode and table, starts fresh round counters, and reshuffles mixed modes.
- Use warm, age-appropriate language. Incorrect answers are opportunities to learn, not failures to shame.
- Do not add countdowns, speed penalties, rankings, or competitive pressure.

## Statistics and localStorage

- Persist aggregate statistics after every checked answer so page refreshes do not lose scored progress.
- Track total answered questions, total correct answers, and success rate across all practice.
- Also provide the same statistics for each table from 1 to 9 and for each of the three practice choices.
- In Mixed all, assign each question to the table represented by its first factor; for example, 4 × 7 contributes to table 4.
- Calculate aggregate success rates from the underlying counts, not by averaging rounded percentages.
- Keep current-round counters separate from lifetime statistics. Starting a new round must not reset lifetime results.
- Use a named, versioned localStorage key and validate stored data before using it. Reject invalid counts, negative values, or correct counts greater than answered counts.
- Handle missing, malformed, or unsupported saved data gracefully: keep the app usable, explain that saved statistics could not be loaded when appropriate, and start with valid defaults.
- If localStorage is unavailable or saving fails, let practice continue in memory and show a small, clear notice that progress will not be saved.
- Provide a statistics view and a **Reset statistics** action with confirmation. Canceling must preserve all results.
- Reset only this app's saved data; never call `localStorage.clear()` or remove unrelated keys. Confirm success only if the saved reset succeeds.
- Persist statistics only, not personal information, individual answer histories, or unfinished rounds. A refresh may return to the start screen while preserving lifetime statistics.
- Explain that statistics belong to this browser and device, are not synced, and may be lost if browser data is cleared.

## Layout and Accessibility

- Use a child-friendly but serious design: calm, warm, and respectful of a 10-year-old. It should feel like a useful learning tool, not a toy or a babyish game.
- Use a restrained color palette, clear visual hierarchy, and purposeful whitespace. Keep the app spacious within a compact layout. Avoid cartoon mascots, decorative clutter, novelty fonts, and distracting game-like effects.
- Keep the layout simple: practice choices, the active question or flashcard, and statistics or a round summary.
- **Concentrated orientation:** group navigation, the current section title, and essential context in one compact header area. Combine closely related information instead of scattering it across separate rows or repeating it in the page body. Keep the main task close to this header.
- **Spacious but compact:** create breathing room through readable line spacing, control padding, and consistent gaps within meaningful groups. Avoid oversized header bands, empty spacer sections, and cumulative margins that push useful content down the page. Preserve generous touch targets and text sizes; gain compactness by improving grouping and removing unnecessary space.
- **Contextual action placement:** reserve the shared header for app identity, navigation, and context needed to understand the current screen. Put occasional secondary actions near the content or entry point they serve, and show them only on relevant screens. An action being available somewhere in the app does not justify showing it in every header.
- **Restrained separators:** use spacing, alignment, and typography as the primary ways to distinguish groups. Add a line, border, or container only when it clarifies a boundary that would otherwise be ambiguous. Avoid automatic dividers beneath headers and above footers, duplicate boundaries around the same group, and decorative lines across empty space.
- **Responsive grouping:** preserve the relationship and reading order of header elements as space changes. Allow compact wrapping or stacking on narrow screens; do not force everything onto one row, shrink readable text, reduce touch areas, or truncate essential context to achieve a compact layout.
- Apply these rules to practice by grouping **Back to choices**, the practice mode, and the selected table in the header area, rather than giving each a separate section above the question. Place **Statistics** as a secondary action on the start and round-results screens, outside the shared header; omit it during table selection and active practice. Keep the dedicated statistics view reachable from those entry points.
- **Content by task:** give each screen a clear purpose and include only information that helps the user complete that task or choose their next action. Move secondary information to the screen where it is useful instead of repeating it throughout the app.
- **Results at the right time:** show performance totals, percentages, and other evaluative summaries on result or review screens, not during the activity. During an activity, retain only progress needed for orientation and immediate feedback needed to continue. Continue collecting results without displaying a running dashboard.
- **Contextual, optional help:** place setup, installation, and other occasional help at the relevant entry point, not on every screen. Keep it collapsed by default behind a clear label and reveal details only when requested. Help must not interrupt the main task or add required steps.
- **Meaningful status:** show a status message only when it changes what the user needs to know or do, explains a meaningful delay, or reports a problem affecting the task. Omit routine success or readiness messages when normal operation needs no explanation. Keep actionable errors and notices about unsaved progress visible where relevant.
- **Purposeful copy:** every label or sentence must identify an action, explain a choice, give useful feedback, or communicate a relevant consequence. Remove slogans, filler encouragement, repeated instructions, and implementation details that do not help the user. Keep necessary wording short, concrete, and respectful.
- **Focused decisions:** present one meaningful decision at a time, with the relevant options and enough context to choose. Reveal dependent choices only after their prerequisites are resolved. Do not expose several dependent decisions together or split a simple decision into unnecessary screens. Multiple options for the same decision belong together.
- **Direct progression:** when selecting an option fully expresses the user’s intent, apply it and move directly to the next meaningful state. Let the final required choice begin the activity; avoid an extra Start, Continue, Apply, or confirmation action that merely repeats the same intent. Retain an explicit submission or confirmation when it serves a distinct purpose, such as submitting an answer, reviewing several edits, or confirming a destructive action.
- **Action availability:** show an action only when it can perform a useful operation in the current state. Hide unavailable or irrelevant actions instead of displaying disabled buttons. When a user needs guidance about a prerequisite, explain it near the relevant control; keep submission available when activating it can provide useful input validation. Prevent duplicate operations through state guards, not visible disabled controls.
- **State-based actions:** when actions represent mutually exclusive states of the same task, show only the action that applies to the current state. Replace it in the same position when the state changes; do not display future or previous actions alongside it, or show them as disabled alternatives. Apply this pattern throughout the app, not just to question controls.
- Keep a separate action when it serves a distinct purpose, such as letting the learner read feedback before moving on.
- Keep independent secondary actions, such as navigation or canceling, available when useful. This pattern does not limit a screen to one button when the buttons offer distinct choices or independent actions.
- When an action is replaced, update its accessible name and behavior together, preserve sensible focus, and prevent the gesture that triggered the change from also activating the replacement.
- Keep routine practice free of confirmation dialogs. Retain confirmation for the destructive **Reset statistics** action.
- Make the three practice choices easy to understand and the selected table obvious.
- Make text easy to read with system fonts, body text of at least 18 CSS pixels, comfortable line spacing, and large, prominent equations. Keep instructions short and plain, and support browser text resizing.
- Give every interactive control a touch area of at least 48 × 48 CSS pixels, with generous padding and enough space between controls to prevent accidental taps. Make primary actions especially easy to reach and tap on iPhone and iPad.
- Use sufficient contrast, labeled controls, and visible keyboard focus.
- Make all actions keyboard accessible. Move focus sensibly to the answer field for each new question.
- Announce answer feedback and validation messages to assistive technology.
- Never rely on color alone to indicate whether an answer is correct.
- Use a responsive layout that works on desktop, iPhone, and iPad, including portrait and landscape orientations, without horizontal scrolling or clipped controls.
- Keep questions, feedback, and controls usable with the iOS on-screen keyboard open, and account for device safe areas in the installed app.
- Keep animations minimal and respect reduced-motion preferences. Flashcard practice must remain usable without animation.

## iPhone, iPad, and PWA Support

- Make the app installable on iPhone and iPad as a Progressive Web App (PWA) through Safari's **Add to Home Screen** flow.
- Include a web app manifest, local app icons (including an Apple touch icon), and standalone display settings so the saved app opens from the Home Screen with its own name and icon.
- Keep the manifest, icons, and service worker inside `public/`. Cache only this app's public assets; never cache or serve private project files.
- After an initial successful online load and cache setup, allow the installed app to launch and support all three practice choices and local statistics offline.
- Keep the app usable in Safari without installation. Provide short installation instructions for iPhone and iPad in README.md and in a collapsed-by-default disclosure on the app's start screen only. Hide this help during table selection, practice, results, and statistics, and when already running as an installed app.
- Apply the meaningful-status rule to offline support: do not display routine readiness copy such as “Ready for offline practice.” Explain limitations or failures only when they affect the user's ability to practise or save progress; put optional offline setup details inside installation help.
- Document HTTPS hosting for installation and offline testing on physical devices, alongside the local static-server instructions. Do not add a backend or external runtime dependencies.
- Verify saved statistics survive closing and reopening the installed app. Do not promise statistics will transfer between Safari and the installed app or sync between devices.

## Scope

- Multiplication only, covering factors 1 through 9.
- One local learner; no login, profiles, cloud sync, analytics, advertising, or collection of child-identifying information.
- No addition, subtraction, division, extra tables, AI features, notifications, leaderboards, or social features.
- No email integration or use of credentials from the previous project.
- No need to persist the active question, deck order, or unfinished round.

## Working Instructions

- When asked to implement this plan, implement one feature at a time in the listed order.
- Continue through implementation without waiting for a new prompt between features.
- Make reasonable implementation decisions within this scope.
- Run relevant checks after each feature; inspect failures, fix them, and repeat affected checks.
- Verify existing features again when a change affects them.
- Use available browser tools to verify real user interactions on desktop and mobile.
- Use deterministic question fixtures or an injectable random source for repeatable shuffle and scoring checks.
- Test localStorage with missing data, valid saved results, malformed data, and simulated read/write failures.
- Do not claim a check passed unless it was performed. Report any blocked verification and continue independent work.
- A request to update this document alone does not authorize implementing or replacing the application.

## Completion Checks

### Choosing Practice

- All three choices are present: Series 1–9, Mixed 1–9, and Mixed all.
- The start screen asks only for a practice mode. Series and Mixed 1–9 then ask for a table between 1 and 9 on a separate screen.
- Selecting a table starts the first question immediately, with no additional Start, Continue, or confirmation action.
- Selecting Mixed all starts the first question immediately, without selecting a table.
- Returning from the table-choice screen allows a different mode to be chosen.
- Switching modes starts a fresh round without losing lifetime statistics.

### Question Generation

- Every selected table produces the correct nine equations in series order.
- Mixed 1–9 uses all nine multipliers exactly once per round.
- Mixed all uses all 81 ordered pairs exactly once per deck.
- Every equation and answer stays within the specified multiplication range.
- Mixed order is produced by a proper shuffle, not by sorting with a random comparator.

### Answering and Scoring

- Correct and incorrect answers produce the expected feedback and counts.
- Invalid input does not advance the question or change statistics.
- Only Check answer is visible before a valid submission; only Next is visible afterward. Neither state shows a disabled primary button, and hidden actions are absent from keyboard navigation and the accessibility tree.
- Repeated clicks or Enter presses cannot score or skip a question twice.
- A double tap or held Enter during the Check answer → Next transition cannot dismiss feedback or advance to the next question.
- Next advances exactly one question and clears the previous answer and feedback.
- Each new question restores the editable numeric answer field and Check answer action, with sensible keyboard focus.
- Active questions show orientation and answer feedback without correct-count, answered-count, or success-rate panels. Round results show those summaries, and lifetime results remain available in the statistics view.
- Leaving a round retains scored answers without penalizing unanswered questions.
- Round summaries and Practice again behave correctly in all three choices.

### Statistics and Persistence

- Current-round, overall, per-table, and per-mode counts and percentages are accurate.
- Zero-attempt states never show NaN, Infinity, or a misleading success rate.
- Refreshing the page preserves lifetime statistics without counting any answer twice.
- Corrupt or unavailable localStorage does not crash or block practice.
- Reset requires confirmation, removes only this app's statistics, and reports storage failures honestly.

### Responsive Layout and iOS PWA

- All screens and controls work at iPhone and iPad sizes in portrait and landscape, including with the on-screen keyboard open.
- The answer field uses number input with numeric input mode, requests an iOS numeric keyboard, and still rejects empty, negative, decimal, and nonnumeric answers without scoring them.
- The app can be added to the Home Screen on iPhone and iPad and opens in standalone mode with the correct name and icon.
- Installation help appears only on the start screen, is collapsed initially, and expands when requested. It is absent from other screens and hidden in the installed app.
- Routine offline-readiness copy is absent. Relevant setup or saving failures are explained clearly without blocking practice when it can continue.
- After the initial cache setup, the installed app reopens offline and all three practice choices, scoring, statistics, and reset remain usable.
- Lifetime statistics persist after closing and reopening the installed app, and updating cached app assets does not reset them.
- Verify Safari and installed-app behavior on physical iPhone and iPad devices when available. Report device checks separately from browser emulation and mark unavailable device verification as blocked.

### Focused Layout

- Navigation, section title, and essential context form a compact header group without repeated section headings below it.
- Statistics is available from the start and round-results screens outside the shared header, and absent from table selection and active practice.
- Header and content groups remain readable and usable on desktop, iPhone, and iPad, including narrow screens and enlarged text. Compactness does not reduce the required text sizes or touch areas.
- Spacing clearly groups related content without oversized empty bands. Header and footer dividers are omitted unless they resolve a specific visual ambiguity; adjacent groups do not have redundant separator lines.

### Final Verification

- All features work together through the browser without unexpected console errors.
- Keyboard operation, answer feedback, focus, and mobile layout have been checked.
- No external requests, credentials, or personal information are needed for practice.
- Local run and test instructions in README.md have been followed and verified.
- Report automated checks and browser checks separately, including anything blocked.

## Git Workflow

- During implementation, local feature commits are authorized without asking.
- Commit each working feature separately before starting the next when its relevant checks pass.
- Do not commit a feature with failed or blocked verification, or fold blocked work into a later feature commit.
- Stage only files belonging to the current change; exclude unrelated user changes and private files.
- Do not rewrite existing commits or push unless explicitly requested.
- Before each commit, review `git diff --cached --stat` and `git diff --cached`.
- If the staged diff exceeds about 200 lines, review important staged files selectively.
- Every commit message must include a conventional commit title of at most 72 characters, a blank line, and a short paragraph explaining purpose and context.
- Record each new commit hash when committing, without inspecting Git history later.

## Final Handoff

Report:

- What was implemented and how the three practice choices work.
- How to run the static application locally.
- How scores are calculated, saved, and reset.
- What was verified, distinguishing automated tests from browser interaction checks.
- Remaining limitations and blocked verification.
- The commits created during the run, using the hashes recorded when committing.
