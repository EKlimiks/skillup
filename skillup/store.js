/* ═══════════════════════════════════════════════════════════════
   SkillUp — состояние и правила.

   Здесь живёт вся логика, независимая от интерфейса: интервальное
   повторение, опыт и уровни, серия дней, ежедневные задания и
   достижения. Всё хранится в localStorage, поэтому приложение
   работает без интернета и без сервера.
   ═══════════════════════════════════════════════════════════════ */

const KEY = 'skillup.v1';
const DAY = 86400000;

/**
 * Ключ дня в местном времени.
 *
 * Важно не использовать toISOString: она переводит дату в UTC, и у
 * пользователя восточнее Гринвича занятие в 2 часа ночи записалось бы
 * во вчерашний день. Считаем год, месяц и число как их видит человек.
 */
function dayKey(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

const today = () => dayKey();

/** Дата n дней назад в том же местном формате. */
const daysAgo = (n) => dayKey(new Date(Date.now() - n * DAY));

/* ─────────────── состояние ─────────────── */

function blank() {
  return {
    version: 1,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastActive: null,
    freezes: 2,
    /* сердечки как в Duolingo: ошибка — минус одно, восстанавливаются
       по одному каждые 30 минут до пяти */
    hearts: 5,
    heartsAt: 0,
    /* гемы — внутренняя валюта: верные ответы, уроки, задания.
       Тратятся в магазине на сердечки и заморозки */
    gems: 0,
    /* опыт по дням — для лиги недели */
    xpDays: {},
    /* секретные достижения: время занятий и ошибки по дням */
    lateSessions: 0,
    earlySessions: 0,
    wrongDays: {},
    /* дни, за которые уже получен сундук за идеальный день */
    chestDays: {},
    /* карточки: id → { ef, interval, due, reps, lapses } */
    cards: {},
    /* пройденные уроки: id → дата */
    lessons: {},
    /* сколько ответов за каждый день: дата → число */
    days: {},
    /* выполненные задания: дата → [id] */
    quests: {},
    /* сколько верных подряд */
    combo: 0,
    bestCombo: 0,
    /* ежедневные счётчики: минуты занятий и идеальные уроки за день */
    minutes: {},
    perfectDays: {},
    touchDays: {},
    achievements: {},
    settings: { goal: 20, reminder: false, reminderTime: '19:00', sound: true },
    stats: {
      totalAnswers: 0, correct: 0, wrong: 0,
      lessonsDone: 0, perfectLessons: 0, questsDone: 0, mastered: 0,
      focusCount: 0, focusMinutes: 0,
    },
    skillsTouched: [],
  };
}

let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    /* ЗАЩИТА: словари должны быть объектами, а не массивами. Если сервер
       когда-то отдал пустой словарь как [], строковые ключи (даты, id
       карточек) при JSON.stringify МОЛЧА выбрасываются — прогресс теряется. */
    for (const k of ['cards', 'lessons', 'days', 'quests', 'achievements',
      'xpDays', 'minutes', 'perfectDays', 'touchDays', 'chestDays']) {
      if (Array.isArray(parsed[k])) parsed[k] = {};
    }
    /* дополняем недостающие поля, если формат менялся */
    return Object.assign(blank(), parsed, {
      stats: Object.assign(blank().stats, parsed.stats || {}),
      settings: Object.assign(blank().settings, parsed.settings || {}),
    });
  } catch (e) {
    return blank();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    /* приватный режим Safari может запрещать запись — приложение
       продолжит работать, просто не сохранит прогресс */
  }
}

/* ─────────────── опыт и уровни ─────────────── */

/** Сколько опыта нужно, чтобы перейти с уровня n на следующий. */
function xpForLevel(n) {
  return 100 + (n - 1) * 50;
}

/** Текущий уровень и прогресс внутри него. */
function levelInfo(xp) {
  let level = 1;
  let left = xp;
  while (left >= xpForLevel(level)) {
    left -= xpForLevel(level);
    level++;
  }
  const need = xpForLevel(level);
  return { level, into: left, need, percent: Math.round((left / need) * 100) };
}

function addXp(n) {
  const before = levelInfo(S.xp).level;
  S.xp += n;
  /* опыт по дням нужен для лиги недели */
  const d = today();
  S.xpDays[d] = (S.xpDays[d] || 0) + n;
  const after = levelInfo(S.xp).level;
  if (after > before) {
    toast(`Уровень ${after}!`, 'level');
    /* праздничная заставка живёт в интерфейсе — вызываем, если он готов */
    if (typeof celebrate === 'function') celebrate(after);
  }
}

