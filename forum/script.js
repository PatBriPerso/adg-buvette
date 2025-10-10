// script.js

let CONFIG = null;
let currentValues = {};

function currencyFmt(n) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

async function loadConfig() {
  const res = await fetch('config.json');
  CONFIG = await res.json();
}

function initDefaults() {
  (CONFIG.options || []).forEach(opt => {
    if (opt.type === 'checkbox') {
      currentValues[opt.id] = (opt.default === true);
    } else if (typeof opt.default !== 'undefined') {
      currentValues[opt.id] = opt.default;
    } else {
      // fallback
      if (opt.type === 'select') currentValues[opt.id] = opt.values && opt.values[0];
      else currentValues[opt.id] = '';
    }
  });
}

function evaluateCondition(cond) {
  const val = currentValues[cond.option];
  return val === cond.value;
}

function evaluateConditionsList(list) {
  if (!list || list.length === 0) return true;
  // All conditions in the list must match (AND)
  return list.every(evaluateCondition);
}

function shouldShowOption(option) {
  if (!option.visibleWhen) return true;
  // visibleWhen is array — option is visible if any of the conditions arrays match OR if all?
  // In our config we treat visibleWhen as OR of entries: visible if any entry's single condition is met.
  // But typical pattern: visibleWhen: [{option:x,value:y}, ...] -> visible if ANY matches
  // We'll implement: visible if ANY of the visibleWhen entries is true. If you need AND, extend config.
  return option.visibleWhen.some(evaluateCondition);
}

function createInputForOption(opt) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-3';
  wrapper.dataset.optionId = opt.id;

  const label = document.createElement('label');
  label.className = 'form-label';
  label.textContent = opt.label || opt.id;

  wrapper.appendChild(label);

  if (opt.type === 'select') {
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = 'opt-' + opt.id;

    (opt.values || []).forEach(v => {
      const el = document.createElement('option');
      el.value = v;
      el.textContent = v;
      select.appendChild(el);
    });

    select.value = currentValues[opt.id] ?? select.value;
    select.addEventListener('change', (e) => {
      currentValues[opt.id] = e.target.value;
      onChange();
    });
    wrapper.appendChild(select);

  } else if (opt.type === 'checkbox') {
    const div = document.createElement('div');
    div.className = 'form-check';
    const input = document.createElement('input');
    input.className = 'form-check-input';
    input.type = 'checkbox';
    input.id = 'opt-' + opt.id;
    input.checked = !!currentValues[opt.id];
    input.addEventListener('change', (e) => {
      currentValues[opt.id] = e.target.checked;
      onChange();
    });
    const lbl = document.createElement('label');
    lbl.className = 'form-check-label';
    lbl.htmlFor = input.id;
    lbl.textContent = opt.label || opt.id;
    div.appendChild(input);
    div.appendChild(lbl);
    wrapper.innerHTML = '';
    wrapper.appendChild(div);
  } else if (opt.type === 'text') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.placeholder = opt.placeholder || '';
    input.value = currentValues[opt.id] || '';
    input.addEventListener('input', (e) => {
      currentValues[opt.id] = e.target.value;
      onChange();
    });
    wrapper.appendChild(input);
  } else {
    // fallback: text
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.value = currentValues[opt.id] || '';
    input.addEventListener('input', (e) => {
      currentValues[opt.id] = e.target.value;
      onChange();
    });
    wrapper.appendChild(input);
  }

  return wrapper;
}

function renderForm() {
  const form = document.getElementById('config-form');
  form.innerHTML = '';

  (CONFIG.options || []).forEach(opt => {
    const node = createInputForOption(opt);
    // initial visibility
    if (!shouldShowOption(opt)) {
      node.style.display = 'none';
    }
    form.appendChild(node);
  });
}

function findArticleById(id) {
  return (CONFIG.articles || []).find(a => a.id === id);
}

function runRules() {
  const selectedArticles = new Set();

  (CONFIG.rules || []).forEach(rule => {
    // special strategy example: if rule.strategy == 'base', use mapping keyed by variant
    if (rule.strategy === 'base') {
      // we expect rule.add to be an object mapping product_variant -> [ids]
      const varId = currentValues['product_variant'];
      if (rule.add && rule.add[varId]) {
        rule.add[varId].forEach(a => selectedArticles.add(a));
      }
      return;
    }

    // Normal rule: check conditions AND (all true -> apply)
    const ok = evaluateConditionsList(rule.conditions || []);
    if (ok) {
      (rule.add || []).forEach(a => selectedArticles.add(a));
    }
  });

  return Array.from(selectedArticles);
}

function renderArticles(list) {
  const ul = document.getElementById('articles-list');
  ul.innerHTML = '';
  let total = 0;

  list.forEach(id => {
    const art = findArticleById(id);
    if (!art) return;
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `<div>${art.label}</div><div>${currencyFmt(art.price)}</div>`;
    ul.appendChild(li);
    total += Number(art.price || 0);
  });

  document.getElementById('total-amount').textContent = currencyFmt(total);
}

function updateVisibility() {
  (CONFIG.options || []).forEach(opt => {
    const node = document.querySelector(`[data-option-id=\"${opt.id}\"]`);
    if (!node) return;
    const visible = shouldShowOption(opt);
    node.style.display = visible ? '' : 'none';
    // if hidden, optionally clear its value from currentValues? We keep the value but it won't affect rules
  });
}

function onChange() {
  updateVisibility();
  const articles = runRules();
  renderArticles(articles);

  // debug
  const db = document.getElementById('values-debug');
  if (db) db.textContent = JSON.stringify(currentValues, null, 2);
}

function resetForm() {
  initDefaults();
  renderForm();
  onChange();
}

async function main() {
  await loadConfig();
  initDefaults();
  renderForm();
  onChange();

  document.getElementById('reset-btn').addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });

  document.getElementById('toggle-debug').addEventListener('click', (e) => {
    e.preventDefault();
    const dbg = document.getElementById('debug');
    dbg.style.display = dbg.style.display === 'none' ? '' : 'none';
  });
}

main().catch(err => {
  console.error(err);
  alert('Erreur lors du chargement du config.json — vérifie que tu serres les fichiers via HTTP (ex: npx serve .)');
});
