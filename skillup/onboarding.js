/* ═══════════════════════════════════════════════════════════════
   SkillUp — знакомство и вход.

   Знакомство показывается один раз при первом запуске и состоит из
   четырёх шагов: приветствие, как это работает, цель на день и выбор
   навыков. На каждом шаге можно пропустить — тогда приложение
   откроется сразу, а знакомство можно будет пройти позже из профиля.
   ═══════════════════════════════════════════════════════════════ */

let obStep = 0;
let obGoal = 20;
let obPicked = [];

/* ─────────────── знакомство ─────────────── */

function screenOnboarding() {
  const steps = ['welcome', 'how', 'goal', 'skills'];
  const cur = steps[obStep];

  /* полоска прогресса знакомства */
  const dots = steps.map((_, i) => `<i class="ob__dot ${i <= obStep ? 'is-on' : ''}"></i>`).join('');

  if (cur === 'welcome') {
    return `<div class="ob">
      <div class="ob__steps">${dots}</div>
      <div class="ob__logo">
        <div class="ob__mark">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3l5.2 5.6h-2.4V19H9.2V8.6H6.8z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="ob__title">SkillUp</h1>
      </div>
      <p class="ob__lead">Развивайте навыки короткими уроками.<br>По 5 минут в день — и через месяц заметите разницу.</p>
      <div class="ob__feats">
        <div class="ob__feat"><b>60</b><span>карточек</span></div>
        <div class="ob__feat"><b>4</b><span>навыка</span></div>
        <div class="ob__feat"><b>15</b><span>наград</span></div>
      </div>
      <button class="btn btn--primary" id="ob-next">Начать</button>
      <button class="btn btn--quiet" id="ob-skip">Пропустить знакомство</button>
      <p class="ob__note">Знакомство можно пройти позже в профиле</p>
    </div>`;
  }

  if (cur === 'how') {
    const cards = [
      ['📘', 'Короткие уроки', 'Теория на 3–5 минут, сразу за ней — карточки для закрепления'],
      ['🔁', 'Умное повторение', 'Карточки возвращаются ровно тогда, когда вы готовы их забыть'],
      ['📈', 'Видимый прогресс', 'Опыт, уровни, серия дней и карта развития навыков'],
    ];
    return `<div class="ob">
      <div class="ob__steps">${dots}</div>
      <h1 class="ob__h">Как это работает</h1>
      <p class="ob__lead2">Три вещи, на которых держится SkillUp</p>
      <div class="ob__cards">
        ${cards.map((c, i) => `<div class="ob__card" style="animation-delay:${i * 90}ms">
          <span class="ob__ico">${c[0]}</span>
          <b>${c[1]}</b>
          <span>${c[2]}</span>
        </div>`).join('')}
      </div>
      <button class="btn btn--primary" id="ob-next">Дальше</button>
      <button class="btn btn--quiet" id="ob-back">Назад</button>
    </div>`;
  }

  if (cur === 'goal') {
    const opts = [
      [5, 'Спокойно', '5 карточек в день'],
      [10, 'Обычно', '10 карточек в день'],
      [20, 'Серьёзно', '20 карточек в день'],
      [40, 'Интенсивно', '40 карточек в день'],
    ];
    return `<div class="ob">
      <div class="ob__steps">${dots}</div>
      <h1 class="ob__h">Цель на день</h1>
      <p class="ob__lead2">Сколько карточек готовы проходить ежедневно? Цель всегда можно изменить.</p>
      <div class="ob__opts">
        ${opts.map(([v, name, sub]) => `<button class="ob__opt ${obGoal === v ? 'is-on' : ''}" data-goal="${v}">
          <b>${name}</b><span>${sub}</span>
        </button>`).join('')}
      </div>
      <button class="btn btn--primary" id="ob-next">Дальше</button>
      <button class="btn btn--quiet" id="ob-back">Назад</button>
    </div>`;
  }

  /* выбор навыков */
  const all = obPicked.length === 0;
  return `<div class="ob">
    <div class="ob__steps">${dots}</div>
    <h1 class="ob__h">Что интересно?</h1>
    <p class="ob__lead2">Отметьте навыки, которые хотите развивать. Можно выбрать несколько или все.</p>
    <div class="ob__skills">
      ${SKILLS.map((s) => `<button class="ob__skill ${obPicked.includes(s.id) ? 'is-on' : ''}"
          data-pick="${s.id}" style="--c:${s.color}">
        <span class="ob__sico" style="background:${s.color}22;color:${s.color}">${s.icon}</span>
        <span class="ob__sname">${esc(s.name)}</span>
        <span class="ob__scheck">${obPicked.includes(s.id) ? '✓' : ''}</span>
      </button>`).join('')}
    </div>
    <button class="btn btn--primary" id="ob-done">
      ${obPicked.length === 0 ? 'Начать со всех навыков' : `Поехали · выбрано ${obPicked.length}`}
    </button>
    <button class="btn btn--quiet" id="ob-back">Назад</button>
  </div>`;
}