/** Гемы — валюта приложения. */
function addGems(n) {
  S.gems = (S.gems || 0) + n;
}

/** Завершённая фокус-сессия: опыт, минуты, гемы, статистика. */
function completeFocus(minutes) {
  S.stats.focusCount = (S.stats.focusCount || 0) + 1;
  S.stats.focusMinutes = (S.stats.focusMinutes || 0) + minutes;
  addXp(minutes * 4);
  addGems(5);
  addMinutes(minutes);
  /* фокус держит серию: день считается активным */
  touchStreak();
  checkAchievements();
  save();
}

/* ─────────────── интервальное повторение (SM-2) ─────────────── */

/**
 * Алгоритм SM-2 в упрощённом виде.
 *
 * У каждой карточки есть коэффициент лёгкости ef. Ответ «легко»
 * увеличивает его, «сложно» — уменьшает. Интервал до следующего
 * показа умножается на ef, поэтому лёгкие карточки возвращаются
 * всё реже, а трудные — часто.
 *
 * @param {number} q качество ответа: 5 легко, 4 хорошо, 3 сложно, 1 ошибка
 */
function review(cardId, q) {
  const c = S.cards[cardId] || { ef: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 };

  if (q < 3) {
    /* ошибся — карточка возвращается в самое начало */
    c.reps = 0;
    c.interval = 0;
    c.lapses++;
    c.due = Date.now() + 60000;      // показать снова через минуту
  } else {
    c.reps++;
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = 6;
    else c.interval = Math.round(c.interval * c.ef);
    c.due = Date.now() + c.interval * DAY;
  }

  c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  S.cards[cardId] = c;

  /* отметка активности за день */
  const d = today();
  S.days[d] = (S.days[d] || 0) + 1;
  S.stats.totalAnswers++;
  if (q >= 3) {
    S.stats.correct++;
    S.combo++;
    S.bestCombo = Math.max(S.bestCombo, S.combo);
    addGems(1);          // гем за верный ответ
    addXp(8);            // опыт за верный ответ — сразу, как в Duolingo
  } else {
    S.stats.wrong++;
    S.combo = 0;
    S.wrongDays[d] = (S.wrongDays[d] || 0) + 1;
  }
  /* секретные достижения: время занятий */
  const hour = new Date().getHours();
  if (hour >= 23) S.lateSessions = (S.lateSessions || 0) + 1;
  if (hour < 7) S.earlySessions = (S.earlySessions || 0) + 1;
  touchStreak();
  checkAchievements();
  save();
  return c;
}

/** Карточка считается освоенной, когда интервал перевалил за месяц. */
function isMastered(cardId) {
  const c = S.cards[cardId];
  return !!c && c.interval >= 30;
}

/** Навыки, выбранные при знакомстве. Без выбора — все. */
function pickedSkills() {
  const picked = S.settings.picked;
  if (!Array.isArray(picked) || picked.length === 0) return SKILLS;
  return SKILLS.filter((s) => picked.includes(s.id));
}

/** Карточки, которые пора повторить. */
function dueCards() {
  const now = Date.now();
  const out = [];
  for (const skill of pickedSkills()) {
    for (const lesson of skill.lessons) {
      /* повторяем только то, что уже открывали */
      if (!S.lessons[lesson.id] && !seenLesson(lesson.id)) continue;
      lesson.cards.forEach((card, i) => {
        const id = `${lesson.id}#${i}`;
        const st = S.cards[id];
        if (st && st.due <= now) {
          out.push({ id, card, lesson, skill });
        }
      });
    }
  }
  return out;
}

/** Открывал ли пользователь урок (карточки уже заведены). */
function seenLesson(lessonId) {
  return Object.keys(S.cards).some((k) => k.startsWith(lessonId + '#'));
}

/** Новые карточки из уроков, которые ещё не проходили. */
function newCards(limit) {
  const out = [];
  for (const skill of pickedSkills()) {
    for (const lesson of skill.lessons) {
      if (S.lessons[lesson.id] || seenLesson(lesson.id)) continue;
      lesson.cards.forEach((card, i) => out.push({ id: `${lesson.id}#${i}`, card, lesson, skill }));
    }
  }
  return out.slice(0, limit);
}

