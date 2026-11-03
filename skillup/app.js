/* ═══════════════════════════════════════════════════════════════
   SkillUp — интерфейс.

   Экраны переключаются вручную, без библиотек: состояние экрана в
   переменной, отрисовка — обычные функции, создающие разметку.
   ═══════════════════════════════════════════════════════════════ */

const app = document.getElementById('app');
let tab = 'today';
let session = null;      // текущее занятие
let lessonView = null;   // открытый урок
let screen = null;       // отдельный экран: 'auth' или null

/* ─────────────── уведомления ─────────────── */

function toast(text, kind) {
  const box = document.createElement('div');
  box.className = 'toast toast--' + (kind || 'info');
  box.textContent = text;
  document.getElementById('toasts').appendChild(box);
  setTimeout(() => box.classList.add('out'), 2400);
  setTimeout(() => box.remove(), 3000);
}

/* ─────────────── вспомогательное ─────────────── */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function progressRing(percent, size, stroke, color) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
      transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)"/>
  </svg>`;
}

/* ─────────────── экран «Сегодня» ─────────────── */

function screenToday() {
  const lv = levelInfo(S.xp);
  /* повторение — только выученные карточки, у которых подошёл срок.
     Новые карточки попадают сюда лишь через уроки. */
  const due = dueCards();
  const goal = S.settings.goal;
  const done = S.days[today()] || 0;
  const percent = Math.min(100, Math.round((done / goal) * 100));
  const quests = questsToday();
  const queue = due.length;
  const initial = loggedIn() && auth.user && auth.user.name
    ? auth.user.name.trim()[0].toUpperCase() : '☺';

  const questRows = quests.list.map((q) => {
    const def = QUESTS.find((x) => x.id === q.id);
    const text = def.text.replace('{n}', q.need);
    const pct = Math.min(100, Math.round((q.progress / q.need) * 100));
    return `<div class="quest ${q.done ? 'is-done' : ''}">
      <div class="quest__ico">${q.done ? '✓' : '○'}</div>
      <div class="quest__body">
        <div class="quest__text">${esc(text)}</div>
        <div class="quest__bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="quest__xp">+${def.xp}</div>
    </div>`;
  }).join('');

  return `
  <div class="topbar">
    <div class="topbar__brand">⚡ Skill<span>Up</span></div>
    <div class="topbar__right">
      <span class="topbar__gems" title="Гемы — валюта приложения">💎 ${S.gems || 0}</span>
      <button class="topbar__me" id="to-me" aria-label="Профиль">${esc(initial)}</button>
    </div>
  </div>

  <div class="hero">
    <div class="hero__top">
      <div>
        <div class="hero__hi">Сегодня</div>
        <div class="hero__streak">
          <span class="flame">🔥</span>
          <b>${S.streak}</b> ${plural(S.streak, 'день', 'дня', 'дней')} подряд
          ${S.freezes > 0 ? `<span class="freeze" title="Заморозка сохранит серию при пропуске">❄ ${S.freezes}</span>` : ''}
        </div>
        <div class="hero__hearts" title="Сердечки: ошибка — минус одно, вернётся через 30 минут">
          ${'❤️'.repeat(Math.max(0, heartsNow()))}
        </div>
      </div>
      <div class="lvl">
        ${progressRing(lv.percent, 74, 6, '#a78bfa')}
        <div class="lvl__in">
          <b>${lv.level}</b>
          <span>уровень</span>
        </div>
      </div>
    </div>
    <div class="hero__xp">${lv.into} / ${lv.need} XP до следующего уровня</div>
    <div class="hero__grow" title="Визуальный прогресс: растение растёт с уровнем">
      <span class="hero__grow-ico">${plantStage()[0]}</span>
      <span>${plantStage()[1]} · уровень ${lv.level}</span>
    </div>
  </div>

  <div class="card card--goal">
    <div class="goal">
      ${progressRing(percent, 120, 9, percent >= 100 ? '#4ade80' : '#a78bfa')}
      <div class="goal__in">
        <b>${done}</b>
        <span>из ${goal}</span>
      </div>
    </div>
    <div class="goal__text">
      <div class="goal__title">${percent >= 100 ? 'Цель дня выполнена!' : 'Цель на сегодня'}</div>
      <div class="goal__sub">${percent >= 100
        ? 'Отличная работа. Можно продолжить или отдохнуть.'
        : `Осталось ${goal - done} ${plural(goal - done, 'ответ', 'ответа', 'ответов')}`}</div>
      <button class="btn btn--primary" id="start">
        ${queue > 0 ? `Повторить · ${queue} ${plural(queue, 'карточка', 'карточки', 'карточек')}` : 'Всё повторено — начните урок'}
      </button>
    </div>
  </div>

  <button class="card--mapbtn" id="to-map">
    <span class="mapbtn__ico">⌘</span>
    <span class="mapbtn__body">
      <b>Карта развития</b>
      <i>Уроки открываются по очереди — смотрите, что дальше</i>
    </span>
    <span class="mapbtn__go">›</span>
  </button>

  <button class="card--mapbtn" id="to-focus">
    <span class="mapbtn__ico">⏱</span>
    <span class="mapbtn__body">
      <b>Режим фокусировки</b>
      <i>Таймер без отвлечений — за сессию опыт и активный день</i>
    </span>
    <span class="mapbtn__go">›</span>
  </button>

  <h2 class="sect">Задания на день</h2>
  <div class="card card--pad">${questRows}</div>

  ${isMonday() ? `<h2 class="sect">Итоги прошлой недели</h2>
  <div class="card card--pad">
    ${weekCard()}
  </div>` : ''}

  <h2 class="sect">Продолжить обучение</h2>
  <div class="skills-mini">
    ${pickedSkills().map((s) => {
      const p = skillProgress(s);
      return `<button class="mini" data-skill="${s.id}">
        <span class="mini__ico" style="background:${s.color}22;color:${s.color}">${s.icon}</span>
        <span class="mini__name">${esc(s.name)}</span>
        <span class="mini__bar"><i style="width:${p.percent}%;background:${s.color}"></i></span>
      </button>`;
    }).join('')}
  </div>

  <h2 class="sect">Как это работает</h2>
  <div class="card card--pad muted-note">
    Карточки возвращаются по алгоритму интервального повторения: то, что вы
    помните хорошо, показывается всё реже, а трудное — чаще. Это работает
    не «потому что надо», а по математике: интервал умножается на
    коэффициент лёгкости каждой карточки.
  </div>`;
}

const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

/* Растение на «Сегодня» растёт вместе с уровнем */
const PLANT_STAGES = [
  ['🌱', 'росток'], ['🌿', 'побеги'], ['🪴', 'растение'],
  ['🌳', 'дерево'], ['🌲', 'лес'], ['🏆', 'вершина'],
];
const plantStage = () => PLANT_STAGES[Math.min(5, Math.floor(levelInfo(S.xp).level / 2))];

const isMonday = () => new Date().getDay() === 1;

function weekCard() {
  const w = lastWeekSummary();
  const items = [
    [w.answers, 'ответов'], [w.minutes, 'минут'], [w.lessons, 'уроков'],
  ];
  return `<div class="wk-sum">${items.map(([v, l]) => `
    <div class="wk-sum__i"><b>${v}</b><span>${l}</span></div>`).join('')}
  </div>
  <p class="wk-sum__res">${w.answers === 0
    ? 'На прошлой неделе было тихо — начните новую с одной карточки.'
    : 'Хорошая неделя. Продолжайте в том же духе!'}</p>`;
}

/* ─────────────── экран «Навыки» ─────────────── */

function screenSkills() {
  return `<h1 class="h1">Навыки</h1>
  <p class="lead">Четыре направления. Внутри каждого — короткие уроки по 3–5 минут.</p>
  ${SKILLS.map((s) => {
    const p = skillProgress(s);
    return `<div class="card card--skill" style="--accent:${s.color}">
      <div class="skill__head">
        <span class="skill__ico" style="background:${s.color}22;color:${s.color}">${s.icon}</span>
        <div class="skill__meta">
          <div class="skill__name">${esc(s.name)}</div>
          <div class="skill__about">${esc(s.about)}</div>
        </div>
        <div class="skill__pct">${p.percent}%</div>
      </div>
      <div class="bar"><i style="width:${p.percent}%;background:${s.color}"></i></div>
      <div class="skill__lessons">
        ${s.lessons.map((l) => {
          const done = !!S.lessons[l.id];
          const opened = seenLesson(l.id);
          const target = nextLesson(s);
          const locked = !done && target && target.id !== l.id;
          return `<button class="lesson ${done ? 'is-done' : ''}" data-lesson="${l.id}" ${locked ? 'disabled' : ''}>
            <span class="lesson__dot" style="${done ? `background:${s.color}` : ''}">${locked ? '🔒' : ''}</span>
            <span class="lesson__body">
              <span class="lesson__title">${esc(l.title)}</span>
              <span class="lesson__sub">${l.cards.length} ${plural(l.cards.length, 'карточка', 'карточки', 'карточек')} · ${l.minutes} мин${opened && !done ? ' · начат' : ''}${locked ? ' · закрыт' : ''}</span>
            </span>
            <span class="lesson__go">${locked ? '🔒' : '›'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }).join('')}`;
}

/* ─────────────── экран «Статистика» ─────────────── */

function screenStats() {
  const cells = heatmap(18);
  const total = S.stats.totalAnswers;
  const acc = total ? Math.round((S.stats.correct / total) * 100) : 0;
  const lv = levelInfo(S.xp);

  const heat = cells.map((c) => {
    const lvl = c.count === 0 ? 0 : c.count < 6 ? 1 : c.count < 14 ? 2 : c.count < 26 ? 3 : 4;
    return `<i class="cell cell--${c.future ? 'x' : lvl}" title="${c.date}: ${c.count}"></i>`;
  }).join('');

  return `<h1 class="h1">Статистика</h1>
  <div class="grid2">
    ${statCard(total, 'всего ответов')}
    ${statCard(acc + '%', 'правильных')}
    ${statCard(S.bestStreak, 'лучшая серия')}
    ${statCard(S.stats.lessonsDone, 'уроков пройдено')}
    ${statCard(activeDays(), 'дней занятий')}
    ${statCard(lv.level, 'уровень')}
  </div>

  <h2 class="sect">Активность за 18 недель</h2>
  <div class="card card--pad">
    <div class="heat">${heat}</div>
    <div class="heat__legend">
      <span>меньше</span>
      <i class="cell cell--0"></i><i class="cell cell--1"></i><i class="cell cell--2"></i>
      <i class="cell cell--3"></i><i class="cell cell--4"></i>
      <span>больше</span>
    </div>
  </div>

  <h2 class="sect">Карточки по уровням</h2>
  <div class="card card--pad">${cardBreakdown()}</div>

  <h2 class="sect">Сравнение недель</h2>
  <div class="card card--pad">${weekCompare()}</div>`;
}

/**
 * Сравнение текущей недели с прошлой: видно, стало ли заниматься
 * больше или наступил спад.
 */
function weekCompare() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const sum = (from, days) => {
    let n = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      n += S.days[dayKey(d)] || 0;
    }
    return n;
  };

  const thisWeek = sum(monday, 7);
  const lastMonday = new Date(monday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastWeek = sum(lastMonday, 7);

  const diff = thisWeek - lastWeek;
  const pct = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round((diff / lastWeek) * 100);
  const max = Math.max(thisWeek, lastWeek, 1);

  return `<div class="wk">
    <div class="wk__row">
      <span class="wk__k">Эта неделя</span>
      <span class="wk__bar"><i style="width:${(thisWeek / max) * 100}%"></i></span>
      <b class="wk__v">${thisWeek}</b>
    </div>
    <div class="wk__row">
      <span class="wk__k">Прошлая</span>
      <span class="wk__bar wk__bar--dim"><i style="width:${(lastWeek / max) * 100}%"></i></span>
      <b class="wk__v">${lastWeek}</b>
    </div>
  </div>
  <div class="wk__res ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">
    ${lastWeek === 0 && thisWeek === 0
      ? 'Пока нет данных за эти недели'
      : diff > 0
        ? `На ${diff} ${plural(diff, 'ответ', 'ответа', 'ответов')} больше, чем на прошлой неделе (+${pct}%)`
        : diff < 0
          ? `На ${-diff} ${plural(-diff, 'ответ', 'ответа', 'ответов')} меньше, чем на прошлой неделе`
          : 'Столько же, сколько на прошлой неделе'}
  </div>`;
}

function statCard(value, label) {
  return `<div class="stat"><b>${value}</b><span>${label}</span></div>`;
}

function cardBreakdown() {
  const buckets = { 'новые': 0, '1–6 дней': 0, '1–4 недели': 0, 'больше месяца': 0 };
  for (const skill of SKILLS) {
    for (const lesson of skill.lessons) {
      lesson.cards.forEach((c, i) => {
        const st = S.cards[`${lesson.id}#${i}`];
        if (!st) return;
        if (st.interval === 0) buckets['новые']++;
        else if (st.interval <= 6) buckets['1–6 дней']++;
        else if (st.interval < 30) buckets['1–4 недели']++;
        else buckets['больше месяца']++;
      });
    }
  }
  const max = Math.max(1, ...Object.values(buckets));
  return Object.entries(buckets).map(([k, v]) => `
    <div class="bd">
      <span class="bd__k">${k}</span>
      <span class="bd__bar"><i style="width:${(v / max) * 100}%"></i></span>
      <b class="bd__v">${v}</b>
    </div>`).join('');
}

