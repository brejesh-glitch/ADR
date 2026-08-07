const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');

let current = '0';
let previous = null;
let pendingOperator = null;

const OPERATOR_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function render() {
  resultEl.textContent = current;
  expressionEl.textContent = previous === null
    ? ''
    : `${previous} ${OPERATOR_SYMBOLS[pendingOperator]}`;
}

function inputDigit(digit) {
  current = current === '0' ? digit : current + digit;
}

function inputDecimal() {
  if (!current.includes('.')) {
    current += '.';
  }
}

function clearAll() {
  current = '0';
  previous = null;
  pendingOperator = null;
}

function backspace() {
  current = current.length > 1 ? current.slice(0, -1) : '0';
}

function toPercent() {
  current = String(parseFloat(current) / 100);
}

function compute(a, b, operator) {
  switch (operator) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function chooseOperator(operator) {
  if (pendingOperator !== null) {
    previous = compute(previous, parseFloat(current), pendingOperator);
    current = String(previous);
  } else {
    previous = parseFloat(current);
  }
  pendingOperator = operator;
  current = '0';
}

function equals() {
  if (pendingOperator === null) return;
  previous = compute(previous, parseFloat(current), pendingOperator);
  current = String(previous);
  pendingOperator = null;
  previous = null;
}

document.querySelector('.keys').addEventListener('click', (event) => {
  const button = event.target.closest('button.key');
  if (!button) return;

  const { action, value } = button.dataset;

  switch (action) {
    case 'digit':
      inputDigit(value);
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'clear':
      clearAll();
      break;
    case 'backspace':
      backspace();
      break;
    case 'percent':
      toPercent();
      break;
    case 'operator':
      chooseOperator(value);
      break;
    case 'equals':
      equals();
      break;
  }

  render();
});

render();
