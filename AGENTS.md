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
7. Optional multiple-choice answers in every practice choice, with a session preference and statistics by answer format.

## Practice Choices

Show exactly these three primary choices on the start screen:

- **One table, in order**, **One table, shuffled**, and **All nine tables, shuffled**. Present them as a compact group of action buttons, with the clear action wording as each button's only visible label. Do not add ordinal numbers, arrows, secondary descriptions, or a second, less descriptive title.
- Apply the focused-decision pattern below: show the practice modes without a table selector or a separate **Start practice** button on that screen. An independent, optional answer-format preference may accompany them; choosing a format must not start practice or add a setup step.
- Choosing **One table, in order** or **One table, shuffled** opens a table-choice screen containing tables 1–9. Tapping a table immediately starts that round.
- Choosing **All nine tables, shuffled** immediately starts the round, since no table choice is needed.
- Apply the direct-progression pattern below: the final practice choice starts the round, with no additional **Continue**, **Start practice**, or confirmation tap.
- Provide a way back from the table-choice screen to the practice modes. Keep the chosen mode clear on the table screen and the mode and table clear during practice.
- Avoid extra setup screens, repeated selection summaries, and decorative footer slogans. Keep installation help on the start screen only, collapsed by default. Keep statistics available as a secondary destination without adding steps to starting practice.

### One table, in order

- Let the child choose a times table from 1 to 9.
- Practice that table in sequence: for table 4, show 4 × 1, 4 × 2, and so on through 4 × 9.
- Show one question at a time and the position in the series, such as “Question 3 of 9”.
- Include each multiplier exactly once in a nine-question round.

### One table, shuffled

- Let the child choose a times table from 1 to 9.
- Present its nine questions as flashcards in shuffled order.
- For example, table 4 might start with 4 × 7, then 4 × 2, then 4 × 9.
- Include each multiplier exactly once per round, with no repeated or missing questions.
- Shuffle again when the child starts another round.

### All nine tables, shuffled

- Use flashcards drawn from all 81 combinations of the 1–9 times tables.
- Both factors must be between 1 and 9 inclusive; do not include 0, 10, or higher tables.
- Shuffle a deck containing every ordered pair exactly once. Treat 3 × 4 and 4 × 3 as separate practice questions.
- Show progress through the deck and allow the child to stop at any time; completing all 81 questions is not required to save progress statistics.
- This choice does not require a table selection.

## Questions and Answers