/* ─────────────── серия дней ─────────────── */

function touchStreak() {
  const d = today();
  if (S.lastActive === d) return;

  const yesterday = daysAgo(1);

  if (S.lastActive === yesterday) {
    S.streak++;
  } else if (S.lastActive === null) {
    S.streak = 1;
  } else {
    /* пропуск. Если есть заморозка — тратим её и серия выживает */
    const gap = Math.round((new Date(d) - new Date(S.lastActive)) / DAY);
    if (gap === 2 && S.freezes > 0) {
      S.freezes--;
      S.streak++;
      toast('Серия сохранена заморозкой', 'freeze');
    } else {
      S.streak = 1;
    }
  }
  S.lastActive = d;
  S.bestStreak = Math.max(S.bestStreak, S.streak);
}

/** Сколько дней осталось до потери серии (для подсказки). */
function streakAlive() {
  if (!S.lastActive) return false;
  const d = today();
  return S.lastActive === d || S.lastActive === daysAgo(1);
}

/* ─────────────── ежедневные задания ─────────────── */

/** Три задания на день. Выбор детерминированный: от даты зависит набор. */
function questsToday() {
  const d = today();
  if (S.quests[d] && S.quests[d].list) return S.quests[d];

  let seed = 0;
  for (const ch of d) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const picked = [];
  const pool = QUESTS.slice();
  for (let i = 0; i < 3 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    picked.push(pool.splice(seed % pool.length, 1)[0].id);
  }

  const entries = picked.map((id) => {
    const q = QUESTS.find((x) => x.id === id);
    /* часть заданий зависит от размера цели пользователя */
    const need = id === 'q-cards' ? Math.max(8, Math.round(S.settings.goal * 0.6)) : q.need;
    return { id, done: false, progress: 0, need };
  });
  S.quests[d] = { list: entries };
  save();
  return S.quests[d];
}

function questProgress(id, value) {
  const d = today();
  const q = (S.quests[d]?.list || []).find((x) => x.id === id);
  if (!q || q.done) return;
  q.progress = value;
  if (q.progress >= q.need) {
    q.done = true;
    const def = QUESTS.find((x) => x.id === id);
    addXp(def.xp);
    addGems(5);          // гемы за задание
    S.stats.questsDone++;
    toast(`Задание выполнено: ${def.text.replace('{n}', q.need)}`, 'quest');
    checkAchievements();

    /* сундук за идеальный день: все три задания дня закрыты */
    const list = S.quests[d]?.list || [];
    if (list.length === 3 && list.every((x) => x.done) && !S.chestDays[d]) {
      S.chestDays[d] = true;
      const bonus = 10 + Math.floor(Math.random() * 21);   // 10…30 гемов
      addGems(bonus);
      toast(`Сундук за идеальный день: +${bonus} 💎`, 'ach');
    }
  }
  save();
}

/** Пересчёт заданий после ответа или урока. */
function refreshQuests() {
  const d = today();
  questProgress('q-cards', S.days[d] || 0);
  questProgress('q-perfect', S.combo);
  /* «Пройти новый урок» — считаем уроки именно за сегодня */
  questProgress('q-lesson', Object.values(S.lessons).filter((v) => v === d).length);
  questProgress('q-minutes', Math.round(S.minutes[d] || 0));
  questProgress('q-nomiss', S.perfectDays[d] || 0);
  questProgress('q-skill', (S.touchDays[d] || []).length);
}

/* ─────────────── достижения ─────────────── */

function checkAchievements() {
  const snapshot = {
    stats: S.stats,
    bestStreak: S.bestStreak,
    level: levelInfo(S.xp).level,
    skillsTouched: S.skillsTouched,
    gems: S.gems || 0,
    late: S.lateSessions || 0,
    early: S.earlySessions || 0,
    /* был ли день с 10+ ответами и без единой ошибки */
    perfectDay: Object.entries(S.days).some(([k, v]) => v >= 10 && !(S.wrongDays || {})[k]),
  };
  for (const a of ACHIEVEMENTS) {
    if (S.achievements[a.id]) continue;
    let ok = false;
    try {
      ok = a.check(snapshot);
    } catch (e) {
      ok = false;
    }
    if (ok) {
      S.achievements[a.id] = Date.now();
      addXp(50);
      toast(`Достижение: ${a.name}`, 'ach');
    }
  }
  /* освоенные карточки считаем здесь же */
  let mastered = 0;
  for (const id of Object.keys(S.cards)) if (isMastered(id)) mastered++;
  S.stats.mastered = mastered;
}