/* ─────────────── экран «Награды» ─────────────── */

function screenAwards() {
  /* секретные достижения не видны, пока не открыты */
  const visible = ACHIEVEMENTS.filter((a) => !a.hidden || S.achievements[a.id]);
  const got = Object.keys(S.achievements).length;
  return `<h1 class="h1">Награды</h1>
  <p class="lead">Открыто ${got} из ${ACHIEVEMENTS.length}. Секретные появляются только после открытия.</p>
  <div class="awards">
    ${visible.map((a) => {
      const on = !!S.achievements[a.id];
      return `<div class="award ${on ? 'is-on' : ''}">
        <div class="award__ico">${on ? a.icon : '🔒'}</div>
        <div class="award__name">${esc(a.name)}</div>
        <div class="award__text">${esc(a.text)}</div>
        ${on ? `<div class="award__date">${new Date(S.achievements[a.id]).toLocaleDateString('ru-RU')}</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

/* ─────────────── экран «Я» ─────────────── */

function screenMe() {
  const lv = levelInfo(S.xp);
  const total = S.stats.totalAnswers;
  const acc = total ? Math.round((S.stats.correct / total) * 100) : 0;
  const got = Object.keys(S.achievements).length;
  const initial = loggedIn() && auth.user && auth.user.name
    ? auth.user.name.trim()[0].toUpperCase() : '?';

  const account = loggedIn()
    ? `<div class="card card--pad who">
        <div class="who__ava">${esc(initial)}</div>
        <div class="who__body">
          <b>${esc(auth.user?.name || 'Пользователь')}</b>
          <i>${esc(auth.user?.email || '')}</i>
          <span class="synced"></span>
        </div>
      </div>
      <div class="card card--pad">
        <p class="muted-note" style="margin:0 0 14px">
          Прогресс сохраняется в аккаунт и переносится между устройствами:
          начали на телефоне — продолжили на компьютере.
        </p>
        <button class="btn btn--ghost" id="sync-now">Сохранить сейчас</button>
        <button class="btn btn--quiet" id="logout">Выйти из аккаунта</button>
        <button class="btn btn--quiet danger" id="del-acc">Удалить аккаунт и данные</button>
      </div>`
    : `<div class="card card--pad">
        <b class="me__h">Аккаунт</b>
        <p class="muted-note">Сейчас прогресс хранится только в этом телефоне.
        Аккаунт позволит переносить его между устройствами и не потерять
        при очистке браузера.</p>
        <button class="btn btn--primary" id="to-auth">Войти или создать аккаунт</button>
      </div>`;

  return `<button class="icon back" id="back-today">‹</button>
  <h1 class="h1">Профиль</h1>

  ${account}

  <div class="btn-row" style="margin-top:14px">
    <button class="btn btn--ghost" id="to-stats">Статистика</button>
    <button class="btn btn--ghost" id="to-awards">Награды · ${got}</button>
  </div>

  <div class="grid2" style="margin-top:14px">
    ${statCard(lv.level, 'уровень')}
    ${statCard(S.xp, 'опыта')}
    ${statCard(S.streak, 'серия дней')}
    ${statCard(acc + '%', 'точность')}
    ${statCard(got, 'награды')}
    ${statCard(S.stats.mastered, 'освоено')}
  </div>

  <h2 class="sect">Настройки</h2>
  <div class="card card--pad">
    <label class="row">
      <span>Цель в день</span>
      <input type="range" id="goal" min="5" max="60" step="5" value="${S.settings.goal}">
      <b id="goalVal">${S.settings.goal}</b>
    </label>
    <label class="row">
      <span>Напоминание вечером</span>
      <input type="checkbox" id="remind" ${S.settings.reminder ? 'checked' : ''}>
    </label>
    <label class="row">
      <span>Звуки и вибрация</span>
      <input type="checkbox" id="sound" ${S.settings.sound !== false ? 'checked' : ''}>
    </label>
    <button class="btn btn--quiet" id="redo-onboard">Пройти знакомство заново</button>
    <button class="btn btn--quiet" id="to-qr">QR-код для установки</button>
    <button class="btn btn--quiet" id="export">Скачать прогресс файлом</button>
    <button class="btn btn--quiet" id="import">Загрузить прогресс из файла</button>
    <input type="file" id="import-file" accept=".json,application/json" style="display:none">
    <button class="btn btn--quiet danger" id="reset">Сбросить весь прогресс</button>
  </div>

  <h2 class="sect">Установка на телефон</h2>
  <div class="card card--pad">
    <p class="muted-note" style="margin:0 0 12px">Приложение ставится на домашний экран: своя иконка, полный экран, работа без интернета.</p>
    <button class="btn btn--ghost" id="install-app" style="display:none">Установить приложение</button>
    <p class="muted-note" id="install-hint" style="display:none;margin:0">
      Android: Chrome предложит установку сам — меню «⋮» → «Установить приложение».
      iPhone: Safari → «Поделиться» → «На экран Домой».
      QR-код для сканирования — <a href="qr.html" style="color:var(--accent)">здесь</a>.
    </p>
  </div>

  <h2 class="sect">Магазин</h2>
  <div class="card card--pad">
    <p class="muted-note" style="margin:0 0 12px">У вас 💎 <b style="color:var(--text)">${S.gems || 0}</b>. Гемы даются за верные ответы, уроки, задания и фокус.</p>
    <div class="shop">
      <div class="shop__i">
        <div class="shop__ico">❤️</div>
        <div class="shop__body">
          <b>Восстановить сердечки</b>
          <i>Сразу 5 из 5 — не ждать полчаса</i>
        </div>
        <button class="shop__buy" id="buy-hearts" ${heartsNow() >= 5 ? 'disabled' : ''}>30 💎</button>
      </div>
      <div class="shop__i">
        <div class="shop__ico">❄️</div>
        <div class="shop__body">
          <b>Заморозка серии</b>
          <i>Спасёт серию при пропуске · сейчас ${S.freezes}</i>
        </div>
        <button class="shop__buy" id="buy-freeze">20 💎</button>
      </div>
    </div>
  </div>

  <h2 class="sect">Лига недели</h2>
  <div class="card card--pad">
    <p class="muted-note" style="margin:0 0 12px">Соревнование по опыту за неделю. Нужен аккаунт — таблица считается на сервере между всеми игроками.</p>
    <button class="btn btn--ghost" id="to-league">Открыть лигу</button>
  </div>

  <h2 class="sect">О приложении</h2>
  <div class="card card--pad muted-note">
    <p style="margin:0 0 10px"><b style="color:var(--text)">SkillUp</b> — короткие уроки
    с интервальным повторением. Карточки возвращаются по алгоритму SM-2:
    то, что вы помните хорошо, показывается реже, а трудное — чаще.</p>
    <p style="margin:0">Работает без интернета. Прогресс хранится в телефоне,
    а с аккаунтом — ещё и на сервере.</p>
  </div>`;
}

/* ─────────────── занятие карточками ─────────────── */

function startSession() {
  /* Практика — только карточки, у которых подошёл срок повторения.
     Новые карточки изучаются в уроках, а не «в лоб». */
  const due = dueCards();
  if (!due.length) {
    toast('Всё повторено — откройте новый урок', 'info');
    tab = 'skills';
    render();
    return;
  }
  session = { queue: due, index: 0, revealed: false, correct: 0, wrong: 0, startedAt: Date.now() };
  render();
}

/* Нормализация ответа: регистр, знаки препинания и лишние пробелы
   не считаются ошибкой — «To Go», «to go!» и «to  go» равноценны. */
const normAns = (s) => String(s || '').toLowerCase()
  .replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();

/**
 * Проверка ответа. Строгая сверка раздражает: «7 часов» и «70» — тоже
 * правильные ответы. Поэтому кроме точного совпадения работают:
 *   • числа — точное совпадение числа или попадание в диапазон («60–80»);
 *   • слова — вариант должен встретиться в ответе целым словом
 *     («мозг» засчитает «это мозг», но не «мозжечок»).
 */
function checkAnswer(given, accept) {
  const g = normAns(given);
  if (!g) return false;
  for (const raw of accept || []) {
    const n = normAns(raw);
    if (!n) continue;
    if (g === n) return true;

    /* числовой ответ */
    const numG = g.match(/\d+(?:[.,]\d+)?/);
    const numsA = n.match(/\d+(?:[.,]\d+)?/g) || [];
    if (numG && numsA.length) {
      const v = Number(numG[0]);
      if (numsA.some((x) => Number(x) === v)) return true;
      if (numsA.length >= 2 && v >= Number(numsA[0]) && v <= Number(numsA[numsA.length - 1])) return true;
      continue;
    }

    /* словесный ответ — целым словом */
    const re = new RegExp('(^|\\s)' + n + '(\\s|$)');
    if (n.length >= 3 && re.test(g)) return true;
    const re2 = new RegExp('(^|\\s)' + g + '(\\s|$)');
    if (g.length >= 3 && re2.test(n)) return true;
  }
  return false;
}

/** Оценка ответа любого типа: верно → q=4, ошибка → q=1 и минус сердечко. */
function gradeAnswer(ok, picked) {
  const item = session.queue[session.index];
  if (ok) {
    session.correct++;
  } else {
    session.wrong++;
    loseHeart();
  }
  review(item.id, ok ? 4 : 1);
  session.answer = { ok, picked };
  if (!ok) session.queue.push(item);   // ошибся — карточка вернётся в конце занятия
  /* отклик: звук и лёгкая вибрация на ошибке (Android) */
  if (ok) snd.ok(); else { snd.bad(); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
  render();
  scheduleSync();
  /* сердечки кончились — занятие на паузе с экраном восстановления */
  if (S.hearts <= 0) {
    screen = 'nohearts';
    render();
  }
}

/** Плашка результата с правильным ответом и объяснением. */
function feedbackHtml(ok, card) {
  const right = card.options ? esc(card.options[card.a]) : (card.a != null ? esc(card.a) : '');
  const sound = !card.options && speakable(card.a)
    ? ' <button class="speak" id="speak" title="Произнести">🔊</button>' : '';
  return `<div class="fb ${ok ? 'fb--ok' : 'fb--bad'}">
    <b>${ok ? 'Верно!' : 'Неверно'}</b>
    ${!ok && right ? ` — правильный ответ: <b>${right}</b>${sound}` : (ok && sound ? sound : '')}
    ${card.explain ? `<span class="fb__ex">${esc(card.explain)}</span>` : ''}
  </div>
  <button class="btn btn--primary" id="next">Продолжить</button>`;
}

/** Содержимое карточки зависит от типа вопроса. */
function sessionBody(item) {
  const card = item.card || {};
  const type = card.type || 'flip';
  const ans = session.answer || null;

  if (type === 'choice') {
    /* варианты перемешиваются, но порядок запоминается: при повторной
       отрисовке этой же карточки (плашка результата) кнопки не прыгают */
    const key = item.id + '#' + session.index;
    if (!session.optMap || session.optMap.key !== key) {
      const order = (card.options || []).map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      session.optMap = { key, order };
    }
    const opts = session.optMap.order.map((origI) => {
      const o = card.options[origI];
      let cls = 'choice__b';
      if (ans) {
        if (origI === card.a) cls += ' is-right';
        else if (origI === ans.picked) cls += ' is-wrong';
        else cls += ' is-dim';
      }
      return `<button class="${cls}" data-opt="${origI}" ${ans ? 'disabled' : ''}>${esc(o)}</button>`;
    }).join('');
    return `<div class="flip__q">${esc(card.q)}</div>
      <div class="choice">${opts}</div>
      ${ans ? feedbackHtml(ans.ok, card) : ''}`;
  }

  if (type === 'type') {
    return `<div class="flip__q">${esc(card.q)}</div>
      ${ans ? '' : `
        <input class="ans-input" id="ans-in" type="text" autocomplete="off"
          autocapitalize="off" autofocus placeholder="Напишите ответ">
        <button class="btn btn--primary" id="check">Проверить</button>`}
      ${ans ? feedbackHtml(ans.ok, card) : ''}`;
  }

  if (type === 'build') {
    /* плитки-слова как в Duolingo: собираем фразу постукиванием.
       Порядок плиток перемешивается и запоминается, чтобы при
       перерисовке карточки они не прыгали. */
    const key = item.id + '#' + session.index;
    if (!session.build || session.build.key !== key) {
      const order = (card.parts || []).map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      session.build = { key, order, chosen: [] };
    }
    const chosen = session.build.chosen;
    const answerRow = chosen
      .map((origI) => `<button class="tile tile--in" data-back="${origI}">${esc(card.parts[origI])}</button>`).join('');
    const pool = session.build.order
      .filter((origI) => !chosen.includes(origI))
      .map((origI) => `<button class="tile" data-pool="${origI}">${esc(card.parts[origI])}</button>`).join('');
    return `<div class="flip__q">${esc(card.q)}</div>
      <div class="tiles">
        <div class="tiles__row">${answerRow || '<span class="tiles__empty">Собирайте ответ здесь</span>'}</div>
        <div class="tiles__row tiles__pool">${pool}</div>
      </div>
      ${ans ? '' : `<button class="btn btn--primary" id="check-build" ${chosen.length ? '' : 'disabled'}>Проверить</button>`}
      ${ans ? feedbackHtml(ans.ok, card) : ''}`;
  }

  /* flip — честная самопроверка */
  return `<div class="flip__q">${esc(card.q)}</div>
    ${session.revealed
      ? `<div class="flip__a">${esc(card.a)}${speakable(card.a) ? ' <button class="speak" id="speak" title="Произнести">🔊</button>' : ''}</div>
         <div class="flip__hint">${esc(card.hint || '')}</div>`
      : `<button class="btn btn--primary" id="reveal">Показать ответ</button>`}`;
}

function screenSession() {
  const item = session.queue[session.index];
  if (!item) return sessionDone();

  const pct = Math.round((session.index / session.queue.length) * 100);
  const st = S.cards[item.id];
  const isNew = !st;
  const type = (item.card && item.card.type) || 'flip';
  const typeLabel = type === 'choice' ? 'выбор' : type === 'type' ? 'ввод'
    : type === 'build' ? 'собери фразу' : 'самопроверка';

  return `<div class="sess">
    <div class="sess__top">
      <button class="icon" id="quit">✕</button>
      <div class="sess__bar"><i style="width:${pct}%"></i></div>
      <div class="sess__count"><span class="hearts" title="Сердечки">${'❤️'.repeat(Math.max(0, heartsNow()))}</span> · ${session.correct}✓ ${session.wrong}✗ · ${session.index + 1}/${session.queue.length}</div>
    </div>

    <div class="sess__skill" style="color:${item.skill.color}">
      ${item.skill.icon} ${esc(item.skill.name)} · ${esc(item.lesson.title)}
      ${isNew ? '<span class="tag">новая</span>' : ''}
      <span class="tag">${typeLabel}</span>
    </div>

    <div class="flip ${type === 'flip' && session.revealed ? 'is-open' : ''}" id="flip">
      ${sessionBody(item)}
    </div>

    ${type === 'flip' && session.revealed ? `
      <div class="rate">
        <div class="rate__label">Насколько легко вспомнилось?</div>
        <div class="rate__row">
          <button class="rate__b rate__b--bad" data-q="1">Забыл</button>
          <button class="rate__b rate__b--hard" data-q="3">Сложно</button>
          <button class="rate__b rate__b--good" data-q="4">Хорошо</button>
          <button class="rate__b rate__b--easy" data-q="5">Легко</button>
        </div>
        <div class="rate__next" id="nextInfo"></div>
      </div>` : ''}
  </div>`;
}

function sessionDone() {
  const secs = Math.round((Date.now() - session.startedAt) / 1000);
  const total = session.correct + session.wrong;
  const acc = total ? Math.round((session.correct / total) * 100) : 0;
  return `<div class="done">
    <div class="done__ico">🎉</div>
    <h1 class="h1">Занятие завершено</h1>
    <p class="lead">${session.queue.length} ${plural(session.queue.length, 'карточка', 'карточки', 'карточек')} за ${Math.max(1, Math.round(secs / 60))} мин</p>
    <div class="grid3">
      ${statCard(session.correct, 'верно')}
      ${statCard(session.wrong, 'ошибок')}
      ${statCard(acc + '%', 'точность')}
    </div>
    <div class="done__gain">+${session.correct * 8} XP · +${session.correct} 💎</div>
    <button class="btn btn--primary" id="done">Продолжить</button>
  </div>`;
}

/* Пауза, когда кончились сердечки. Занятие не теряется:
   после восстановления продолжаем с той же карточки. */
function screenNoHearts() {
  const canBuy = (S.gems || 0) >= 30;
  return `<div class="done">
    <div class="done__ico">💔</div>
    <h1 class="h1">Сердечки закончились</h1>
    <p class="lead">Одно сердечко возвращается каждые 30 минут. Занятие на паузе — прогресс не потерян.</p>
    ${canBuy
      ? `<button class="btn btn--primary" id="hearts-buy">Восстановить за 30 💎</button>`
      : `<div class="card card--pad muted-note" style="margin:14px 0">У вас ${S.gems || 0} 💎 — нужно 30. Гемы даются за верные ответы, уроки и задания.</div>`}
    <button class="btn btn--quiet" id="hearts-quit">Завершить занятие</button>
  </div>`;
}

/* ─────────────── урок ─────────────── */

function screenLesson() {
  const skill = SKILLS.find((s) => s.lessons.some((l) => l.id === lessonView.id));
  const lesson = skill.lessons.find((l) => l.id === lessonView.id);
  const done = !!S.lessons[lesson.id];

  if (!lessonView.reading) {
    return `<div class="lesson-view">
      <button class="icon" id="back">‹</button>
      <div class="sess__skill" style="color:${skill.color}">${skill.icon} ${esc(skill.name)}</div>
      <h1 class="h1">${esc(lesson.title)}</h1>
      <div class="lead">${lesson.minutes} мин · ${lesson.cards.length} ${plural(lesson.cards.length, 'карточка', 'карточки', 'карточек')}</div>
      <div class="card card--pad theory">${esc(lesson.theory)}</div>
      <button class="btn btn--primary" id="begin">${done ? 'Повторить карточки' : 'Перейти к карточкам'}</button>
    </div>`;
  }
  return screenSession();
}

/* ─────────────── отрисовка ─────────────── */

function render() {
  const nav = document.querySelector('.nav');

  /* сессия переживает перезагрузку страницы: сохраняем её в хранилище
     при каждой отрисовке и восстанавливаем при запуске */
  persistSession();

  /* знакомство показывается до всего остального и без нижнего меню,
     чтобы не отвлекать */
  if (!S.settings.onboarded) {
    if (nav) nav.hidden = true;
    app.innerHTML = screenOnboarding();
    bindOnboarding();
    return;
  }
  if (nav) nav.hidden = false;

  /* Аккаунт обязателен: без него карточки и уроки недоступны.
     Гость видит только знакомство и экран входа. */
  if (!loggedIn()) {
    if (nav) nav.hidden = true;
    app.innerHTML = screenAuth();
    bindAuth();
    return;
  }

  if (screen === 'nohearts') {
    app.innerHTML = screenNoHearts();
    bind();
  } else if (screen === 'league') {
    app.innerHTML = screenLeague();
    bind();
  } else if (screen === 'focus') {
    app.innerHTML = screenFocus();
    bind();
  } else if (screen === 'auth') {
    app.innerHTML = screenAuth();
    bindAuth();
  } else if (lessonView) {
    app.innerHTML = screenLesson();
    bind();
  } else if (session) {
    app.innerHTML = session.index >= session.queue.length ? sessionDone() : screenSession();
    bind();
  } else {
    app.innerHTML = tab === 'today' ? screenToday()
      : tab === 'map' ? screenMap()
      : tab === 'skills' ? screenSkills()
      : tab === 'stats' ? screenStats()
      : tab === 'awards' ? screenAwards()
      : screenMe();
    bind();
    /* линии карты считаем после вставки в документ: до этого у узлов
       ещё нет координат */
    if (tab === 'map') {
      bindMap();
      drawMapLines();
    }
  }

  document.querySelectorAll('.nav__b').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.tab === tab && !session && !lessonView && !screen);
  });

  /* кнопка установки: показываем, когда браузер готов, иначе — подсказку */
  const ib = document.getElementById('install-app');
  if (ib) {
    if (window.__install) {
      ib.style.display = 'block';
    } else {
      const ih = document.getElementById('install-hint');
      if (ih) ih.style.display = 'block';
    }
  }
}

/* ─────────────── обработчики ─────────────── */

function bind() {
  const on = (sel, ev, fn) => {
    const el = document.querySelector(sel);
    if (el) el.addEventListener(ev, fn);
  };

  on('#start', 'click', startSession);

  document.querySelectorAll('[data-skill]').forEach((b) => {
    b.addEventListener('click', () => { tab = 'skills'; render(); });
  });

  document.querySelectorAll('[data-lesson]').forEach((b) => {
    b.addEventListener('click', () => {
      /* уроки открываются по очереди: заблокированные не открываем,
         даже если клик пришёл программно */
      if (b.disabled) return;
      lessonView = { id: b.dataset.lesson, reading: false };
      render();
    });
  });

  on('#begin', 'click', () => {
    const skill = SKILLS.find((s) => s.lessons.some((l) => l.id === lessonView.id));
    const lesson = skill.lessons.find((l) => l.id === lessonView.id);
    const queue = lesson.cards.map((card, i) => ({
      id: `${lesson.id}#${i}`, card, lesson, skill,
    }));
    session = { queue, index: 0, revealed: false, correct: 0, wrong: 0, startedAt: Date.now(), isLesson: true };
    lessonView.reading = true;
    render();
  });

  on('#back', 'click', () => { lessonView = null; render(); });

  on('#reveal', 'click', () => { session.revealed = true; render(); });

  /* выбор варианта — оценка автоматическая */
  document.querySelectorAll('[data-opt]').forEach((b) => {
    b.addEventListener('click', () => {
      gradeAnswer(Number(b.dataset.opt) === session.queue[session.index].card.a, Number(b.dataset.opt));
    });
  });

  /* ввод ответа — сверяем с допустимыми формулировками */
  on('#check', 'click', () => {
    const item = session.queue[session.index];
    const given = (document.getElementById('ans-in') || {}).value || '';
    if (!given.trim()) return;
    gradeAnswer(checkAnswer(given, item.card.accept || []), given);
  });

  /* Enter в поле ввода — то же, что нажать «Проверить» */
  on('#ans-in', 'keydown', (e) => {
    if (e.key === 'Enter') {
      const btn = document.getElementById('check');
      if (btn) btn.click();
    }
  });

  /* плитки-слова: в ответ и обратно */
  document.querySelectorAll('[data-pool]').forEach((b) => {
    b.addEventListener('click', () => {
      if (!session.build) return;
      session.build.chosen.push(Number(b.dataset.pool));
      render();
    });
  });
  document.querySelectorAll('[data-back]').forEach((b) => {
    b.addEventListener('click', () => {
      if (!session.build) return;
      const i = Number(b.dataset.back);
      const idx = session.build.chosen.lastIndexOf(i);
      if (idx >= 0) session.build.chosen.splice(idx, 1);
      render();
    });
  });
  on('#check-build', 'click', () => {
    if (!session.build || !session.build.chosen.length) return;
    const item = session.queue[session.index];
    const joined = session.build.chosen.map((i) => item.card.parts[i]).join(' ');
    gradeAnswer(checkAnswer(joined, [item.card.a, ...(item.card.accept || [])]), joined);
  });

  /* дальше — к следующей карточке */
  on('#next', 'click', () => {
    session.index++;
    session.revealed = false;
    session.answer = null;
    render();
  });

  /* сердечки кончились: восстановить за гемы или завершить */
  on('#hearts-buy', 'click', () => {
    if ((S.gems || 0) < 30) { toast('Не хватает гемов', 'info'); return; }
    S.gems -= 30;
    S.hearts = 5;
    S.heartsAt = Date.now();
    save();
    screen = null;
    render();
    toast('Сердечки восстановлены — продолжаем!', 'quest');
  });
  on('#hearts-quit', 'click', () => {
    session = null;
    lessonView = null;
    screen = null;
    tab = 'today';
    render();
  });

  on('#quit', 'click', () => { session = null; lessonView = null; render(); });

  on('#done', 'click', () => {
    if (session.isLesson) {
      const lessonId = session.queue[0].id.split('#')[0];
      completeLesson(lessonId, session.correct, session.wrong);
      lessonView = null;
    } else {
      /* минуты занятия идут в ежедневное задание */
      addMinutes(Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)));
    }
    session = null;
    refreshQuests();
    render();
  });

  document.querySelectorAll('[data-q]').forEach((b) => {
    b.addEventListener('click', () => {
      const q = Number(b.dataset.q);
      const item = session.queue[session.index];
      if (q >= 3) { session.correct++; snd.ok(); }
      else { session.wrong++; loseHeart(); snd.bad(); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
      review(item.id, q);
      /* ошибся — вернуть карточку в конец очереди этого занятия */
      if (q < 3) session.queue.push(item);
      session.index++;
      session.revealed = false;
      render();
      /* отправляем на сервер с задержкой, чтобы не дёргать сеть
         на каждый ответ */
      scheduleSync();
      if (S.hearts <= 0) {
        screen = 'nohearts';
        render();
      }
    });
  });

  on('#goal', 'input', (e) => {
    S.settings.goal = Number(e.target.value);
    document.getElementById('goalVal').textContent = S.settings.goal;
    save();
  });

  on('#remind', 'change', (e) => {
    S.settings.reminder = e.target.checked;
    save();
    if (e.target.checked) askNotify();
  });

  on('#sound', 'change', (e) => { S.settings.sound = e.target.checked; save(); });

  /* загрузка прогресса из файла — перенос между устройствами без аккаунта */
  on('#import', 'click', () => {
    const f = document.getElementById('import-file');
    if (f) f.click();
  });
  on('#import-file', 'change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const p = JSON.parse(rd.result);
        if (typeof p.xp !== 'number') throw new Error('bad');
        applyProgress(p);
        render();
        toast('Прогресс загружен', 'quest');
      } catch (err) {
        toast('Файл не похож на прогресс SkillUp', 'info');
      }
    };
    rd.readAsText(file);
  });

  on('#reset', 'click', () => {
    if (confirm('Сбросить весь прогресс? Это нельзя отменить.')) {
      localStorage.removeItem(KEY);
      S = blank();
      render();
      toast('Прогресс сброшен', 'info');
    }
  });

  /* ── профиль и аккаунт ── */
  on('#to-auth', 'click', () => { screen = 'auth'; authMode = 'login'; authError = ''; render(); });
  on('#to-me', 'click', () => { tab = 'me'; render(); });
  on('#to-map', 'click', () => { tab = 'map'; render(); });
  on('#back-today', 'click', () => { screen = null; tab = 'today'; render(); });
  on('#to-focus', 'click', () => { screen = 'focus'; render(); });

  /* ── фокус ── */
  document.querySelectorAll('[data-min]').forEach((b) => {
    b.addEventListener('click', () => {
      focusState.minutes = Number(b.dataset.min);
      focusState.left = focusState.minutes * 60;
      focusState.running = false;
      render();
    });
  });
  on('#focus-go', 'click', () => {
    if (focusState.running) {
      /* пауза: запоминаем, сколько осталось */
      focusState.left = Math.max(0, Math.ceil((focusState.endAt - Date.now()) / 1000));
      focusState.running = false;
    } else {
      focusState.endAt = Date.now() + focusState.left * 1000;
      focusState.running = true;
    }
    render();
  });
  on('#focus-reset', 'click', () => {
    focusState.left = focusState.minutes * 60;
    focusState.running = false;
    render();
  });
  on('#to-stats', 'click', () => { tab = 'stats'; render(); });
  on('#to-awards', 'click', () => { tab = 'awards'; render(); });

  on('#logout', 'click', async () => {
    await apiLogout();
    toast('Вы вышли из аккаунта', 'info');
    render();
  });

  on('#del-acc', 'click', async () => {
    if (!confirm('Удалить аккаунт вместе со всем прогрессом на сервере? Это нельзя отменить.')) return;
    try {
      await apiDeleteAccount();
      toast('Аккаунт удалён. Прогресс остался в телефоне.', 'info');
    } catch (e) {
      toast(e.message, 'info');
    }
    render();
  });

  on('#sync-now', 'click', async () => {
    setSyncState('wait');
    const r = await syncNow();
    setSyncState(r.error ? 'err' : 'ok');
    toast(r.error ? r.error : 'Прогресс сохранён в аккаунт', r.error ? 'info' : 'quest');
  });

  on('#redo-onboard', 'click', () => {
    obStep = 0;
    obGoal = S.settings.goal;
    obPicked = S.settings.picked || [];
    S.settings.onboarded = false;
    save();
    render();
  });

  /* страница с QR-кодом: удобно показать другу — тот сканирует камерой */
  on('#to-qr', 'click', () => { location.href = 'qr.html'; });

  /* установка приложения: кнопка работает через событие браузера */
  on('#install-app', 'click', async () => {
    if (!window.__install) return;
    window.__install.prompt();
    try {
      await window.__install.userChoice;
    } catch (e) {
      /* пользователь передумал — не страшно */
    }
    window.__install = null;
    render();
  });

  /* ── лига и магазин ── */
  on('#to-league', 'click', () => {
    screen = 'league';
    leagueData = null;
    render();
    loadLeague();
  });
  on('#league-refresh', 'click', () => {
    leagueData = null;
    render();
    loadLeague();
  });
  on('#buy-hearts', 'click', () => {
    if ((S.gems || 0) < 30) { toast('Не хватает гемов', 'info'); return; }
    S.gems -= 30;
    S.hearts = 5;
    S.heartsAt = Date.now();
    save();
    render();
    toast('Сердечки восстановлены!', 'quest');
  });
  on('#buy-freeze', 'click', () => {
    if ((S.gems || 0) < 20) { toast('Не хватает гемов', 'info'); return; }
    S.gems -= 20;
    S.freezes = (S.freezes || 0) + 1;
    save();
    render();
    toast('Заморозка куплена', 'quest');
  });

  /* озвучка фразы */
  on('#speak', 'click', () => {
    const item = session.queue[session.index];
    if (item && typeof item.card.a === 'string') speak(item.card.a);
  });

  /* Выгрузка прогресса файлом: если человек захочет перенести его
     вручную или просто сохранить копию */
  on('#export', 'click', () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `skillup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Файл сохранён', 'info');
  });

  document.querySelectorAll('.nav__b').forEach((b) => {
    b.addEventListener('click', () => {
      tab = b.dataset.tab;
      session = null;
      lessonView = null;
      screen = null;
      render();
    });
  });
}

/* ─────────────── напоминания ─────────────── */

async function askNotify() {
  if (!('Notification' in window)) {
    toast('Уведомления не поддерживаются', 'info');
    return;
  }
  const p = await Notification.requestPermission();
  if (p === 'granted') toast('Напоминание включено', 'quest');
  else toast('Разрешение не выдано', 'info');
}

/** Проверяем раз в минуту: если время подошло и сегодня не занимались — напоминаем. */
setInterval(() => {
  if (!S.settings.reminder || Notification?.permission !== 'granted') return;
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  if (hhmm !== S.settings.reminderTime) return;
  if (S.lastActive === today()) return;
  const key = 'notified.' + today();
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  new Notification('SkillUp', { body: 'Пора позаниматься — серия ждёт!', icon: 'icon-192.png' });
}, 60000);

/* ─────────────── режим фокусировки ─────────────── */

let focusState = { minutes: 25, left: 25 * 60, running: false, endAt: 0 };

/* Тикающий таймер: пока идёт фокус, обновляем циферблат на экране.
   Перерисовываем только сам экран фокуса — другие экраны не трогаем. */
setInterval(() => {
  if (!focusState.running) return;
  if (Date.now() >= focusState.endAt) {
    focusState.running = false;
    focusState.left = 0;
    completeFocus(focusState.minutes);
    snd.level();
    toast(`Фокус завершён: +${focusState.minutes * 4} XP`, 'quest');
    if (screen === 'focus') render();
    return;
  }
  if (screen === 'focus') render();
}, 500);

function screenFocus() {
  const m = focusState.minutes;
  const left = focusState.running
    ? Math.max(0, Math.ceil((focusState.endAt - Date.now()) / 1000))
    : focusState.left;
  const total = m * 60;
  const percent = Math.min(100, Math.round(((total - left) / total) * 100));
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return `<button class="icon back" id="back-today">‹</button>
  <h1 class="h1">Режим фокусировки</h1>
  <p class="lead">${m} минут без отвлечений. За завершённую сессию — ${m * 4} опыта, минуты занятия и активный день серии.</p>

  <div class="focus__ring">
    ${progressRing(percent, 230, 12, '#b794ff')}
    <div class="focus__time">
      <b>${mm}:${ss}</b>
      <span>${focusState.running ? 'идёт работа…' : 'готовы?'}</span>
    </div>
  </div>

  <div class="focus__pick">
    ${[5, 15, 25, 45].map((v) => `<button class="focus__p ${m === v ? 'is-on' : ''}" data-min="${v}">${v} мин</button>`).join('')}
  </div>

  <button class="btn btn--primary" id="focus-go">${focusState.running ? 'Пауза' : (left < total ? 'Продолжить' : 'Начать')}</button>
  <button class="btn btn--quiet" id="focus-reset">Сбросить</button>
  <p class="muted-note" style="margin-top:16px">Совет: уберите телефон в другую комнату и закройте лишние вкладки. Один отрезок — одна задача.</p>`;
}

/* ─────────────── звуки ─────────────── */

let audioCtx = null;
function beep(freq, dur, type, gain) {
  try {
    if (S.settings.sound === false) return;
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = gain || 0.12;
    o.connect(g);
    g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    o.start(t);
    g.gain.setValueAtTime(gain || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.stop(t + dur + 0.02);
  } catch (e) {
    /* без звука приложение обязано работать */
  }
}
const snd = {
  ok: () => { beep(660, 0.12); setTimeout(() => beep(880, 0.14), 90); },
  bad: () => beep(220, 0.22, 'triangle', 0.09),
  level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.22), i * 110)),
};

/* ─────────────── празднование уровня ─────────────── */

function celebrate(level) {
  const el = document.createElement('div');
  el.className = 'celebrate';
  el.innerHTML = `<div class="celebrate__card">
    <div class="celebrate__stars">✨</div>
    <b>Уровень ${level}!</b>
    <span>Растёте на глазах</span>
  </div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2500);
  snd.level();
}

