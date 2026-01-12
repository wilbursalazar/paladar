// ===== Config =====
const API_BASE = 'http://localhost:3000';

// ===== Helpers =====
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function setView(viewId) {
  hide(document.getElementById('viewLogin'));
  hide(document.getElementById('viewRegister'));
  hide(document.getElementById('viewDashboard'));
  show(document.getElementById(viewId));
}

function setUserBar(user) {
  const userBar = document.getElementById('userBar');
  const usernameLabel = document.getElementById('usernameLabel');

  if (user) {
    usernameLabel.textContent = `Logged in as: ${user.username}`;
    show(userBar);
  } else {
    hide(userBar);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ===== State =====
let currentUser = null;

// ===== Login =====
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

loginBtn.addEventListener('click', async () => {
  hide(loginError);
  loginError.textContent = '';

  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || 'Invalid login';
      show(loginError);
      return;
    }

    currentUser = data.user;
    setUserBar(currentUser);
    setView('viewDashboard');
    await loadCategories();
  } catch (e) {
    loginError.textContent = 'Network error. Is the backend running?';
    show(loginError);
  }
});

// ===== Register (validation rules + errors disappear on change) =====
const regUsername = document.getElementById('regUsername');
const regPassword = document.getElementById('regPassword');
const regTerms = document.getElementById('regTerms');

const errUsername = document.getElementById('errUsername');
const errPassword = document.getElementById('errPassword');
const errTerms = document.getElementById('errTerms');
const termsWrap = document.getElementById('termsWrap');

function clearInlineError(spanEl) {
  spanEl.textContent = '';
  hide(spanEl);
}

function setInlineError(spanEl, msg) {
  spanEl.textContent = msg;
  show(spanEl);
}

function validateRegisterForm() {
  let ok = true;

  const u = regUsername.value.trim();
  const p = regPassword.value;

  if (u.length < 3) {
    setInlineError(errUsername, 'Min 3 characters');
    ok = false;
  } else {
    clearInlineError(errUsername);
  }

  if (p.length < 6) {
    setInlineError(errPassword, 'Min 6 characters');
    ok = false;
  } else {
    clearInlineError(errPassword);
  }

  if (!regTerms.checked) {
    setInlineError(errTerms, 'Required');
    termsWrap.classList.add('invalid');
    ok = false;
  } else {
    clearInlineError(errTerms);
    termsWrap.classList.remove('invalid');
  }

  return ok;
}

// Each error disappears once the value changes
regUsername.addEventListener('input', () => clearInlineError(errUsername));
regPassword.addEventListener('input', () => clearInlineError(errPassword));
regTerms.addEventListener('change', () => {
  clearInlineError(errTerms);
  termsWrap.classList.remove('invalid');
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const valid = validateRegisterForm();
  if (!valid) return;

  const username = regUsername.value.trim();
  const password = regPassword.value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setInlineError(errUsername, data.error || 'Registration error');
      return;
    }

    // After register, go back to login with fields prefilled
    loginUsername.value = username;
    loginPassword.value = '';
    regPassword.value = '';
    regTerms.checked = false;
    setView('viewLogin');
  } catch (e) {
    setInlineError(errUsername, 'Network error. Is the backend running?');
  }
});

// ===== Navigation links =====
document.getElementById('goRegister').addEventListener('click', (e) => {
  e.preventDefault();
  hide(loginError);
  setView('viewRegister');
});

document.getElementById('goLogin').addEventListener('click', (e) => {
  e.preventDefault();
  setView('viewLogin');
});

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  currentUser = null;
  setUserBar(null);
  setView('viewLogin');

  // reset dashboard UI
  categoryList.innerHTML = '';
  show(placeholder);
  hide(questionsArea);
  placeholder.textContent = 'Select a Category to view its questions';
});

// ===== Dashboard: Categories =====
const categoryList = document.getElementById('categoryList');

const placeholder = document.getElementById('placeholder');
const questionsArea = document.getElementById('questionsArea');
const questionsTitle = document.getElementById('questionsTitle');
const questionsList = document.getElementById('questionsList');

async function loadCategories() {
  categoryList.innerHTML = '';

  // reset main panel
  show(placeholder);
  hide(questionsArea);
  placeholder.textContent = 'Select a Category to view its questions';

  const res = await fetch(`${API_BASE}/categories`);
  const cats = await res.json();

  cats.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'catItem';
    div.textContent = c.name;
    div.dataset.id = c.id;

    div.addEventListener('click', async () => {
      document.querySelectorAll('.catItem').forEach(x => x.classList.remove('active'));
      div.classList.add('active');

      await loadQuestionsForCategory(c.id, c.name);
    });

    categoryList.appendChild(div);
  });
}

async function loadQuestionsForCategory(categoryId, categoryName) {
  show(placeholder);
  hide(questionsArea);
  placeholder.textContent = 'Loading questions...';

  try {
    const res = await fetch(`${API_BASE}/questions/${categoryId}`);
    const questions = await res.json();

    questionsTitle.textContent = `${categoryName} — Questions`;
    questionsList.innerHTML = '';

    if (!Array.isArray(questions) || questions.length === 0) {
      placeholder.textContent = 'No questions yet.';
      show(placeholder);
      hide(questionsArea);
      return;
    }

    questions.forEach((q) => {
      const card = document.createElement('div');
      card.className = 'qCard';
      card.innerHTML = `
        <h4 class="qTitle">${escapeHtml(q.title)}</h4>
        <div class="qMeta">By ${escapeHtml(q.username)} • ${escapeHtml(q.created_at)}</div>
        <p class="qBody">${escapeHtml(q.body)}</p>
      `;
      questionsList.appendChild(card);
    });

    hide(placeholder);
    show(questionsArea);
  } catch (err) {
    placeholder.textContent = 'Failed to load questions. Is the backend running?';
    show(placeholder);
    hide(questionsArea);
  }
}

// Start on login
setView('viewLogin');
setUserBar(null);
