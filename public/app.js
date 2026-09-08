import { MODES, validChoice, makeDeck, createRound, checkAnswer, nextQuestion } from './core.js';

const app = document.querySelector('#app');
let mode = 'series';
let table = 4;
let round;

function choices() {
  app.innerHTML = `
    <section aria-labelledby="choices-title">
      <div class="intro"><h1 id="choices-title" tabindex="-1">Get to know<br>your times tables.</h1>
      <p>A little practice, at your own pace.<br>Choose how you’d like to learn today.</p></div>
      <div class="choices" role="group" aria-label="Practice choices">
        ${Object.entries(MODES).map(([key, value], index) => `
          <button class="choice" type="button" data-mode="${key}" aria-pressed="${mode === key}">
            <span class="choice-number" aria-hidden="true">0${index + 1}</span>
            <span><strong>${value.label}</strong><span class="choice-description">${value.description}</span></span>
            <span class="choice-indicator" aria-hidden="true">${mode === key ? '✓' : '→'}</span>
          </button>`).join('')}
      </div>
      <div class="practice-setup">
        <fieldset id="table-picker" ${mode === 'all' ? 'hidden' : ''}>
          <legend>Which table?</legend>
          <div class="tables">${Array.from({ length: 9 }, (_, i) => i + 1).map(n => `
            <button type="button" data-table="${n}" aria-label="Table ${n}" aria-pressed="${table === n}">${n}</button>`).join('')}</div>
        </fieldset>
        <div class="start-row"><p id="selection">${selectionText()}</p><button id="start" class="primary" type="button">Start practice <span aria-hidden="true">→</span></button></div>
      </div>
    </section>`;
  app.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    choices();
    app.querySelector(`[data-mode="${mode}"]`).focus();
  }));
  app.querySelectorAll('[data-table]').forEach(button => button.addEventListener('click', () => {
    table = Number(button.dataset.table);
    choices();
    app.querySelector(`[data-table="${table}"]`).focus();
  }));
  app.querySelector('#start').addEventListener('click', start);
}

function selectionText() {
  return `${mode === 'all' ? 'All tables' : `Table ${table}`} · ${MODES[mode].detail}`;
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
    <div class="question-card">
      <h2 class="equation" id="equation">${a} × ${b} <span aria-hidden="true">= ?</span></h2>
      <form id="answer-form" novalidate>
        <label for="answer">Your answer</label>
        <input id="answer" name="answer" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" aria-describedby="equation feedback">
        <p id="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="answer-actions"><button id="check" class="primary" type="submit">Check answer</button><button id="next" type="button" disabled>Next <span aria-hidden="true">→</span></button></div>
      </form>
    </div>
  </section>`;
  app.querySelector('#back').addEventListener('click', backToChoices);
  app.querySelector('#answer-form').addEventListener('submit', submit);
  // A second tap on the now-disabled Next button must not steal answer focus.
  app.querySelector('#next').addEventListener('pointerdown', event => event.preventDefault());
  app.querySelector('#next').addEventListener('click', () => {
    if (!nextQuestion(round)) return;
    if (round.index === round.deck.length) {
      app.innerHTML = `<section class="practice"><h1 tabindex="-1">Round complete</h1><button id="back">Back to choices</button></section>`;
      app.querySelector('#back').addEventListener('click', backToChoices);
      app.querySelector('h1').focus();
    } else question();
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
}

choices();