/* ─────────────── сессия переживает перезагрузку ─────────────── */

function persistSession() {
  try {
    if (session) {
      localStorage.setItem('skillup.session', JSON.stringify({ session, lessonView, tab, screen }));
    } else {
      localStorage.removeItem('skillup.session');
    }
  } catch (e) {
    /* приватный режим — просто не сохраняем сессию */
  }
}

/* ─────────────── итоги прошлой недели ─────────────── */

function lastWeekSummary() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const last = new Date(monday);
  last.setDate(last.getDate() - 7);
  let answers = 0;
  let minutes = 0;
  let lessons = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(last);
    d.setDate(d.getDate() + i);
    const k = dayKey(d);
    answers += S.days[k] || 0;
    minutes += S.minutes[k] || 0;
    lessons += Object.values(S.lessons).filter((v) => v === k).length;
  }
  return { answers, minutes, lessons };
}

  /* ─────────────── лига недели ─────────────── */

let leagueData = null;

function screenLeague() {
  const isLogged = loggedIn();
  return `<button class="icon back" id="back-today">‹</button>
  <h1 class="h1">Лига недели</h1>
  <p class="lead">Кто набрал больше опыта за эту неделю — считается с понедельника.</p>
  ${!isLogged
    ? `<div class="card card--pad">
        <p class="muted-note" style="margin:0 0 14px">Лига сравнивает игроков по аккаунтам — войдите, чтобы участвовать. Прогресс при этом останется в телефоне.</p>
        <button class="btn btn--primary" id="to-auth">Войти или создать аккаунт</button>
      </div>`
    : leagueData === null
      ? `<div class="card card--pad"><p class="muted-note" style="margin:0">Загружаем таблицу…</p></div>`
      : leagueData.error
        ? `<div class="card card--pad"><p class="muted-note" style="margin:0">Не удалось загрузить лигу: ${esc(leagueData.error)}</p></div>`
        : leagueRows()}
  ${isLogged ? `<button class="btn btn--quiet" id="league-refresh">Обновить</button>` : ''}`;
}