- Display multiplication using the × symbol, with large, readable numbers.
- Support typed answers and multiple-choice answers across all three practice choices. Keep typed answers as the initial default and offer a clearly selected **Type answer / Choose answer** toggle on the start screen only.
- Treat answer format as a session preference independent of the table and practice order. Remember it in sessionStorage through navigation and reloads, validate saved values, and continue in memory with a concise notice if storage fails. Freeze the format for a round and retain it for Practice again.
- For typed answers, provide a labeled numeric answer field using `type="number"`, `inputmode="numeric"`, `min="0"`, and `step="1"` to request numeric entry on iPhone and iPad. Retain explicit whole-number validation; input attributes alone must not determine whether an answer is valid.
- Apply the state-based action pattern below: for typed answers, show the numeric input and **Check answer** before a valid submission. After checking, remove both and place **Next** in the input's exact space, with the same dimensions. Input and Next must never appear together. Keep the input programmatically labeled without a redundant visible label. For multiple choice, tapping an answer is the submission; show **Next** only afterward, with no extra Check answer step.
- **Plausible alternatives:** present exactly four unique, positive whole-number options, with exactly one correct product. Prefer wrong answers arising from nearby factor mistakes, such as `(a±1)×b` and `a×(b±1)`. Remove duplicate, zero, and correct values from the wrong-answer pool; use nearby positive fallback values when needed. Keep options within the learning range of 1–81 and shuffle all four so position does not reveal the answer.
- **Stable review:** arrange answer choices as generous, consistently sized touch targets in a two-column grid when space permits. Keep values and positions stable from selection through feedback review; identify the chosen answer with text as well as styling. Replace checked answer buttons with noninteractive content instead of leaving ineffective or disabled controls. Reserve sufficient feedback space to avoid moving the question or remaining options when a result appears, including with enlarged text. Next may extend the card below the existing choices; do not reserve a blank action row before it is available.
- **Shared scoring:** route both answer formats through the same whole-number validation, product comparison, attempt lock, written feedback, and statistics update. A selected incorrect option counts as one attempt; later interaction with the checked question must not change the score. Do not reveal which option is correct before submission.
- Hide unavailable actions rather than showing disabled buttons. Keep **Check answer** available for empty or invalid input so activation can explain what to enter.
- Support typing an answer and pressing Enter to check it. Verify the numeric keyboard on physical iOS devices when available, and report emulation separately.
- Accept only a whole-number answer. Empty, whitespace-only, negative, decimal, or nonnumeric input must show simple guidance without affecting the score.
- Compare the answer with the product of the two factors.
- After checking, give clear feedback: encouraging confirmation for a correct answer, or a kind correction showing the full equation for an incorrect answer.
- Replace the question mark with the submitted number in bold. Use green for a correct submitted number and red for an incorrect one, while the equation-and-feedback panel retains its blue surface. Keep the correct equation directly beneath an incorrect submission so the learner can distinguish their answer from the correction. Apply the same result colors in both answer formats, including reviewed options. New questions start neutral; invalid input must not be presented or scored as an incorrect answer.
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
- Also provide the same statistics for each table from 1 to 9, each of the three practice choices, and each answer format. Attribute every scored answer to its format in the overall, table, and practice-choice aggregates. Keep the totals consistent across those groupings; do not introduce individual answer histories.
- When practising all nine tables, assign each question to the table represented by its first factor; for example, 4 × 7 contributes to table 4.
- Calculate aggregate success rates from the underlying counts, not by averaging rounded percentages.
- Keep current-round counters separate from lifetime statistics. Starting a new round must not reset lifetime results.
- Use a named, versioned localStorage key and validate stored data before using it. Reject invalid counts, negative values, or correct counts greater than answered counts.
- **Compatible evolution:** when extending saved statistics, validate and migrate supported earlier schemas without discarding valid totals. Results collected before multiple choice existed belong to typed answers. Keep related counts in one atomic save and make reset cover the complete current record so old results cannot reappear after a refresh. Unsupported or inconsistent schemas must follow the existing graceful-recovery behavior.
- Handle missing, malformed, or unsupported saved data gracefully: keep the app usable, explain that saved statistics could not be loaded when appropriate, and start with valid defaults.
- If localStorage is unavailable or saving fails, let practice continue in memory and show a small, clear notice that progress will not be saved.
- Provide a statistics view and a **Reset statistics** action with confirmation. Canceling must preserve all results.
- Reset only this app's saved data; never call `localStorage.clear()` or remove unrelated keys. Confirm success only if the saved reset succeeds.
- Persist only aggregate statistics in localStorage and the answer-format preference in sessionStorage, not personal information, individual answer histories, or unfinished rounds. A refresh may return to the start screen while preserving lifetime statistics and the current session's preference.
- Explain that statistics belong to this browser and device, are not synced, and may be lost if browser data is cleared.

## Layout and Accessibility

- **Consistency across the whole app:** every layout principle applies to the start screen, table selection, both answer formats and their feedback states, round results, statistics, and dialogs. A screenshot identifies a symptom, not the boundary of the fix. Update shared rules and inspect every affected screen; do not leave older spacing, sizing, or alignment conventions in sibling views.
- **One shared page grid:** use the same outer content width and gutters for app identity, navigation, section titles, progress, primary content, and secondary destinations. Avoid independently narrowing or centering a screen's body inside a wider header. A local inset is appropriate inside a card or for readable prose, but must not create a competing page alignment. Place the section title on the shared left edge below the identity/navigation row; let navigation wrap when needed without reducing readable text or touch areas.
- **Center the meaningful content:** evaluate the visible label or number itself, not just its wrapper. Empty review labels must not push answer values off center. Keep values centered in both axes before and after submission, with enough separate space for result labels to remain readable without overlap.
- **Reserve space proportionately:** reserve only the feedback space required at the current text size and width. Do not leave a permanent empty action row for an unavailable action. A newly available action may extend the group below existing content, while the question and choices retain their positions. Prioritize the equation and all answer options fitting together at ordinary desktop and portrait phone sizes; permit scrolling on short screens or enlarged text rather than clipping or shrinking controls.

