import { MODES, validChoice, makeDeck, createRound, checkAnswer, nextQuestion, successRate } from './core.js';
import { createStatisticsStore } from './statistics.js';

const app = document.querySelector('#app');
let mode = 'series';
let table = 4;
let round;
const store = createStatisticsStore();
const resetDialog = document.querySelector('#reset-dialog');
let pointerType;
let lastTouch;
app.addEventListener('pointerdown', event => {
  pointerType = event.pointerType;
  // Keep answer focus if another tap lands on the action for a new question.
  if (event.target.closest('#question-action')) event.preventDefault();
});
app.addEventListener('click', event => {
  if (!event.target.closest('button')) return;
  // WebKit may label a touch-generated click as mouse; trust pointerdown first.
  const touch = (pointerType || event.pointerType) === 'touch' && event.detail !== 0;
  const repeatedTouch = touch && lastTouch && event.timeStamp - lastTouch.time < 400
    && Math.hypot(event.clientX - lastTouch.x, event.clientY - lastTouch.y) < 24;
  if (event.detail > 1 || repeatedTouch) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if (touch) lastTouch = { time: event.timeStamp, x: event.clientX, y: event.clientY };
}, true);
app.addEventListener('keydown', event => {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
function renderHeader(title = '', detail = '', id = 'screen-title') {
  const header = document.querySelector('.site-header');
  header.innerHTML = `<a class="brand" href="./" aria-label="Multiply home"><span class="brand-mark" aria-hidden="true">×</span> Multiply</a>
    ${title ? `<button id="header-back" class="text-button" type="button">← Back to choices</button>
    <div class="screen-heading"><h1 id="${id}" tabindex="-1">${title}</h1>${detail ? `<p>${detail}</p>` : ''}</div>` : ''}`;
  header.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    backToChoices();
  });
  header.querySelector('#header-back')?.addEventListener('click', backToChoices);
}

function bindStatistics() {
  app.querySelector('#statistics-button').addEventListener('click', statisticsView);
}
resetDialog.addEventListener('close', () => {
  if (resetDialog.returnValue === 'reset') {
    store.reset();
    showStorageNotice();
    statisticsView();
    app.querySelector('#reset').focus();
  }
});

function showStorageNotice() {
  const notice = document.querySelector('#storage-notice');
  notice.textContent = store.notice;
  notice.hidden = !store.notice;
}

function choices() {
  renderHeader();
  document.querySelector('.site-footer')?.toggleAttribute('hidden', false);
  document.querySelector('.install-help')?.removeAttribute('open');
  app.innerHTML = `
    <section aria-labelledby="choices-title">
      <div class="intro"><h1 id="choices-title" tabindex="-1">Get to know<br>your times tables.</h1>
      <p>Choose how to practise.</p></div>
      <div class="choices" role="group" aria-label="Practice choices">
        ${Object.entries(MODES).map(([key, value], index) => `
          <button class="choice" type="button" data-mode="${key}">
            <span class="choice-number" aria-hidden="true">0${index + 1}</span>
            <span><strong>${value.label}</strong><span class="choice-description">${value.description}</span></span>
            <span class="choice-indicator" aria-hidden="true">→</span>
          </button>`).join('')}
      </div>
      <button id="statistics-button" class="text-button secondary-action" type="button">Statistics</button>
    </section>`;
  bindStatistics();
  app.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    if (mode === 'all') start();
    else tableChoice();
  }));
}

function tableChoice() {
  renderHeader('Which table?', `${MODES[mode].label} · ${MODES[mode].detail}`, 'table-title');
  document.querySelector('.site-footer')?.toggleAttribute('hidden', true);
  app.innerHTML = `<section class="practice" aria-labelledby="table-title">
    <div class="tables" role="group" aria-label="Choose a table">${Array.from({ length: 9 }, (_, i) => i + 1).map(n => `
      <button type="button" data-table="${n}" aria-label="Table ${n}">${n}</button>`).join('')}</div>
  </section>`;
  app.querySelectorAll('[data-table]').forEach(button => button.addEventListener('click', () => {
    table = Number(button.dataset.table);
    start();
  }));
  document.querySelector('#table-title').focus();
}

function start() {
  if (!validChoice(mode, table)) return;
  round = createRound(makeDeck(mode, table));
  question();
}

function backToChoices() {
  round = null;
  choices();
  app.querySelector('h1').focus();
}

