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

    const data = await res.json().catch(() => ({}));

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

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setInlineError(errUsername, data.error || 'Registration error');
      return;
    }

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

  categoryList.innerHTML = '';
  show(placeholder);
  hide(questionsArea);
  placeholder.textContent = 'Select a Category to view its questions';

  currentCategoryId = null;
  currentCategoryName = '';
});

// ===== Dashboard: Categories + Questions + Answers =====
const categoryList = document.getElementById('categoryList');

const placeholder = document.getElementById('placeholder');
const questionsArea = document.getElementById('questionsArea');
const questionsTitle = document.getElementById('questionsTitle');
const questionsList = document.getElementById('questionsList');

// Post Question UI
const newQuestionTitle = document.getElementById('newQuestionTitle');
const newQuestionBody = document.getElementById('newQuestionBody');
const postQuestionBtn = document.getElementById('postQuestionBtn');
const postQuestionError = document.getElementById('postQuestionError');

// Keep track of selection
let currentCategoryId = null;
let currentCategoryName = '';

async function loadCategories() {
  categoryList.innerHTML = '';

  show(placeholder);
  hide(questionsArea);
  placeholder.textContent = 'Select a Category to view its questions';

  const res = await fetch(`${API_BASE}/categories`);
  const cats = await res.json().catch(() => []);

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
  currentCategoryId = categoryId;
  currentCategoryName = categoryName;

  show(placeholder);
  hide(questionsArea);
  placeholder.textContent = 'Loading questions...';

  try {
    const res = await fetch(`${API_BASE}/questions/${categoryId}`);
    const questions = await res.json().catch(() => []);

    questionsTitle.textContent = `${categoryName} — Questions`;
    questionsList.innerHTML = '';

    // Always show questionsArea so the Post Question form is usable even if empty
    hide(placeholder);
    show(questionsArea);

    if (!Array.isArray(questions) || questions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'placeholder';
      empty.textContent = 'No questions yet. Be the first to ask one.';
      questionsList.appendChild(empty);
      return;
    }

    for (const q of questions) {
      const card = document.createElement('div');
      card.className = 'qCard';

      card.innerHTML = `
        <h4 class="qTitle">${escapeHtml(q.title)}</h4>
        <div class="qMeta">By ${escapeHtml(q.username)} • ${escapeHtml(q.created_at)}</div>
        <p class="qBody">${escapeHtml(q.body)}</p>

        <div class="answerBlock">
          <div class="answerList" id="answerList-${q.id}"></div>

          <div class="answerForm">
            <textarea id="answerInput-${q.id}" placeholder="Write an answer"></textarea>
            <button data-qid="${q.id}" class="postAnswerBtn">Post Answer</button>
            <div id="answerErr-${q.id}" class="inlineError hidden"></div>
          </div>
        </div>
      `;

      questionsList.appendChild(card);
      await loadAnswersForQuestion(q.id);
    }
  } catch (err) {
    placeholder.textContent = 'Failed to load questions. Is the backend running?';
    show(placeholder);
    hide(questionsArea);
  }
}

async function loadAnswersForQuestion(questionId) {
  const list = document.getElementById(`answerList-${questionId}`);
  if (!list) return;

  list.innerHTML = '';

  const res = await fetch(`${API_BASE}/answers/${questionId}`);
  const answers = await res.json().catch(() => []);

  if (!Array.isArray(answers) || answers.length === 0) return;

  answers.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'answer';
    div.innerHTML = `
      <div class="answerMeta">By ${escapeHtml(a.username)} • ${escapeHtml(a.created_at)}</div>
      <div>${escapeHtml(a.body)}</div>
    `;
    list.appendChild(div);
  });
}

// Post Question handler (robust errors)
postQuestionBtn.addEventListener('click', async () => {
  hide(postQuestionError);
  postQuestionError.textContent = '';

  if (!currentUser || !currentUser.id) {
    postQuestionError.textContent = 'You must be logged in.';
    show(postQuestionError);
    return;
  }

  if (!currentCategoryId) {
    postQuestionError.textContent = 'Select a category first.';
    show(postQuestionError);
    return;
  }

  const title = newQuestionTitle.value.trim();
  const body = newQuestionBody.value.trim();

  if (!title || !body) {
    postQuestionError.textContent = 'Title and body are required.';
    show(postQuestionError);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        categoryId: currentCategoryId,
        userId: currentUser.id
      })
    });

    let data = {};
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      postQuestionError.textContent = (data && data.error)
        ? data.error
        : `Failed to post question (HTTP ${res.status})`;
      show(postQuestionError);
      return;
    }

    newQuestionTitle.value = '';
    newQuestionBody.value = '';
    await loadQuestionsForCategory(currentCategoryId, currentCategoryName);
  } catch (e) {
    postQuestionError.textContent = 'Network error. Is the backend running?';
    show(postQuestionError);
  }
});

// Post Answer handler (event delegation, robust errors)
document.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('postAnswerBtn')) return;

  if (!currentUser || !currentUser.id) return;

  const qid = Number(e.target.dataset.qid);
  const input = document.getElementById(`answerInput-${qid}`);
  const errEl = document.getElementById(`answerErr-${qid}`);

  hide(errEl);
  errEl.textContent = '';

  const body = input.value.trim();
  if (!body) {
    errEl.textContent = 'Answer is required.';
    show(errEl);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: qid, userId: currentUser.id, body })
    });

    let data = {};
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      errEl.textContent = (data && data.error)
        ? data.error
        : `Failed to post answer (HTTP ${res.status})`;
      show(errEl);
      return;
    }

    input.value = '';
    await loadAnswersForQuestion(qid);
  } catch {
    errEl.textContent = 'Network error.';
    show(errEl);
  }
});

// Start on login
setView('viewLogin');
setUserBar(null);