- Use a child-friendly but serious design: calm, warm, and respectful of a 10-year-old. It should feel like a useful learning tool, not a toy or a babyish game.
- Use a cheerful, carefully limited color palette, clear visual hierarchy, and purposeful whitespace. Keep the app spacious within a compact layout. Avoid cartoon mascots, decorative clutter, novelty fonts, and distracting game-like effects.
- Keep the layout simple: practice choices, the active question or flashcard, and statistics or a round summary.
- **Concentrated orientation:** group navigation, the current section title, and essential context in one compact header area. Combine closely related information instead of scattering it across separate rows or repeating it in the page body. Keep the main task close to this header.
- **Spacious but compact:** create breathing room through readable line spacing, control padding, and consistent gaps within meaningful groups. Avoid oversized header bands, empty spacer sections, and cumulative margins that push useful content down the page. Preserve generous touch targets and text sizes; gain compactness by improving grouping and removing unnecessary space.
- **Contextual action placement:** reserve the shared header for app identity, navigation, and context needed to understand the current screen. Put occasional secondary actions near the content or entry point they serve, and show them only on relevant screens. An action being available somewhere in the app does not justify showing it in every header.
- **Cheerful without stereotypes:** use lively, harmonious accents on soft, low-saturation backgrounds. Aim for curiosity and warmth while respecting the learner: no gender-coded themes, babyish decoration, or a different saturated color for every control. Treat visual references as inspiration for relationships and mood, not exact palettes to copy.
- **One blue UI theme:** use a single soft-blue scale for the page, identity, cards, controls, selection, progress, hover, focus, statistics, dialogs, and notices. Separate layers by lightness within that family: a pale-blue page, a deeper soft-blue card, and lighter blue controls. Hover stays blue; use a distinct deep-blue fill with light text for keyboard focus. Avoid white, grey, cream, yellow, or unrelated hues as interface surfaces. Reserve red and green for answer-result highlights: the submitted number, feedback, and selected option. An unselected correct alternative uses green text and an explicit label on the same light-blue surface as other options. Keep the equation-and-feedback panel blue after submission so a result does not recolor the UI. Apply these roles through shared tokens, including installed-app chrome.
- **Calm layer contrast:** distinguish page, content group, and controls through a consistent lightness hierarchy within related colors. Use a muted middle-tone card with lighter blue answer surfaces; give unselected options and the correct alternative the same surface role. Keep continuation controls in the shared solid-blue primary-action style, so proceeding remains visually distinct from reviewing an answer. Reserve red and green filled surfaces for the submitted option. Avoid mixing unrelated grey, pure-white, and accent-colored blocks at the same level. Make adjacent layers visibly distinct without outlines or shadows, and verify foreground text contrast separately from surface separation in neutral, correct, incorrect, hover, and focus states.
- **Harmony before variety:** choose colors as a related system rather than assigning a different hue to every component. Give each screen state one dominant accent and let supporting elements recede through softer blue surfaces, smaller colored areas, and lower saturation. Do not confuse maximum contrast everywhere with clear hierarchy: verify readable foreground contrast while also reviewing which elements compete for attention at phone size. Cheerfulness should come from a lively accent and soft, light-blue surroundings rather than several equally saturated blocks.
- **Flat surfaces and contrast:** distinguish controls and states with filled surfaces, readable foreground contrast, spacing, and alignment. Use solid color blocks without visible outlines, border separators, inset frames, gradients, or shadows. Prefer simple rectangular shapes with one small shared corner radius. Segmented controls join edge to edge, without an inset gutter that imitates a frame. Distinguish statistics rows and notices through spacing and surface color instead of rules or border stripes. Apply the same approach to practice buttons, answer fields, result cards, and dialogs. Keep keyboard focus unmistakable through a distinct, high-contrast filled highlight, not an outline. Its color must remain separate from selected, correct, and incorrect states; use system highlight colors in forced-color mode. Never remove a browser focus indicator without providing the visible replacement. Pair result colors with written feedback and selected-state semantics.
- **Grouping without rules:** use spacing, alignment, typography, and contrasting surfaces to distinguish groups. Do not add border separators to headers, footers, data rows, or notices. Preserve meaningful indicators such as the filled progress bar and recognizable link styling; these communicate function rather than framing content.
- **Responsive grouping:** preserve the relationship and reading order of header elements as space changes. Allow compact wrapping or stacking on narrow screens; do not force everything onto one row, shrink readable text, reduce touch areas, or truncate essential context to achieve a compact layout.
- Apply these rules to practice by grouping **Back to choices** and the practice mode in the header area. Let the equation show the selected table; do not repeat it as a separate “Table N” header label. In results, where the equation is absent, retain the table context. Place **Statistics** as a secondary action on the start and round-results screens, outside the shared header; omit it during table selection and active practice. Keep the dedicated statistics view reachable from those entry points.
- **Content by task:** give each screen a clear purpose and include only information that helps the user complete that task or choose their next action. Move secondary information to the screen where it is useful instead of repeating it throughout the app.
- **Results at the right time:** show performance totals, percentages, and other evaluative summaries on result or review screens, not during the activity. During an activity, retain only progress needed for orientation and immediate feedback needed to continue. Continue collecting results without displaying a running dashboard.
- **Contextual, optional help:** place setup, installation, and other occasional help at the relevant entry point, not on every screen. Keep it collapsed by default behind a clear label and reveal details only when requested. Help must not interrupt the main task or add required steps.
- **Meaningful status:** show a status message only when it changes what the user needs to know or do, explains a meaningful delay, or reports a problem affecting the task. Omit routine success or readiness messages when normal operation needs no explanation. Keep actionable errors and notices about unsaved progress visible where relevant.
- **Purposeful copy:** every label or sentence must identify an action, explain a choice, give useful feedback, or communicate a relevant consequence. Remove slogans, filler encouragement, repeated instructions, and implementation details that do not help the user. Keep necessary wording short, concrete, and respectful.
- **Intuitive by design:** make each control's purpose and each choice's effect clear through its wording, placement, grouping, and selected state. When an interaction needs an explanation to be understood, improve the interaction first. Omit visible labels and instructions that merely repeat clear actions, such as “Answer with” beside Type answer / Choose answer or “Choose how to practise” above named practice modes. Retain programmatic accessible names, necessary input labels, meaningful feedback, and essential consequences; removing redundant visible copy must not remove information someone needs to use the app.
- **Action groups, not decorated lists:** when peers each perform an immediate action, group clear buttons with consistent spacing and clearly distinguishable filled surfaces. Use numbering only when order or sequence matters. Do not imply a checklist, ranking, or multi-selection when selecting one action advances the flow. Give peer actions equal widths and heights. For three practice choices, use three equal columns when they fit comfortably and one equal-width column otherwise; avoid a two-plus-one arrangement that gives the final option accidental emphasis.
- **A small, shared size scale:** use a limited set of named typography and control-size tokens rather than slightly different sizes for each component. Use body size for prose, action labels, and secondary links; one heading size for section headings and prominent numbers; and one title size for the page introduction. Reserve a distinct larger scale for the equation because it is the learning task. Prefer weight, spacing, and placement over adding more font sizes. Keep text resizable and allow content to expand beyond minimum control heights.
- **Balanced control interiors:** center action labels horizontally and vertically with consistent line height, weight, and padding. Give peer controls equal dimensions, including when labels wrap. Use one standard minimum height for ordinary controls; allow more room where review content or numeric input requires it. Do not shrink text to fit a predetermined box.
- **A coherent visual grid:** align identity, titles, decision groups, and secondary utilities to shared content edges. Use a small spacing scale with smaller gaps within a group and larger gaps between distinct purposes. Avoid cumulative margins and isolated offsets. Keep Statistics and installation help visually adjacent as secondary utilities, with the same left edge as the primary content.
- **Shared group boundaries:** related control groups stacked vertically should share both left and right edges. Let the answer-format toggle span the practice grid's full width, with two equal segments; avoid an arbitrary width cap that breaks their alignment.
- **Preference versus progression:** make mutually exclusive preferences read as one group of equal segments. Use contrasting surface fills and readable foreground colors, alongside programmatic selected state, so the preference is obvious without a nested outline. Keep the surrounding group quiet and use the strongest contrast on the selected segment. Preserve visible keyboard focus and generous touch targets.
- **Lead with the clearest wording:** if supporting copy explains a choice better than its title, promote that wording to the primary action label and remove the redundant title and subtitle. Prefer concrete descriptions of scope and behavior over internal mode names. Keep the same terminology in selection, practice context, results, and statistics so the user does not have to learn two names for the same action.
- **Warmth through hierarchy:** use rounded system typography where available, with a normal system-font fallback and no remote font dependency. Give equations and answer values confident weight; keep supporting feedback smaller. Create a distinct filled equation-and-feedback panel, followed by a separate answer grid and primary action, all sharing the same outer edges. Avoid enclosing these groups in another filled card. Use consistent group spacing and small shared corners, rather than oversized padding, ornament, or extra text, to make the interface welcoming. Apply the same typography and action hierarchy throughout the app.
- **Interpret references deliberately:** carry over useful hierarchy, warmth, and relationships while retaining the app’s flat surfaces, blue theme, shared grid, and concise copy. A visual reference does not change scoring or introduce retries, hints, repeated praise, decorative status icons, or new setup steps. Keep answer options stable and the typed-input-to-Next replacement in place.
- **Group information by meaning:** place a result, correction, or explanation next to the content it describes, using proximity and alignment to make that relationship visible. Keep the equation and its feedback together as one reading group, followed by the answer controls and their next action. Do not separate feedback from the question with an intervening answer grid. Reserve only the space needed for expected feedback so showing it does not move controls.
- **Context without repetition:** show information where it is needed to understand or act, and omit repeated labels when the content already conveys it. A visible equation identifies the current table; clearly tappable answer options do not need a “Choose your answer” instruction. Keep accessible group names and descriptions programmatically, and retain necessary labels for editable fields. Reintroduce context on screens where its original source is no longer present.
- **Focused decisions:** present one meaningful decision at a time, with the relevant options and enough context to choose. Reveal dependent choices only after their prerequisites are resolved. Do not expose several dependent decisions together or split a simple decision into unnecessary screens. Multiple options for the same decision belong together.
- **Direct progression:** when selecting an option fully expresses the user’s intent, apply it and move directly to the next meaningful state. Let the final required choice begin the activity; avoid an extra Start, Continue, Apply, or confirmation action that merely repeats the same intent. Retain an explicit submission or confirmation when it serves a distinct purpose, such as submitting an answer, reviewing several edits, or confirming a destructive action.
- **Action availability:** show an action only when it can perform a useful operation in the current state. Hide unavailable or irrelevant actions instead of displaying disabled buttons. When a user needs guidance about a prerequisite, explain it near the relevant control; keep submission available when activating it can provide useful input validation. Prevent duplicate operations through state guards, not visible disabled controls.
- **State-based actions:** when actions represent mutually exclusive states of the same task, show only the action that applies to the current state. Replace it in the same position when the state changes; do not display future or previous actions alongside it, or show them as disabled alternatives. Apply this pattern throughout the app, not just to question controls.
- **Reuse the interaction space:** once an entry is submitted and locked, replace the completed input with the next useful action in the same position and dimensions. Move the submitted value into its meaningful review context rather than keeping a redundant read-only field. Remove obsolete submission controls and labels, transfer keyboard focus to the replacement, and prevent the submitting gesture from activating it. Let unused space below the remaining controls collapse without moving those controls.
- **Consistent result semantics:** use shared positive and negative color tokens throughout the interface: green for correct and red for incorrect. Put the strongest result color and typographic emphasis on the value being evaluated; retain the blue surface of the containing group. Keep neutral questions and validation guidance distinct from scored outcomes. Pair color with written feedback and clear state so meaning never depends on color alone. Reset all result styling when the next task begins.
- Keep a separate action when it serves a distinct purpose, such as letting the learner read feedback before moving on.
- Keep independent secondary actions, such as navigation or canceling, available when useful. This pattern does not limit a screen to one button when the buttons offer distinct choices or independent actions.
- When an action is replaced, update its accessible name and behavior together, preserve sensible focus, and prevent the gesture that triggered the change from also activating the replacement.
- **Intentional gestures:** distinguish repeated input from a new action using the actual pointer or keyboard gesture. A browser's accumulated click count must not suppress a later intentional tap on another control; test both duplicate prevention and the ability to continue afterward.
- Keep routine practice free of confirmation dialogs. Retain confirmation for the destructive **Reset statistics** action.
- Make the three practice choices easy to understand and the selected table obvious.
- Make text easy to read with system fonts, body text of at least 18 CSS pixels, comfortable line spacing, and large, prominent equations. Keep instructions short and plain, and support browser text resizing.
- Give every interactive control a touch area of at least 48 × 48 CSS pixels, with generous padding and enough space between controls to prevent accidental taps. Make primary actions especially easy to reach and tap on iPhone and iPad.
- Use sufficient contrast, labeled controls, and visible keyboard focus.
- Make all actions keyboard accessible. Move focus to the numeric answer field for typed questions or the first answer option for multiple choice. When submitted options become noninteractive, move focus to Next without unnecessary page scrolling; held keys must not activate that newly focused action.
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
- **Reproducible outcomes:** every completed UI or technical feature must update this document with the principles and general guidelines needed to reproduce its behavior in a fresh build. Describe user intent, meaningful state transitions, accessibility, responsive relationships, data invariants, storage lifetime, failure handling, and observable acceptance criteria. Explain consequential choices, reconcile superseded instructions, and avoid binding requirements to incidental selectors, file names, exact spacing, or implementation structure.
- **Testable behavior:** keep answer generation, scoring, and persistence separable from rendering, with injectable randomness and storage for repeatable tests. Test edge cases and behavioral invariants across the full learning range, then verify the real keyboard and touch flows, state transitions, data migration, and offline assets in the browser. Distinguish browser emulation from physical-device evidence.

