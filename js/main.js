'use strict';

/* ===== Header shadow on scroll ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 10);
}, { passive: true });

/* ===== Mobile menu ===== */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.classList.contains('nav__link')) {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

/* ===== Reveal on scroll ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

/* ===== Calculator ===== */
const state = {
  room: 'Квартира',
  roomFactor: 1,
  area: 65,
  typeName: 'Поддерживающая',
  rate: 45,
  extras: [],
  discount: 0,
  periodName: 'Разовая уборка',
};

const MIN_PRICE = 2500;
const fmt = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';

const areaInput = document.getElementById('calcArea');
const areaValue = document.getElementById('calcAreaValue');
const summaryList = document.getElementById('calcSummaryList');
const discountRow = document.getElementById('calcDiscountRow');
const discountValue = document.getElementById('calcDiscountValue');
const totalEl = document.getElementById('calcTotal');
const orderSummary = document.getElementById('orderSummary');
const orderSummaryText = document.getElementById('orderSummaryText');

function basePrice() {
  return Math.max(state.area * state.rate * state.roomFactor, MIN_PRICE);
}

function recalc() {
  const base = basePrice();
  const extrasSum = state.extras.reduce((sum, ex) => sum + ex.price, 0);
  const subtotal = base + extrasSum;
  const discount = subtotal * state.discount;
  const total = subtotal - discount;

  let rows = `<li><span>${state.typeName} уборка</span><span></span></li>`;
  rows += `<li><span>${state.room}, ${state.area} м²</span><span>${fmt(base)}</span></li>`;
  state.extras.forEach((ex) => {
    rows += `<li><span>${ex.name}</span><span>${fmt(ex.price)}</span></li>`;
  });
  summaryList.innerHTML = rows;

  if (state.discount > 0) {
    discountRow.hidden = false;
    discountValue.textContent = '−' + fmt(discount);
  } else {
    discountRow.hidden = true;
  }

  totalEl.textContent = fmt(total);

  // сводка в форме заявки
  const extrasNames = state.extras.map((ex) => ex.name.toLowerCase()).join(', ');
  orderSummary.hidden = false;
  orderSummaryText.textContent =
    `${state.typeName} уборка, ${state.room.toLowerCase()}, ${state.area} м²` +
    (extrasNames ? ` + ${extrasNames}` : '') +
    ` (${state.periodName.toLowerCase()}) — ${fmt(total)}`;
}

/* слайдер площади */
function syncRange() {
  state.area = Number(areaInput.value);
  areaValue.textContent = state.area;
  const fill = ((state.area - areaInput.min) / (areaInput.max - areaInput.min)) * 100;
  areaInput.style.setProperty('--fill', fill + '%');
}
areaInput.addEventListener('input', () => { syncRange(); recalc(); });

/* сегменты (тип помещения, периодичность) */
function bindSegments(containerId, onSelect) {
  const container = document.getElementById(containerId);
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.calc__segment');
    if (!btn || btn.classList.contains('is-active')) return;
    container.querySelectorAll('.calc__segment').forEach((b) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');
    onSelect(btn);
    recalc();
  });
}

bindSegments('calcRoom', (btn) => {
  state.roomFactor = Number(btn.dataset.factor);
  state.room = btn.textContent.trim();
});

bindSegments('calcPeriod', (btn) => {
  state.discount = Number(btn.dataset.discount);
  state.periodName = state.discount > 0 ? 'Подписка' : 'Разовая уборка';
});

/* тип уборки */
const typeContainer = document.getElementById('calcType');
typeContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.calc__type');
  if (!btn || btn.classList.contains('is-active')) return;
  typeContainer.querySelectorAll('.calc__type').forEach((b) => {
    b.classList.remove('is-active');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed', 'true');
  state.rate = Number(btn.dataset.rate);
  state.typeName = btn.querySelector('strong').textContent.trim();
  recalc();
});

/* доп. услуги */
document.getElementById('calcExtras').addEventListener('change', (e) => {
  const input = e.target;
  if (input.type !== 'checkbox') return;
  const item = { name: input.dataset.name, price: Number(input.value) };
  if (input.checked) {
    state.extras.push(item);
  } else {
    state.extras = state.extras.filter((ex) => ex.name !== item.name);
  }
  recalc();
});

/* тарифы подписки: подставляем план в сводку формы */
document.querySelectorAll('[data-plan]').forEach((btn) => {
  btn.addEventListener('click', () => {
    orderSummary.hidden = false;
    orderSummaryText.textContent = `Подписка «${btn.dataset.plan}» — уточним детали по телефону`;
  });
});

/* ===== Маска телефона ===== */
const phoneInput = document.querySelector('input[name="phone"]');
phoneInput.addEventListener('input', () => {
  let d = phoneInput.value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  let out = '+7';
  if (d.length > 1) out += ' (' + d.slice(1, 4);
  if (d.length >= 4) out += ') ' + d.slice(4, 7);
  if (d.length >= 7) out += '-' + d.slice(7, 9);
  if (d.length >= 9) out += '-' + d.slice(9, 11);
  phoneInput.value = out;
});

/* ===== Форма заявки ===== */
const orderForm = document.getElementById('orderForm');
orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = orderForm.elements.name;
  const phone = orderForm.elements.phone;
  const nameOk = name.value.trim().length >= 2;
  const phoneOk = phone.value.replace(/\D/g, '').length === 11;

  name.classList.toggle('is-error', !nameOk);
  phone.classList.toggle('is-error', !phoneOk);
  if (!nameOk || !phoneOk) return;

  document.getElementById('orderSuccess').hidden = false;
});

/* первичный рендер */
syncRange();
recalc();
