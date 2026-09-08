import { MODES, validChoice } from './core.js';

const app = document.querySelector('#app');
let mode = 'series';
let table = 4;

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
  app.innerHTML = `<section class="practice"><button id="back" class="text-button">← Back to choices</button>
    <h1 tabindex="-1">${MODES[mode].label}</h1><p>${selectionText()}</p></section>`;
  app.querySelector('#back').addEventListener('click', choices);
  app.querySelector('h1').focus();
}

choices();
