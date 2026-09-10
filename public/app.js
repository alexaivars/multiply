import { MODES, validChoice, makeDeck, createRound, checkAnswer, nextQuestion, successRate } from './core.js';
import { createStatisticsStore } from './statistics.js';
import { ANSWER_FORMATS, answerOptions, createAnswerFormatStore } from './answer-formats.js';

const app = document.querySelector('#app');
let mode = 'series';
let table = 4;
let round;
const store = createStatisticsStore();
const answerFormat = createAnswerFormatStore();
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
  // Touch click counts can carry over to a later tap on a different control.
  if ((!touch && event.detail > 1) || repeatedTouch) {
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
      <div class="intro"><h1 id="choices-title" tabindex="-1">Get to know<br>your times tables.</h1></div>
      <div class="answer-format" role="group" aria-label="Answer format">
        <div class="format-toggle">
          <button type="button" data-format="typed" aria-pressed="${answerFormat.value === 'typed'}">Type answer</button>
          <button type="button" data-format="choice" aria-pressed="${answerFormat.value === 'choice'}">Choose answer</button>
        </div>
      </div>
      <p id="format-notice" class="format-notice" role="status" ${answerFormat.notice ? '' : 'hidden'}>${answerFormat.notice}</p>
      <div class="choices" role="group" aria-label="Practice choices">
        ${Object.entries(MODES).map(([key, value]) => `
          <button class="choice" type="button" data-mode="${key}">${value.label}</button>`).join('')}
      </div>
      <button id="statistics-button" class="text-button secondary-action" type="button">Statistics</button>
    </section>`;
  bindStatistics();
  app.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => {
    answerFormat.set(button.dataset.format);
    app.querySelectorAll('[data-format]').forEach(option => option.setAttribute('aria-pressed', String(option.dataset.format === answerFormat.value)));
    const notice = app.querySelector('#format-notice');
    notice.textContent = answerFormat.notice;
    notice.hidden = !answerFormat.notice;
  }));
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
  round.answerFormat = answerFormat.value;
  question();
}

function backToChoices() {
  round = null;
  choices();
  app.querySelector('h1').focus();
}

function question() {
  renderHeader(MODES[mode].label, '', 'practice-title');
  document.querySelector('.site-footer')?.toggleAttribute('hidden', true);
  const [a, b] = round.deck[round.index];
  const multipleChoice = round.answerFormat === 'choice';
  const options = multipleChoice ? answerOptions(a, b) : [];
  app.innerHTML = `<section class="practice" aria-labelledby="practice-title">
    <p id="position">Question ${round.index + 1} of ${round.deck.length}</p>
    <progress id="round-progress" value="${round.answered}" max="${round.deck.length}" aria-label="Questions answered"></progress>
    <div class="question-card">
      <div class="question-prompt">
        <h2 class="equation" id="equation">${a} × ${b} <span>=</span> <strong id="equation-answer">?</strong></h2>
        <p id="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true"></p>
      </div>
      <form id="answer-form" novalidate>
        ${multipleChoice ? `<fieldset class="answer-options" aria-label="Answer options" aria-describedby="equation feedback">
          <div class="answer-grid">${options.map(value => `<button class="answer-option" type="button" data-answer="${value}"><span>${value}</span><span class="option-note" aria-hidden="true">&nbsp;</span></button>`).join('')}</div>
        </fieldset>` : `<div class="typed-answer-slot"><input id="answer" name="answer" aria-label="Your answer" type="number" inputmode="numeric" min="0" step="1" autocomplete="off" enterkeyhint="done" aria-describedby="equation feedback"></div>`}
        <div class="answer-actions ${multipleChoice ? 'choice-actions' : ''}"><button id="question-action" class="primary" type="${multipleChoice ? 'button' : 'submit'}" ${multipleChoice ? 'hidden' : ''}>${multipleChoice ? 'Next' : 'Check answer'}</button></div>
      </form>
    </div>
    ${mode === 'all' ? '<p class="round-note">You can stop whenever you like.</p>' : ''}
  </section>`;
  app.querySelector('#answer-form').addEventListener('submit', submit);
  const activeRound = round;
  const questionIndex = round.index;
  app.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    if (round !== activeRound || round.index !== questionIndex || round.checked) return;
    const result = scoreAnswer(button.dataset.answer);
    if (result.status !== 'checked') return;
    app.querySelector('.answer-grid').innerHTML = options.map(value => {
      const selected = value === Number(button.dataset.answer);
      const correct = value === a * b;
      return `<div class="answer-option" ${selected ? 'data-selected="true"' : ''} ${selected || correct ? `data-result="${correct ? 'correct' : 'incorrect'}"` : ''}><span>${value}</span><span class="option-note">${selected ? 'Chosen' : correct ? 'Correct' : '&nbsp;'}</span></div>`;
    }).join('');
    app.querySelector('#question-action').focus({ preventScroll: true });
  }));
  app.querySelector('#question-action').addEventListener('click', () => {
    // Submission handles the unchecked state; Next is an explicit button action.
    if (!round.checked) return;
    if (!nextQuestion(round)) return;
    if (round.index === round.deck.length) summary();
    else question();
  });
  app.querySelector(multipleChoice ? '[data-answer]' : '#answer').focus({ preventScroll: multipleChoice });
  if (multipleChoice) {
    const equation = app.querySelector('#equation');
    const bounds = equation.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) equation.scrollIntoView({ block: 'nearest' });
  }
}

function submit(event) {
  event.preventDefault();
  const input = app.querySelector('#answer');
  if (!input) return;
  const result = scoreAnswer(input.value);
  if (result.status !== 'checked') return;
  const action = app.querySelector('#question-action');
  const previousActions = action.parentElement;
  input.replaceWith(action);
  previousActions.remove();
  action.focus({ preventScroll: true });
}

function scoreAnswer(value) {
  const result = checkAnswer(round, value);
  if (result.status === 'locked') return result;
  const feedback = app.querySelector('#feedback');
  if (result.status === 'invalid') {
    feedback.textContent = 'Type a whole number, like 12.';
    const input = app.querySelector('#answer');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return result;
  }
  const action = app.querySelector('#question-action');
  action.type = 'button';
  action.hidden = false;
  action.innerHTML = 'Next <span aria-hidden="true">→</span>';
  feedback.textContent = result.correct ? `Correct! ${result.equation}.` : `The answer is ${result.equation}.`;
  const outcome = result.correct ? 'correct' : 'incorrect';
  app.querySelector('#equation-answer').textContent = String(Number(value));
  app.querySelector('.question-card').dataset.result = outcome;
  feedback.dataset.result = outcome;
  store.record(mode, result.table, result.correct, round.answerFormat);
  showStorageNotice();
  app.querySelector('#round-progress').value = round.answered;
  return result;
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
    ${statisticsGroup('By answer format', Object.entries(store.data.formats).map(([key, groups]) => [ANSWER_FORMATS[key], groups.overall]))}
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
  const id = `stats-${title.toLowerCase().replaceAll(' ', '-')}`;
  return `<section class="statistics-group" aria-labelledby="${id}"><h2 id="${id}">${title}</h2><ul class="statistics-list">${entries.map(([label, counts]) => `<li><h3>${label}</h3>${scoreMarkup(counts)}</li>`).join('')}</ul></section>`;
}

choices();
showStorageNotice();