function question() {
  renderHeader(MODES[mode].label, mode === 'all' ? 'All tables' : `Table ${table}`, 'practice-title');
  document.querySelector('.site-footer')?.toggleAttribute('hidden', true);
  const [a, b] = round.deck[round.index];
  app.innerHTML = `<section class="practice" aria-labelledby="practice-title">
    <p id="position">Question ${round.index + 1} of ${round.deck.length}</p>
    <progress id="round-progress" value="${round.answered}" max="${round.deck.length}" aria-label="Questions answered"></progress>
    <div class="question-card">
      <h2 class="equation" id="equation">${a} × ${b} <span aria-hidden="true">= ?</span></h2>
      <form id="answer-form" novalidate>
        <label for="answer">Your answer</label>
        <input id="answer" name="answer" type="number" inputmode="numeric" min="0" step="1" autocomplete="off" enterkeyhint="done" aria-describedby="equation feedback">
        <p id="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="answer-actions"><button id="question-action" class="primary" type="submit">Check answer</button></div>
      </form>
    </div>
    ${mode === 'all' ? '<p class="round-note">You can stop whenever you like.</p>' : ''}
  </section>`;
  app.querySelector('#answer-form').addEventListener('submit', submit);
  app.querySelector('#question-action').addEventListener('click', () => {
    // Submission handles the unchecked state; Next is an explicit button action.
    if (!round.checked) return;
    if (!nextQuestion(round)) return;
    if (round.index === round.deck.length) summary();
    else question();
  });
  app.querySelector('#answer').focus();
}

function submit(event) {
  event.preventDefault();
  const input = app.querySelector('#answer');
  const result = checkAnswer(round, input.value);
  if (result.status === 'locked') return;
  const feedback = app.querySelector('#feedback');
  if (result.status === 'invalid') {
    feedback.textContent = 'Type a whole number, like 12.';
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  input.removeAttribute('aria-invalid');
  input.readOnly = true;
  const action = app.querySelector('#question-action');
  action.type = 'button';
  action.innerHTML = 'Next <span aria-hidden="true">→</span>';
  feedback.textContent = result.correct ? `Correct! ${result.equation}.` : `The answer is ${result.equation}.`;
  feedback.dataset.result = result.correct ? 'correct' : 'learn';
  store.record(mode, result.table, result.correct);
  showStorageNotice();
  app.querySelector('#round-progress').value = round.answered;
}

function scoreMarkup(counts) {
  return `<dl class="score-strip">
    <div><dt>Correct</dt><dd>${counts.correct}</dd></div>
    <div><dt>Answered</dt><dd>${counts.answered}</dd></div>
    <div><dt>Success rate</dt><dd class="rate">${successRate(counts)}</dd></div>
  </dl>`;
}

function summary() {
  renderHeader('Round complete', `${MODES[mode].label} · ${mode === 'all' ? 'All tables' : `Table ${table}`}`, 'summary-title');
  document.querySelector('.site-footer')?.toggleAttribute('hidden', true);
  app.innerHTML = `<section class="practice summary" aria-labelledby="summary-title">
    ${scoreMarkup(round)}
    <div class="answer-actions"><button id="again" class="primary" type="button">Practice again</button><button id="statistics-button" type="button">Statistics</button></div>
  </section>`;
  app.querySelector('#again').addEventListener('click', start);
  bindStatistics();
  document.querySelector('#summary-title').focus();
}

function statisticsView() {
  renderHeader('Your practice so far.', '', 'stats-title');
  document.querySelector('.site-footer')?.toggleAttribute('hidden', true);
  round = null;
  app.innerHTML = `<section aria-labelledby="stats-title">
    <section aria-labelledby="overall-title"><h2 id="overall-title">All practice</h2>${scoreMarkup(store.data.overall)}</section>
    ${statisticsGroup('By table', Object.entries(store.data.tables).map(([key, counts]) => [`Table ${key}`, counts]))}
    ${statisticsGroup('By practice choice', Object.entries(store.data.modes).map(([key, counts]) => [MODES[key].label, counts]))}
    <div class="statistics-footer"><p>Success rate = correct answers ÷ answered questions × 100, rounded to a whole percent. Only your first answer counts.</p>
    <p>These statistics belong to this browser and device. They are not synced and may be lost if browser data is cleared.</p>
    <button id="reset" type="button">Reset statistics</button></div>
  </section>`;
  app.querySelector('#reset').addEventListener('click', () => {
    resetDialog.returnValue = '';
    resetDialog.showModal();
  });
  document.querySelector('#stats-title').focus();
}

function statisticsGroup(title, entries) {
  return `<section class="statistics-group"><h2>${title}</h2><ul class="statistics-list">${entries.map(([label, counts]) => `<li><h3>${label}</h3>${scoreMarkup(counts)}</li>`).join('')}</ul></section>`;
}

choices();
showStorageNotice();