## Completion Checks

### Choosing Practice

- All three choices are present: One table, in order, One table, shuffled, and All nine tables, shuffled.
- The start screen provides the practice modes and an optional independent answer-format toggle. Series and One table, shuffled then ask for a table between 1 and 9 on a separate screen. Changing answer format never starts a round or adds another required setup step.
- Selecting a table starts the first question immediately, with no additional Start, Continue, or confirmation action.
- Selecting All nine tables, shuffled starts the first question immediately, without selecting a table.
- Returning from the table-choice screen allows a different mode to be chosen.
- Switching modes starts a fresh round without losing lifetime statistics.

### Question Generation

- Every selected table produces the correct nine equations in series order.
- One table, shuffled uses all nine multipliers exactly once per round.
- All nine tables, shuffled uses all 81 ordered pairs exactly once per deck.
- Every equation and answer stays within the specified multiplication range.
- Mixed order is produced by a proper shuffle, not by sorting with a random comparator.

### Answering and Scoring

- Correct and incorrect answers produce the expected feedback and counts.
- Invalid input does not advance the question or change statistics.
- For typed answers, only Check answer is visible before a valid submission; only Next is visible afterward. For multiple choice, four answer buttons submit directly before checking; afterward the options remain as noninteractive review content and Next becomes available. Neither state shows disabled buttons, and hidden actions are absent from keyboard navigation and the accessibility tree.
- A checked typed answer removes the numeric input from the interface and accessibility tree. Next occupies its former position and dimensions and receives focus. The bold submitted number replaces the question mark, with consistent green/red number, feedback, and selected-option styling in both formats while the card remains blue. An incorrect answer retains a written correction. Verify this transition and its neutral reset on narrow screens and with enlarged text.
- Every equation has four unique, positive options containing the product exactly once. Wrong options follow the plausible-alternative principle, including edge cases such as 1 × 1 and 9 × 9, and the correct answer appears in different positions across deterministic shuffle fixtures.
- Choosing an option preserves the option order and geometry, identifies the selected answer without relying on color, announces the same written feedback as typed answers, and never advances automatically. Double taps, double clicks, and held Enter or Space cannot dismiss feedback or score twice.
- Repeated clicks or Enter presses cannot score or skip a question twice.
- A double tap or held Enter during the Check answer → Next transition cannot dismiss feedback or advance to the next question.
- Next advances exactly one question and clears the previous answer and feedback.
- Each new question restores the selected answer format: an editable numeric field and Check answer, or four fresh answer buttons. Clear prior selection and feedback, restore sensible focus, and retain the answer format for Practice again.
- Active questions show orientation and answer feedback without correct-count, answered-count, or success-rate panels. Round results show those summaries, and lifetime results remain available in the statistics view.
- Leaving a round retains scored answers without penalizing unanswered questions.
- Round summaries and Practice again behave correctly in all three choices.

