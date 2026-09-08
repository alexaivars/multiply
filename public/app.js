import { MODES, validChoice, makeDeck, createRound, checkAnswer, nextQuestion, successRate } from './core.js';
import { createStatisticsStore } from './statistics.js';

const app = document.querySelector('#app');
let mode = 'series';
let table = 4;
let round;
const store = createStatisticsStore();
const resetDialog = document.querySelector('#reset-dialog');
document.querySelector('#statistics-button').addEventListener('click', statisticsView);
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  backToChoices();
});
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
  app.innerHTML = `
    <section aria-labelledby="choices-title">
      <div class="intro"><h1 id="choices-title" tabindex="-1">Get to know<br>your times tables.</h1>
      <p>A little practice, at your own pace.<br>Choose how you’d like to learn today.</p></div>
      <div class="choices" role="group" aria-label="Practice choices">
        ${Object.entries(MODES).map(([key, value], index) => `
          <button class="choice" type="button" data-mode="${key}">
            <span class="choice-number" aria-hidden="true">0${index + 1}</span>
            <span><strong>${value.label}</strong><span class="choice-description">${value.description}</span></span>
            <span class="choice-indicator" aria-hidden="true">→</span>
          </button>`).join('')}
      </div>
    </section>`;
  app.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    if (mode === 'all') start();
    else tableChoice();
  }));
}

function tableChoice() {
  app.innerHTML = `<section class="practice" aria-labelledby="table-title">
    <button id="back" class="text-button" type="button">← Back to choices</button>
    <h1 id="table-title" tabindex="-1">Which table?</h1>
    <p>${MODES[mode].label} · ${MODES[mode].detail}</p>
    <div class="tables" role="group" aria-label="Choose a table">${Array.from({ length: 9 }, (_, i) => i + 1).map(n => `
      <button type="button" data-table="${n}" aria-label="Table ${n}">${n}</button>`).join('')}</div>
  </section>`;
  app.querySelector('#back').addEventListener('click', backToChoices);
  app.querySelectorAll('[data-table]').forEach(button => button.addEventListener('click', () => {
    table = Number(button.dataset.table);
    start();
  }));
  app.querySelector('h1').focus();
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
  const [a, b] = round.deck[round.index];
  app.innerHTML = `<section class="practice" aria-labelledby="practice-title">
    <button id="back" class="text-button" type="button">← Back to choices</button>
    <div class="practice-heading"><h1 id="practice-title">${MODES[mode].label}</h1><p>${mode === 'all' ? 'All tables' : `Table ${table}`}</p></div>
    <p id="position">Question ${round.index + 1} of ${round.deck.length}</p>
    <progress id="round-progress" value="${round.answered}" max="${round.deck.length}" aria-label="Questions answered"></progress>
    <div class="question-card">
      <h2 class="equation" id="equation">${a} × ${b} <span aria-hidden="true">= ?</span></h2>
      <form id="answer-form" novalidate>
        <label for="answer">Your answer</label>
        <input id="answer" name="answer" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" aria-describedby="equation feedback">
        <p id="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="answer-actions"><button id="check" class="primary" type="submit">Check answer</button><button id="next" type="button" disabled>Next <span aria-hidden="true">→</span></button></div>
      </form>
    </div>
    <div id="round-stats" aria-label="This round">${scoreMarkup(round)}</div>
    ${mode === 'all' ? '<p class="round-note">You can stop whenever you like. Every answer is practice.</p>' : ''}
  </section>`;
  app.querySelector('#back').addEventListener('click', backToChoices);
  app.querySelector('#answer-form').addEventListener('submit', submit);
  // A second tap on the now-disabled Next button must not steal answer focus.
  app.querySelector('#next').addEventListener('pointerdown', event => event.preventDefault());
  app.querySelector('#next').addEventListener('click', () => {
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
  app.querySelector('#check').disabled = true;
  app.querySelector('#next').disabled = false;
  feedback.textContent = result.correct ? `Correct! ${result.equation}. Nicely done.` : `Keep learning: ${result.equation}. You’ll get to practise it again.`;
  feedback.dataset.result = result.correct ? 'correct' : 'learn';
  store.record(mode, result.table, result.correct);
  showStorageNotice();
  app.querySelector('#round-stats').innerHTML = scoreMarkup(round);
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
  app.innerHTML = `<section class="practice summary" aria-labelledby="summary-title">
    <p class="summary-mode">${MODES[mode].label} · ${mode === 'all' ? 'All tables' : `Table ${table}`}</p>
    <h1 id="summary-title" tabindex="-1">Round complete</h1>
    <p>You made time to learn. That’s something to feel good about.</p>
    ${scoreMarkup(round)}
    <p>Every question helps you get to know your tables a little better.</p>
    <div class="answer-actions"><button id="again" class="primary" type="button">Practice again</button><button id="back" type="button">Back to choices</button></div>
  </section>`;
  app.querySelector('#again').addEventListener('click', start);
  app.querySelector('#back').addEventListener('click', backToChoices);
  app.querySelector('h1').focus();
}

function statisticsView() {
  round = null;
  app.innerHTML = `<section aria-labelledby="stats-title">
    <button id="back" class="text-button" type="button">← Back to choices</button>
    <h1 id="stats-title" tabindex="-1">Your practice so far.</h1>
    <p>Small steps add up. Here’s every answer you’ve checked.</p>
    <section aria-labelledby="overall-title"><h2 id="overall-title">All practice</h2>${scoreMarkup(store.data.overall)}</section>
    ${statisticsGroup('By table', Object.entries(store.data.tables).map(([key, counts]) => [`Table ${key}`, counts]))}
    ${statisticsGroup('By practice choice', Object.entries(store.data.modes).map(([key, counts]) => [MODES[key].label, counts]))}
    <div class="statistics-footer"><p>Success rate = correct answers ÷ answered questions × 100, rounded to a whole percent. Only your first answer counts.</p>
    <p>These statistics belong to this browser and device. They are not synced and may be lost if browser data is cleared.</p>
    <button id="reset" type="button">Reset statistics</button></div>
  </section>`;
  app.querySelector('#back').addEventListener('click', backToChoices);
  app.querySelector('#reset').addEventListener('click', () => {
    resetDialog.returnValue = '';
    resetDialog.showModal();
  });
  app.querySelector('h1').focus();
}

function statisticsGroup(title, entries) {
  return `<section class="statistics-group"><h2>${title}</h2><ul class="statistics-list">${entries.map(([label, counts]) => `<li><h3>${label}</h3>${scoreMarkup(counts)}</li>`).join('')}</ul></section>`;
}

choices();
showStorageNotice();
