/* ═══════════════════════════════════════════════════════════════
   SkillUp — связь с сервером.

   Приложение работает и без аккаунта: прогресс лежит в телефоне.
   Аккаунт нужен, чтобы переносить его между устройствами, поэтому
   авторизация здесь необязательная, а не навязанная.

   Сервер — свой, на том же VPS (Laravel + MariaDB), поэтому вход
   настоящий: пароль проверяется на сервере, в ответ приходит токен
   Sanctum, который хранится в телефоне.
   ═══════════════════════════════════════════════════════════════ */

const API = (location.origin || '') + '/api';
const AUTH_KEY = 'skillup.auth';

let auth = (() => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch (e) {
    return null;
  }
})();

const isOnline = () => !!navigator.onLine;
const loggedIn = () => !!(auth && auth.token);

function setAuth(data) {
  auth = data;
  try {
    if (data) localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    else localStorage.removeItem(AUTH_KEY);
  } catch (e) {
    /* приватный режим Safari — просто работаем без сохранения входа */
  }
}

/** Общий запрос: сам подставляет токен и разбирает ошибки сервера. */
async function req(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (loggedIn()) headers.Authorization = 'Bearer ' + auth.token;

  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Нет связи с сервером');
  }

  /* 401 значит, что токен протух — выходим из аккаунта, но прогресс
     в телефоне не трогаем */
  if (res.status === 401) {
    setAuth(null);
    throw new Error('Сессия истекла, войдите заново');
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    /* Laravel присылает ошибки валидации в errors, общее сообщение — в message */
    const err = data && data.errors ? Object.values(data.errors)[0] : null;
    const msg = (Array.isArray(err) ? err[0] : err)
      || (data && data.message)
      || 'Ошибка ' + res.status;
    const e = new Error(msg);
    /* статус нужен вызывающему коду: 409 — это конфликт версий,
       а не поломка, и обрабатывается иначе */
    e.status = res.status;
    throw e;
  }
  return data;
}

/* ─────────────── вход и регистрация ─────────────── */

async function apiRegister(name, email, password, password_confirmation) {
  const d = await req('/auth/register', {
    method: 'POST',
    body: { name, email, password, password_confirmation, device_name: 'SkillUp Web' },
  });
  setAuth({ token: d.token, user: d.user });
  /* сразу отправляем то, что успели наработать без аккаунта */
  const r = await syncNow({ pushLocal: true });
  setSyncState(r.error ? 'err' : 'ok');
  return d;
}

async function apiLogin(email, password) {
  const d = await req('/auth/login', {
    method: 'POST',
    body: { email, password, device_name: 'SkillUp Web' },
  });
  setAuth({ token: d.token, user: d.user });
  const r = await syncNow({ pushLocal: true });
  setSyncState(r.error ? 'err' : 'ok');
  return d;
}

async function apiLogout() {
  try {
    await req('/auth/logout', { method: 'POST' });
  } catch (e) {
    /* даже если сервер недоступен, выходим локально */
  }
  setAuth(null);
}

async function apiDeleteAccount() {
  /* сервер требует явного подтверждения, чтобы аккаунт нельзя было
     снести случайным запросом */
  await req('/skillup/account', { method: 'DELETE', body: { confirm: true } });
  setAuth(null);
}

/* ─────────────── синхронизация прогресса ─────────────── */

/**
 * Тело запроса к серверу.
 *
 * Сервер ждёт прогресс в обёртке `progress` и отдельно время правки
 * `client_updated_at` — по нему он понимает, чья версия свежее, если
 * занимались с двух устройств.
 */
function progressPayload() {
  return {
    progress: {
      xp: S.xp,
      streak: S.streak,
      bestStreak: S.bestStreak,
      freezes: S.freezes,
      lastActive: S.lastActive,
      gems: S.gems || 0,
      xpDays: S.xpDays || {},
      hearts: S.hearts,
      heartsAt: S.heartsAt || 0,
      chestDays: S.chestDays || {},
      cards: S.cards,
      lessons: S.lessons,
      days: S.days,
      quests: S.quests,
      achievements: S.achievements,
      stats: S.stats,
      skillsTouched: S.skillsTouched,
      minutes: S.minutes,
      perfectDays: S.perfectDays,
      touchDays: S.touchDays,
      settings: S.settings,
    },
    client_updated_at: new Date().toISOString(),
  };
}