/* ─────────────── уроки ─────────────── */

function completeLesson(lessonId, correct, wrong) {
  const d = today();
  const first = !S.lessons[lessonId];
  S.lessons[lessonId] = d;
  S.stats.lessonsDone++;
  if (wrong === 0) S.stats.perfectLessons++;

  /* ежедневные счётчики — по ним считаются задания дня */
  if (wrong === 0) S.perfectDays[d] = (S.perfectDays[d] || 0) + 1;
  const lesson = SKILLS.flatMap((s) => s.lessons).find((l) => l.id === lessonId);
  if (lesson) S.minutes[d] = (S.minutes[d] || 0) + (lesson.minutes || 3);

  const skill = SKILLS.find((s) => s.lessons.some((l) => l.id === lessonId));
  if (skill) {
    if (!S.skillsTouched.includes(skill.id)) S.skillsTouched.push(skill.id);
    const td = S.touchDays[d] || [];
    if (!td.includes(skill.id)) { td.push(skill.id); S.touchDays[d] = td; }
  }

  if (first) addXp(60);
  /* опыт за сами ответы начисляется в review() по каждому верному —
     здесь добавляем только бонус за прохождение урока */
  addGems(first ? 10 : 3);   // гемы за урок

  checkAchievements();
  refreshQuests();
  save();
}

/**
 * Сердечки (как в Duolingo).
 *
 * Ошибка отнимает одно сердечко, всего их пять. Каждые 30 минут
 * возвращается одно — поэтому не страшно ошибиться, но бездумно
 * кликать невыгодно. Возврат не происходит мгновенно: так есть стимул
 * отвечать вдумчиво, а не перебирать варианты.
 */
const HEART_REFILL_MS = 30 * 60000;
const HEARTS_MAX = 5;

function heartsNow() {
  if (S.hearts >= HEARTS_MAX) return HEARTS_MAX;
  const gained = Math.floor((Date.now() - (S.heartsAt || Date.now())) / HEART_REFILL_MS);
  if (gained > 0) {
    S.hearts = Math.min(HEARTS_MAX, S.hearts + gained);
    S.heartsAt = S.hearts >= HEARTS_MAX ? Date.now() : S.heartsAt + gained * HEART_REFILL_MS;
    save();
  }
  return S.hearts;
}

/** Ошибка отнимает сердечко. Возвращает, сколько осталось. */
function loseHeart() {
  const h = heartsNow();
  S.hearts = Math.max(0, h - 1);
  if (S.hearts < HEARTS_MAX && (S.heartsAt || 0) < Date.now() - 1) {
    S.heartsAt = Date.now();
  }
  save();
  return S.hearts;
}

/** Минуты занятий — для задания «Позаниматься N минут». */
function addMinutes(n) {
  const d = today();
  S.minutes[d] = (S.minutes[d] || 0) + n;
  refreshQuests();
  save();
}

/* ─────────────── статистика для экранов ─────────────── */

function skillProgress(skill) {
  let total = 0;
  let done = 0;
  let cardsSeen = 0;
  for (const lesson of skill.lessons) {
    total++;
    if (S.lessons[lesson.id]) done++;
    lesson.cards.forEach((c, i) => {
      if (S.cards[`${lesson.id}#${i}`]) cardsSeen++;
    });
  }
  const cards = skill.lessons.reduce((n, l) => n + l.cards.length, 0);
  return { lessons: total, lessonsDone: done, cards, cardsSeen, percent: Math.round((done / total) * 100) };
}

/**
 * Тепловая карта активности.
 *
 * Окно должно ЗАКАНЧИВАТЬСЯ сегодняшним днём, а не начинаться сегодня:
 * иначе последняя колонка показывает прошлую неделю и свежие занятия
 * на карте не видны. Поэтому идём от понедельника текущей недели назад.
 */
function heatmap(weeks) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const start = new Date(monday);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const end = new Date(monday);
  end.setDate(end.getDate() + 7);

  const out = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = dayKey(d);
    out.push({ date: key, count: S.days[key] || 0, future: d >= end });
  }
  return out;
}

/** Сколько дней подряд занимался пользователь (для графика). */
function activeDays(limit) {
  return Object.keys(S.days).filter((d) => S.days[d] > 0).length;
}