### Statistics and Persistence

- Current-round, overall, per-table, and per-mode counts and percentages are accurate.
- Zero-attempt states never show NaN, Infinity, or a misleading success rate.
- Refreshing the page preserves lifetime statistics without counting any answer twice.
- Corrupt or unavailable localStorage does not crash or block practice.
- Reset requires confirmation, removes only this app's statistics, and reports storage failures honestly.
- Valid legacy statistics migrate into typed-answer aggregates with no loss; new typed and multiple-choice attempts update matching overall, table, and practice-choice counts exactly once. Refresh, failed writes, and reset must not duplicate or resurrect results.
- Answer-format preference survives navigation and reload in the same session, defaults sensibly in a fresh session, and remains usable when sessionStorage cannot be read or written. Resetting lifetime statistics does not reset this separate preference.

### Responsive Layout and iOS PWA

- All screens and controls work at iPhone and iPad sizes in portrait and landscape, including with the on-screen keyboard open.
- Typed answers use number input with numeric input mode, request an iOS numeric keyboard, and still reject empty, negative, decimal, and nonnumeric answers without scoring them. Multiple choice uses touch controls without requesting a software keyboard.
- The app can be added to the Home Screen on iPhone and iPad and opens in standalone mode with the correct name and icon.
- Installation help appears only on the start screen, is collapsed initially, and expands when requested. It is absent from other screens and hidden in the installed app.
- Routine offline-readiness copy is absent. Relevant setup or saving failures are explained clearly without blocking practice when it can continue.
- After the initial cache setup, the installed app reopens offline and all three practice choices, both answer formats, scoring, statistics, and reset remain usable. Include every new public module in the offline cache and advance the asset version without resetting statistics.
- Lifetime statistics persist after closing and reopening the installed app, and updating cached app assets does not reset them.
- Verify Safari and installed-app behavior on physical iPhone and iPad devices when available. Report device checks separately from browser emulation and mark unavailable device verification as blocked.