/** Применить пришедший с сервера прогресс к локальному состоянию. */
function applyProgress(p) {
  if (!p) return;
  const fields = ['xp', 'streak', 'bestStreak', 'freezes', 'lastActive',
    'gems', 'xpDays', 'hearts', 'heartsAt', 'chestDays',
    'cards', 'lessons', 'days', 'quests', 'achievements', 'stats',
    'skillsTouched', 'minutes', 'perfectDays', 'touchDays', 'settings'];
  for (const f of fields) {
    if (p[f] === undefined || p[f] === null) continue;
    if (f === 'settings') {
      /* Сервер знает только свои ключи настроек (цель, напоминание).
         Если заменять объект целиком, потеряются локальные флаги
         onboarded/picked — и приложение снова покажет знакомство.
         Поэтому настройки объединяем, а не перезаписываем. */
      S.settings = Object.assign({}, S.settings, p[f]);
    } else {
      /* словари-карты обязаны быть объектами: сервер отдаёт пустой
         словарь как [], а в массиве строковые ключи теряются */
      const MAPS = ['cards', 'lessons', 'days', 'quests', 'achievements',
        'xpDays', 'minutes', 'perfectDays', 'touchDays', 'chestDays'];
      S[f] = MAPS.includes(f) && Array.isArray(p[f]) ? {} : p[f];
    }
  }
  save();
}

/**
 * Синхронизация.
 *
 * @param {{pushLocal?: boolean}} opts при первом входе отправляем
 *        локальный прогресс, чтобы он не потерялся
 */
async function syncNow({ pushLocal = false } = {}) {
  if (!loggedIn() || !isOnline()) return { skipped: true };

  try {
    if (pushLocal) {
      /* сервер сам объединит наш прогресс с тем, что уже лежит в аккаунте */
      const d = await req('/skillup/merge', { method: 'POST', body: progressPayload() });
      applyProgress(d.progress);
    } else {
      const d = await req('/skillup/progress');
      if (d && d.progress) {
        applyProgress(d.progress);
      } else {
        /* в аккаунте ещё пусто — заливаем то, что наработали */
        const w = await req('/skillup/progress', { method: 'PUT', body: progressPayload() });
        if (w && w.progress) applyProgress(w.progress);
      }
    }
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

/** Отправка на сервер с задержкой: не дёргаем сеть на каждый ответ. */
let pushTimer = null;
function scheduleSync() {
  if (!loggedIn()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    setSyncState('wait');
    /* 409 значит, что на другом устройстве прогресс ушёл дальше —
       тогда не затираем его, а забираем серверную версию */
    try {
      const w = await req('/skillup/progress', { method: 'PUT', body: progressPayload() });
      if (w && w.progress) applyProgress(w.progress);
      setSyncState('ok');
      /* ВАЖНО: render() здесь НЕ вызываем. Раньше он перерисовывал весь
         экран через 2,5 секунды после каждого ответа — пользователь в
         этот момент уже читал следующую карточку, и экран дёргался. */
    } catch (e) {
      if (e.status === 409 || /конфликт|устарел/i.test(e.message)) {
        await syncNow();
        setSyncState('ok');
      } else {
        setSyncState('err');
      }
    }
  }, 2500);
}

function setSyncState(state) {
  const el = document.querySelector('.synced');
  if (!el) return;
  el.textContent = { ok: 'Сохранено в аккаунт', err: 'Не удалось сохранить', wait: 'Сохранение…' }[state] || '';
  el.className = 'synced synced--' + state;
}

/* Состояние связи показываем в профиле */
window.addEventListener('online', () => setSyncState('wait'));
window.addEventListener('offline', () => setSyncState('err'));