function bindOnboarding() {
  const on = (sel, fn) => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener('click', fn);
  };

  on('#ob-next', () => { obStep = Math.min(3, obStep + 1); render(); });
  on('#ob-back', () => { obStep = Math.max(0, obStep - 1); render(); });
  on('#ob-skip', finishOnboarding);
  on('#ob-done', finishOnboarding);

  document.querySelectorAll('[data-goal]').forEach((b) => {
    b.addEventListener('click', () => { obGoal = Number(b.dataset.goal); render(); });
  });

  document.querySelectorAll('[data-pick]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.pick;
      obPicked = obPicked.includes(id) ? obPicked.filter((x) => x !== id) : [...obPicked, id];
      render();
    });
  });
}

function finishOnboarding() {
  S.settings.goal = obGoal;
  /* если ничего не выбрали — берём все навыки, иначе приложение
     выглядело бы пустым */
  S.settings.picked = obPicked.length ? obPicked : SKILLS.map((s) => s.id);
  S.settings.onboarded = true;
  save();
  obStep = 0;
  tab = 'today';
  toast('Добро пожаловать в SkillUp!', 'level');
  render();
}

/* ─────────────── вход и регистрация ─────────────── */

let authMode = 'login';
let authBusy = false;
let authError = '';

function screenAuth() {
  const isLogin = authMode === 'login';
  return `<div class="ob">
    <h1 class="ob__h" style="margin-top:18px">${isLogin ? 'Вход' : 'Регистрация'}</h1>
    <p class="ob__lead2">${isLogin
      ? 'Аккаунт обязателен: без него карточки и уроки недоступны.'
      : 'Создайте аккаунт, чтобы учиться. Прогресс хранится на сервере и переносится между устройствами.'}</p>

    <div class="card card--pad">
      ${isLogin ? '' : `<label class="fld"><span>Имя</span>
        <input id="au-name" type="text" autocomplete="name" placeholder="Как вас зовут"></label>`}
      <label class="fld"><span>E-mail</span>
        <input id="au-email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com"></label>
      <label class="fld"><span>Пароль</span>
        <input id="au-pass" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="Минимум 8 символов"></label>
      ${isLogin ? '' : `<label class="fld"><span>Повторите пароль</span>
        <input id="au-pass2" type="password" autocomplete="new-password" placeholder="Ещё раз"></label>`}

      ${authError ? `<div class="fld__err">${esc(authError)}</div>` : ''}

      <button class="btn btn--primary" id="au-go" ${authBusy ? 'disabled' : ''}>
        ${authBusy ? 'Подождите…' : (isLogin ? 'Войти' : 'Создать аккаунт')}
      </button>
      <button class="btn btn--quiet" id="au-switch">
        ${isLogin ? 'Нет аккаунта — зарегистрироваться' : 'Уже есть аккаунт — войти'}
      </button>
    </div>

    <div class="card card--pad auth-note">
      <b>Про вход через Google и Apple</b>
      <p>Он требует ключей OAuth, которые выдаёт Google и Apple только владельцу
      приложения. Пока ключей нет, кнопки не показываю — чтобы не делать вид,
      что вход работает. Вход по e-mail и паролю — настоящий.</p>
    </div>
  </div>`;
}

function bindAuth() {
  const on = (sel, fn) => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener('click', fn);
  };

  on('#auth-back', () => { authError = ''; render(); });
  on('#au-switch', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    authError = '';
    render();
  });
  on('#au-go', doAuth);
}

async function doAuth() {
  const email = (document.getElementById('au-email')?.value || '').trim();
  const pass = document.getElementById('au-pass')?.value || '';
  const name = document.getElementById('au-name')?.value.trim() || '';
  const pass2 = document.getElementById('au-pass2')?.value || '';

  authError = '';
  if (!email || !email.includes('@')) { authError = 'Укажите корректный e-mail'; return render(); }
  if (pass.length < 8) { authError = 'Пароль должен быть не короче 8 символов'; return render(); }
  if (authMode === 'register' && !name) { authError = 'Укажите имя'; return render(); }
  if (authMode === 'register' && pass !== pass2) { authError = 'Пароли не совпадают'; return render(); }

  authBusy = true;
  render();

  try {
    const out = authMode === 'login'
      ? await apiLogin(email, pass)
      : await apiRegister(name, email, pass, pass2);
    authBusy = false;
    authError = '';
    screen = null;
    tab = 'today';
    toast(authMode === 'login' ? 'Вы вошли' : 'Аккаунт создан', 'quest');
    render();
    /* статус синхронизации виден в профиле */
    setSyncState('ok');
  } catch (e) {
    authBusy = false;
    authError = e.message || 'Не удалось выполнить запрос';
    render();
  }
}