### Focused Layout

- Controls and result states use flat, contrasting fills without visible outlines or inset frames. Review neutral, hover, selected, correct, incorrect, and keyboard-focus states together; foreground text must remain readable on every surface and the filled keyboard-focus highlight must remain visible.

- Review start, table selection, typed and multiple-choice practice (unanswered, correct, incorrect, and invalid where applicable), results, statistics, and reset together at desktop and mobile widths. Include enlarged text. Verify shared page edges and type/control scales across screens, rather than accepting isolated screenshots or interaction tests as proof of visual consistency.
- Check answer values themselves for horizontal and vertical centering and stable positions after submission. Inspect feedback spacing, label overlap, viewport fit, and the arrival of Next separately from functional scoring checks.

- The interface uses three shared text sizes for body copy, headings, and the introduction, plus a task-specific equation size. Ordinary controls share a minimum height and balanced padding. Enlarged text can increase control height without clipping.
- Practice choices have equal dimensions in three columns or one column, never an uneven two-plus-one arrangement. The answer-format toggle has equal segments with a restrained selected state. Identity, headings, controls, and secondary utilities follow shared alignment and spacing rules.
- Navigation, section title, and essential context form a compact header group without repeated section headings below it.
- Statistics is available from the start and round-results screens outside the shared header, and absent from table selection and active practice.
- Header and content groups remain readable and usable on desktop, iPhone, and iPad, including narrow screens and enlarged text. Compactness does not reduce the required text sizes or touch areas.
- Spacing clearly groups related content without oversized empty bands. Header, footer, and data-row dividers are absent; surface colors and spacing make the grouping clear.
- The start screen's answer-format controls and practice modes explain themselves through their action labels and grouping. No extra visible “Answer with” label or “Choose how to practise” instruction is needed, while the controls remain named and understandable to assistive technology.
- Practice choices are grouped buttons with exactly the three descriptive action labels and no decorative numbering, duplicate headings, subtitles, or list-row arrows. Each button still starts its existing table-choice or immediate-practice flow; the layout never suggests that several practice modes should be selected together.
- During practice, feedback sits directly beneath and aligns with the equation, ahead of the answer controls. The answer grid has an accessible name without a redundant visible instruction. The header does not repeat the table already shown in the equation, while results retain the table context. These relationships remain clear on narrow screens and with enlarged text, without shifting the answer options when feedback appears.

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