function leagueRows() {
  const board = (leagueData && leagueData.board) || [];
  if (!board.length) {
    return `<div class="card card--pad"><p class="muted-note" style="margin:0">Пока в лиге пусто — наберите опыт, чтобы появиться в таблице.</p></div>`;
  }
  const medals = ['🥇', '🥈', '🥉'];
  const rows = board.slice(0, 20).map((u, i) => `
    <div class="lg__row ${u.me ? 'is-me' : ''}">
      <span class="lg__pos">${i < 3 ? medals[i] : (i + 1)}</span>
      <span class="lg__name">${esc(u.name)}${u.me ? ' <i>(вы)</i>' : ''}</span>
      <b class="lg__xp">${u.xp}</b>
    </div>`).join('');
  return `<div class="card card--pad lg">
    <div class="lg__head">Игрок · опыт за неделю</div>
    ${rows}
  </div>`;
}

async function loadLeague() {
  try {
    leagueData = await req('/skillup/league');
  } catch (e) {
    leagueData = { error: e.message };
  }
  render();
}

/* ─────────────── озвучка ─────────────── */

function speak(text, lang) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || (/[A-Za-z]{3,}/.test(text) ? 'en-US' : 'ru-RU');
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* без синтеза речи приложение работает как раньше */
  }
}

/** Озвучивать стоит фразы с латиницей — русский синтез оставим системе. */
const speakable = (text) => typeof text === 'string' && /[A-Za-z]{3,}/.test(text);

/* ─────────────── запуск ─────────────── */

/* Сессия, прерванная перезагрузкой, восстанавливается */
try {
  const saved = JSON.parse(localStorage.getItem('skillup.session') || 'null');
  if (saved && saved.session) {
    session = saved.session;
    lessonView = saved.lessonView || null;
    if (saved.tab) tab = saved.tab;
    if (saved.screen) screen = saved.screen;
  }
  localStorage.removeItem('skillup.session');
} catch (e) {
  /* повреждённая сессия — начинаем заново */
}

/* Меню и содержимое связываются внутри bind() при каждой отрисовке,
   поэтому здесь только первый запуск. */
render();

/* Сообщаем браузеру, что приложение готово к установке */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__install = e;
  const bar = document.getElementById('install');
  if (bar) bar.hidden = false;
});
