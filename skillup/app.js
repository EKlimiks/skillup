/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   SkillUp вЂ” РёРЅС‚РµСЂС„РµР№СЃ.

   Р­РєСЂР°РЅС‹ РїРµСЂРµРєР»СЋС‡Р°СЋС‚СЃСЏ РІСЂСѓС‡РЅСѓСЋ, Р±РµР· Р±РёР±Р»РёРѕС‚РµРє: СЃРѕСЃС‚РѕСЏРЅРёРµ СЌРєСЂР°РЅР° РІ
   РїРµСЂРµРјРµРЅРЅРѕР№, РѕС‚СЂРёСЃРѕРІРєР° вЂ” РѕР±С‹С‡РЅС‹Рµ С„СѓРЅРєС†РёРё, СЃРѕР·РґР°СЋС‰РёРµ СЂР°Р·РјРµС‚РєСѓ.
   в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */

const app = document.getElementById('app');
let tab = 'today';
let session = null;      // С‚РµРєСѓС‰РµРµ Р·Р°РЅСЏС‚РёРµ
let lessonView = null;   // РѕС‚РєСЂС‹С‚С‹Р№ СѓСЂРѕРє
let screen = null;       // РѕС‚РґРµР»СЊРЅС‹Р№ СЌРєСЂР°РЅ: 'auth' РёР»Рё null

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СѓРІРµРґРѕРјР»РµРЅРёСЏ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function toast(text, kind) {
  const box = document.createElement('div');
  box.className = 'toast toast--' + (kind || 'info');
  box.textContent = text;
  document.getElementById('toasts').appendChild(box);
  setTimeout(() => box.classList.add('out'), 2400);
  setTimeout(() => box.remove(), 3000);
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РІСЃРїРѕРјРѕРіР°С‚РµР»СЊРЅРѕРµ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЌРєСЂР°РЅ В«РЎРµРіРѕРґРЅСЏВ» в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function screenToday() {
  const lv = levelInfo(S.xp);
  /* РїРѕРІС‚РѕСЂРµРЅРёРµ вЂ” С‚РѕР»СЊРєРѕ РІС‹СѓС‡РµРЅРЅС‹Рµ РєР°СЂС‚РѕС‡РєРё, Сѓ РєРѕС‚РѕСЂС‹С… РїРѕРґРѕС€С‘Р» СЃСЂРѕРє.
     РќРѕРІС‹Рµ РєР°СЂС‚РѕС‡РєРё РїРѕРїР°РґР°СЋС‚ СЃСЋРґР° Р»РёС€СЊ С‡РµСЂРµР· СѓСЂРѕРєРё. */
  const due = dueCards();
  const goal = S.settings.goal;
  const done = S.days[today()] || 0;
  const percent = Math.min(100, Math.round((done / goal) * 100));
  const quests = questsToday();
  const queue = due.length;
  const initial = loggedIn() && auth.user && auth.user.name
    ? auth.user.name.trim()[0].toUpperCase() : 'вє';

  const questRows = quests.list.map((q) => {
    const def = QUESTS.find((x) => x.id === q.id);
    const text = def.text.replace('{n}', q.need);
    const pct = Math.min(100, Math.round((q.progress / q.need) * 100));
    return `<div class="quest ${q.done ? 'is-done' : ''}">
      <div class="quest__ico">${q.done ? 'вњ“' : 'в—‹'}</div>
      <div class="quest__body">
        <div class="quest__text">${esc(text)}</div>
        <div class="quest__bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="quest__xp">+${def.xp}</div>
    </div>`;
  }).join('');

  return `
  <div class="topbar">
    <div class="topbar__brand">вљЎ Skill<span>Up</span></div>
    <div class="topbar__right">
      <span class="topbar__gems" title="Р“РµРјС‹ вЂ” РІР°Р»СЋС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ">рџ’Ћ ${S.gems || 0}</span>
      <button class="topbar__me" id="to-me" aria-label="РџСЂРѕС„РёР»СЊ">${esc(initial)}</button>
    </div>
  </div>

  <div class="hero">
    <div class="hero__top">
      <div>
        <div class="hero__hi">РЎРµРіРѕРґРЅСЏ</div>
        <div class="hero__streak">
          <span class="flame">рџ”Ґ</span>
          <b>${S.streak}</b> ${plural(S.streak, 'РґРµРЅСЊ', 'РґРЅСЏ', 'РґРЅРµР№')} РїРѕРґСЂСЏРґ
          ${S.freezes > 0 ? `<span class="freeze" title="Р—Р°РјРѕСЂРѕР·РєР° СЃРѕС…СЂР°РЅРёС‚ СЃРµСЂРёСЋ РїСЂРё РїСЂРѕРїСѓСЃРєРµ">вќ„ ${S.freezes}</span>` : ''}
        </div>
        <div class="hero__hearts" title="РЎРµСЂРґРµС‡РєРё: РѕС€РёР±РєР° вЂ” РјРёРЅСѓСЃ РѕРґРЅРѕ, РІРµСЂРЅС‘С‚СЃСЏ С‡РµСЂРµР· 30 РјРёРЅСѓС‚">
          ${'вќ¤пёЏ'.repeat(Math.max(0, heartsNow()))}
        </div>
      </div>
      <div class="lvl">
        ${progressRing(lv.percent, 74, 6, '#a78bfa')}
        <div class="lvl__in">
          <b>${lv.level}</b>
          <span>СѓСЂРѕРІРµРЅСЊ</span>
        </div>
      </div>
    </div>
    <div class="hero__xp">${lv.into} / ${lv.need} XP РґРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СѓСЂРѕРІРЅСЏ</div>
    <div class="hero__grow" title="Р’РёР·СѓР°Р»СЊРЅС‹Р№ РїСЂРѕРіСЂРµСЃСЃ: СЂР°СЃС‚РµРЅРёРµ СЂР°СЃС‚С‘С‚ СЃ СѓСЂРѕРІРЅРµРј">
      <span class="hero__grow-ico">${plantStage()[0]}</span>
      <span>${plantStage()[1]} В· СѓСЂРѕРІРµРЅСЊ ${lv.level}</span>
    </div>
  </div>

  <div class="card card--goal">
    <div class="goal">
      ${progressRing(percent, 120, 9, percent >= 100 ? '#4ade80' : '#a78bfa')}
      <div class="goal__in">
        <b>${done}</b>
        <span>РёР· ${goal}</span>
      </div>
    </div>
    <div class="goal__text">
      <div class="goal__title">${percent >= 100 ? 'Р¦РµР»СЊ РґРЅСЏ РІС‹РїРѕР»РЅРµРЅР°!' : 'Р¦РµР»СЊ РЅР° СЃРµРіРѕРґРЅСЏ'}</div>
      <div class="goal__sub">${percent >= 100
        ? 'РћС‚Р»РёС‡РЅР°СЏ СЂР°Р±РѕС‚Р°. РњРѕР¶РЅРѕ РїСЂРѕРґРѕР»Р¶РёС‚СЊ РёР»Рё РѕС‚РґРѕС…РЅСѓС‚СЊ.'
        : `РћСЃС‚Р°Р»РѕСЃСЊ ${goal - done} ${plural(goal - done, 'РѕС‚РІРµС‚', 'РѕС‚РІРµС‚Р°', 'РѕС‚РІРµС‚РѕРІ')}`}</div>
      <button class="btn btn--primary" id="start">
        ${queue > 0 ? `РџРѕРІС‚РѕСЂРёС‚СЊ В· ${queue} ${plural(queue, 'РєР°СЂС‚РѕС‡РєР°', 'РєР°СЂС‚РѕС‡РєРё', 'РєР°СЂС‚РѕС‡РµРє')}` : 'Р’СЃС‘ РїРѕРІС‚РѕСЂРµРЅРѕ вЂ” РЅР°С‡РЅРёС‚Рµ СѓСЂРѕРє'}
      </button>
    </div>
  </div>

  <button class="card--mapbtn" id="to-map">
    <span class="mapbtn__ico">вЊ</span>
    <span class="mapbtn__body">
      <b>РљР°СЂС‚Р° СЂР°Р·РІРёС‚РёСЏ</b>
      <i>РЈСЂРѕРєРё РѕС‚РєСЂС‹РІР°СЋС‚СЃСЏ РїРѕ РѕС‡РµСЂРµРґРё вЂ” СЃРјРѕС‚СЂРёС‚Рµ, С‡С‚Рѕ РґР°Р»СЊС€Рµ</i>
    </span>
    <span class="mapbtn__go">вЂє</span>
  </button>

  <button class="card--mapbtn" id="to-focus">
    <span class="mapbtn__ico">вЏ±</span>
    <span class="mapbtn__body">
      <b>Р РµР¶РёРј С„РѕРєСѓСЃРёСЂРѕРІРєРё</b>
      <i>РўР°Р№РјРµСЂ Р±РµР· РѕС‚РІР»РµС‡РµРЅРёР№ вЂ” Р·Р° СЃРµСЃСЃРёСЋ РѕРїС‹С‚ Рё Р°РєС‚РёРІРЅС‹Р№ РґРµРЅСЊ</i>
    </span>
    <span class="mapbtn__go">вЂє</span>
  </button>

  <h2 class="sect">Р—Р°РґР°РЅРёСЏ РЅР° РґРµРЅСЊ</h2>
  <div class="card card--pad">${questRows}</div>

  ${isMonday() ? `<h2 class="sect">РС‚РѕРіРё РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рё</h2>
  <div class="card card--pad">
    ${weekCard()}
  </div>` : ''}

  <h2 class="sect">РџСЂРѕРґРѕР»Р¶РёС‚СЊ РѕР±СѓС‡РµРЅРёРµ</h2>
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

  <h2 class="sect">РљР°Рє СЌС‚Рѕ СЂР°Р±РѕС‚Р°РµС‚</h2>
  <div class="card card--pad muted-note">
    РљР°СЂС‚РѕС‡РєРё РІРѕР·РІСЂР°С‰Р°СЋС‚СЃСЏ РїРѕ Р°Р»РіРѕСЂРёС‚РјСѓ РёРЅС‚РµСЂРІР°Р»СЊРЅРѕРіРѕ РїРѕРІС‚РѕСЂРµРЅРёСЏ: С‚Рѕ, С‡С‚Рѕ РІС‹
    РїРѕРјРЅРёС‚Рµ С…РѕСЂРѕС€Рѕ, РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ РІСЃС‘ СЂРµР¶Рµ, Р° С‚СЂСѓРґРЅРѕРµ вЂ” С‡Р°С‰Рµ. Р­С‚Рѕ СЂР°Р±РѕС‚Р°РµС‚
    РЅРµ В«РїРѕС‚РѕРјСѓ С‡С‚Рѕ РЅР°РґРѕВ», Р° РїРѕ РјР°С‚РµРјР°С‚РёРєРµ: РёРЅС‚РµСЂРІР°Р» СѓРјРЅРѕР¶Р°РµС‚СЃСЏ РЅР°
    РєРѕСЌС„С„РёС†РёРµРЅС‚ Р»С‘РіРєРѕСЃС‚Рё РєР°Р¶РґРѕР№ РєР°СЂС‚РѕС‡РєРё.
  </div>`;
}

const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

/* Р Р°СЃС‚РµРЅРёРµ РЅР° В«РЎРµРіРѕРґРЅСЏВ» СЂР°СЃС‚С‘С‚ РІРјРµСЃС‚Рµ СЃ СѓСЂРѕРІРЅРµРј */
const PLANT_STAGES = [
  ['рџЊ±', 'СЂРѕСЃС‚РѕРє'], ['рџЊї', 'РїРѕР±РµРіРё'], ['рџЄґ', 'СЂР°СЃС‚РµРЅРёРµ'],
  ['рџЊі', 'РґРµСЂРµРІРѕ'], ['рџЊІ', 'Р»РµСЃ'], ['рџЏ†', 'РІРµСЂС€РёРЅР°'],
];
const plantStage = () => PLANT_STAGES[Math.min(5, Math.floor(levelInfo(S.xp).level / 2))];

const isMonday = () => new Date().getDay() === 1;

function weekCard() {
  const w = lastWeekSummary();
  const items = [
    [w.answers, 'РѕС‚РІРµС‚РѕРІ'], [w.minutes, 'РјРёРЅСѓС‚'], [w.lessons, 'СѓСЂРѕРєРѕРІ'],
  ];
  return `<div class="wk-sum">${items.map(([v, l]) => `
    <div class="wk-sum__i"><b>${v}</b><span>${l}</span></div>`).join('')}
  </div>
  <p class="wk-sum__res">${w.answers === 0
    ? 'РќР° РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рµ Р±С‹Р»Рѕ С‚РёС…Рѕ вЂ” РЅР°С‡РЅРёС‚Рµ РЅРѕРІСѓСЋ СЃ РѕРґРЅРѕР№ РєР°СЂС‚РѕС‡РєРё.'
    : 'РҐРѕСЂРѕС€Р°СЏ РЅРµРґРµР»СЏ. РџСЂРѕРґРѕР»Р¶Р°Р№С‚Рµ РІ С‚РѕРј Р¶Рµ РґСѓС…Рµ!'}</p>`;
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЌРєСЂР°РЅ В«РќР°РІС‹РєРёВ» в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function screenSkills() {
  return `<h1 class="h1">РќР°РІС‹РєРё</h1>
  <p class="lead">Р§РµС‚С‹СЂРµ РЅР°РїСЂР°РІР»РµРЅРёСЏ. Р’РЅСѓС‚СЂРё РєР°Р¶РґРѕРіРѕ вЂ” РєРѕСЂРѕС‚РєРёРµ СѓСЂРѕРєРё РїРѕ 3вЂ“5 РјРёРЅСѓС‚.</p>
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
            <span class="lesson__dot" style="${done ? `background:${s.color}` : ''}">${locked ? 'рџ”’' : ''}</span>
            <span class="lesson__body">
              <span class="lesson__title">${esc(l.title)}</span>
              <span class="lesson__sub">${l.cards.length} ${plural(l.cards.length, 'РєР°СЂС‚РѕС‡РєР°', 'РєР°СЂС‚РѕС‡РєРё', 'РєР°СЂС‚РѕС‡РµРє')} В· ${l.minutes} РјРёРЅ${opened && !done ? ' В· РЅР°С‡Р°С‚' : ''}${locked ? ' В· Р·Р°РєСЂС‹С‚' : ''}</span>
            </span>
            <span class="lesson__go">${locked ? 'рџ”’' : 'вЂє'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }).join('')}`;
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЌРєСЂР°РЅ В«РЎС‚Р°С‚РёСЃС‚РёРєР°В» в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function screenStats() {
  const cells = heatmap(18);
  const total = S.stats.totalAnswers;
  const acc = total ? Math.round((S.stats.correct / total) * 100) : 0;
  const lv = levelInfo(S.xp);

  const heat = cells.map((c) => {
    const lvl = c.count === 0 ? 0 : c.count < 6 ? 1 : c.count < 14 ? 2 : c.count < 26 ? 3 : 4;
    return `<i class="cell cell--${c.future ? 'x' : lvl}" title="${c.date}: ${c.count}"></i>`;
  }).join('');

  return `<h1 class="h1">РЎС‚Р°С‚РёСЃС‚РёРєР°</h1>
  <div class="grid2">
    ${statCard(total, 'РІСЃРµРіРѕ РѕС‚РІРµС‚РѕРІ')}
    ${statCard(acc + '%', 'РїСЂР°РІРёР»СЊРЅС‹С…')}
    ${statCard(S.bestStreak, 'Р»СѓС‡С€Р°СЏ СЃРµСЂРёСЏ')}
    ${statCard(S.stats.lessonsDone, 'СѓСЂРѕРєРѕРІ РїСЂРѕР№РґРµРЅРѕ')}
    ${statCard(activeDays(), 'РґРЅРµР№ Р·Р°РЅСЏС‚РёР№')}
    ${statCard(lv.level, 'СѓСЂРѕРІРµРЅСЊ')}
  </div>

  <h2 class="sect">РђРєС‚РёРІРЅРѕСЃС‚СЊ Р·Р° 18 РЅРµРґРµР»СЊ</h2>
  <div class="card card--pad">
    <div class="heat">${heat}</div>
    <div class="heat__legend">
      <span>РјРµРЅСЊС€Рµ</span>
      <i class="cell cell--0"></i><i class="cell cell--1"></i><i class="cell cell--2"></i>
      <i class="cell cell--3"></i><i class="cell cell--4"></i>
      <span>Р±РѕР»СЊС€Рµ</span>
    </div>
  </div>

  <h2 class="sect">РљР°СЂС‚РѕС‡РєРё РїРѕ СѓСЂРѕРІРЅСЏРј</h2>
  <div class="card card--pad">${cardBreakdown()}</div>

  <h2 class="sect">РЎСЂР°РІРЅРµРЅРёРµ РЅРµРґРµР»СЊ</h2>
  <div class="card card--pad">${weekCompare()}</div>`;
}

/**
 * РЎСЂР°РІРЅРµРЅРёРµ С‚РµРєСѓС‰РµР№ РЅРµРґРµР»Рё СЃ РїСЂРѕС€Р»РѕР№: РІРёРґРЅРѕ, СЃС‚Р°Р»Рѕ Р»Рё Р·Р°РЅРёРјР°С‚СЊСЃСЏ
 * Р±РѕР»СЊС€Рµ РёР»Рё РЅР°СЃС‚СѓРїРёР» СЃРїР°Рґ.
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
      <span class="wk__k">Р­С‚Р° РЅРµРґРµР»СЏ</span>
      <span class="wk__bar"><i style="width:${(thisWeek / max) * 100}%"></i></span>
      <b class="wk__v">${thisWeek}</b>
    </div>
    <div class="wk__row">
      <span class="wk__k">РџСЂРѕС€Р»Р°СЏ</span>
      <span class="wk__bar wk__bar--dim"><i style="width:${(lastWeek / max) * 100}%"></i></span>
      <b class="wk__v">${lastWeek}</b>
    </div>
  </div>
  <div class="wk__res ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">
    ${lastWeek === 0 && thisWeek === 0
      ? 'РџРѕРєР° РЅРµС‚ РґР°РЅРЅС‹С… Р·Р° СЌС‚Рё РЅРµРґРµР»Рё'
      : diff > 0
        ? `РќР° ${diff} ${plural(diff, 'РѕС‚РІРµС‚', 'РѕС‚РІРµС‚Р°', 'РѕС‚РІРµС‚РѕРІ')} Р±РѕР»СЊС€Рµ, С‡РµРј РЅР° РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рµ (+${pct}%)`
        : diff < 0
          ? `РќР° ${-diff} ${plural(-diff, 'РѕС‚РІРµС‚', 'РѕС‚РІРµС‚Р°', 'РѕС‚РІРµС‚РѕРІ')} РјРµРЅСЊС€Рµ, С‡РµРј РЅР° РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рµ`
          : 'РЎС‚РѕР»СЊРєРѕ Р¶Рµ, СЃРєРѕР»СЊРєРѕ РЅР° РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рµ'}
  </div>`;
}

function statCard(value, label) {
  return `<div class="stat"><b>${value}</b><span>${label}</span></div>`;
}

function cardBreakdown() {
  const buckets = { 'РЅРѕРІС‹Рµ': 0, '1вЂ“6 РґРЅРµР№': 0, '1вЂ“4 РЅРµРґРµР»Рё': 0, 'Р±РѕР»СЊС€Рµ РјРµСЃСЏС†Р°': 0 };
  for (const skill of SKILLS) {
    for (const lesson of skill.lessons) {
      lesson.cards.forEach((c, i) => {
        const st = S.cards[`${lesson.id}#${i}`];
        if (!st) return;
        if (st.interval === 0) buckets['РЅРѕРІС‹Рµ']++;
        else if (st.interval <= 6) buckets['1вЂ“6 РґРЅРµР№']++;
        else if (st.interval < 30) buckets['1вЂ“4 РЅРµРґРµР»Рё']++;
        else buckets['Р±РѕР»СЊС€Рµ РјРµСЃСЏС†Р°']++;
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЌРєСЂР°РЅ В«РќР°РіСЂР°РґС‹В» в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function screenAwards() {
  /* СЃРµРєСЂРµС‚РЅС‹Рµ РґРѕСЃС‚РёР¶РµРЅРёСЏ РЅРµ РІРёРґРЅС‹, РїРѕРєР° РЅРµ РѕС‚РєСЂС‹С‚С‹ */
  const visible = ACHIEVEMENTS.filter((a) => !a.hidden || S.achievements[a.id]);
  const got = Object.keys(S.achievements).length;
  return `<h1 class="h1">РќР°РіСЂР°РґС‹</h1>
  <p class="lead">РћС‚РєСЂС‹С‚Рѕ ${got} РёР· ${ACHIEVEMENTS.length}. РЎРµРєСЂРµС‚РЅС‹Рµ РїРѕСЏРІР»СЏСЋС‚СЃСЏ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РѕС‚РєСЂС‹С‚РёСЏ.</p>
  <div class="awards">
    ${visible.map((a) => {
      const on = !!S.achievements[a.id];
      return `<div class="award ${on ? 'is-on' : ''}">
        <div class="award__ico">${on ? a.icon : 'рџ”’'}</div>
        <div class="award__name">${esc(a.name)}</div>
        <div class="award__text">${esc(a.text)}</div>
        ${on ? `<div class="award__date">${new Date(S.achievements[a.id]).toLocaleDateString('ru-RU')}</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЌРєСЂР°РЅ В«РЇВ» в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

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
          <b>${esc(auth.user?.name || 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ')}</b>
          <i>${esc(auth.user?.email || '')}</i>
          <span class="synced"></span>
        </div>
      </div>
      <div class="card card--pad">
        <p class="muted-note" style="margin:0 0 14px">
          РџСЂРѕРіСЂРµСЃСЃ СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ РІ Р°РєРєР°СѓРЅС‚ Рё РїРµСЂРµРЅРѕСЃРёС‚СЃСЏ РјРµР¶РґСѓ СѓСЃС‚СЂРѕР№СЃС‚РІР°РјРё:
          РЅР°С‡Р°Р»Рё РЅР° С‚РµР»РµС„РѕРЅРµ вЂ” РїСЂРѕРґРѕР»Р¶РёР»Рё РЅР° РєРѕРјРїСЊСЋС‚РµСЂРµ.
        </p>
        <button class="btn btn--ghost" id="sync-now">РЎРѕС…СЂР°РЅРёС‚СЊ СЃРµР№С‡Р°СЃ</button>
        <button class="btn btn--quiet" id="logout">Р’С‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°</button>
        <button class="btn btn--quiet danger" id="del-acc">РЈРґР°Р»РёС‚СЊ Р°РєРєР°СѓРЅС‚ Рё РґР°РЅРЅС‹Рµ</button>
      </div>`
    : `<div class="card card--pad">
        <b class="me__h">РђРєРєР°СѓРЅС‚</b>
        <p class="muted-note">РЎРµР№С‡Р°СЃ РїСЂРѕРіСЂРµСЃСЃ С…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ СЌС‚РѕРј С‚РµР»РµС„РѕРЅРµ.
        РђРєРєР°СѓРЅС‚ РїРѕР·РІРѕР»РёС‚ РїРµСЂРµРЅРѕСЃРёС‚СЊ РµРіРѕ РјРµР¶РґСѓ СѓСЃС‚СЂРѕР№СЃС‚РІР°РјРё Рё РЅРµ РїРѕС‚РµСЂСЏС‚СЊ
        РїСЂРё РѕС‡РёСЃС‚РєРµ Р±СЂР°СѓР·РµСЂР°.</p>
        <button class="btn btn--primary" id="to-auth">Р’РѕР№С‚Рё РёР»Рё СЃРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚</button>
      </div>`;

  return `<button class="icon back" id="back-today">вЂ№</button>
  <h1 class="h1">РџСЂРѕС„РёР»СЊ</h1>

  ${account}

  <div class="btn-row" style="margin-top:14px">
    <button class="btn btn--ghost" id="to-stats">РЎС‚Р°С‚РёСЃС‚РёРєР°</button>
    <button class="btn btn--ghost" id="to-awards">РќР°РіСЂР°РґС‹ В· ${got}</button>
  </div>

  <div class="grid2" style="margin-top:14px">
    ${statCard(lv.level, 'СѓСЂРѕРІРµРЅСЊ')}
    ${statCard(S.xp, 'РѕРїС‹С‚Р°')}
    ${statCard(S.streak, 'СЃРµСЂРёСЏ РґРЅРµР№')}
    ${statCard(acc + '%', 'С‚РѕС‡РЅРѕСЃС‚СЊ')}
    ${statCard(got, 'РЅР°РіСЂР°РґС‹')}
    ${statCard(S.stats.mastered, 'РѕСЃРІРѕРµРЅРѕ')}
  </div>

  <h2 class="sect">РќР°СЃС‚СЂРѕР№РєРё</h2>
  <div class="card card--pad">
    <label class="row">
      <span>Р¦РµР»СЊ РІ РґРµРЅСЊ</span>
      <input type="range" id="goal" min="5" max="60" step="5" value="${S.settings.goal}">
      <b id="goalVal">${S.settings.goal}</b>
    </label>
    <label class="row">
      <span>РќР°РїРѕРјРёРЅР°РЅРёРµ РІРµС‡РµСЂРѕРј</span>
      <input type="checkbox" id="remind" ${S.settings.reminder ? 'checked' : ''}>
    </label>
    <label class="row">
      <span>Р—РІСѓРєРё Рё РІРёР±СЂР°С†РёСЏ</span>
      <input type="checkbox" id="sound" ${S.settings.sound !== false ? 'checked' : ''}>
    </label>
    <button class="btn btn--quiet" id="redo-onboard">РџСЂРѕР№С‚Рё Р·РЅР°РєРѕРјСЃС‚РІРѕ Р·Р°РЅРѕРІРѕ</button>
    <button class="btn btn--quiet" id="to-qr">QR-РєРѕРґ РґР»СЏ СѓСЃС‚Р°РЅРѕРІРєРё</button>
    <button class="btn btn--quiet" id="export">РЎРєР°С‡Р°С‚СЊ РїСЂРѕРіСЂРµСЃСЃ С„Р°Р№Р»РѕРј</button>
    <button class="btn btn--quiet" id="import">Р—Р°РіСЂСѓР·РёС‚СЊ РїСЂРѕРіСЂРµСЃСЃ РёР· С„Р°Р№Р»Р°</button>
    <input type="file" id="import-file" accept=".json,application/json" style="display:none">
    <button class="btn btn--quiet danger" id="reset">РЎР±СЂРѕСЃРёС‚СЊ РІРµСЃСЊ РїСЂРѕРіСЂРµСЃСЃ</button>
  </div>

  <h2 class="sect">РЈСЃС‚Р°РЅРѕРІРєР° РЅР° С‚РµР»РµС„РѕРЅ</h2>
  <div class="card card--pad">
    <p class="muted-note" style="margin:0 0 12px">РџСЂРёР»РѕР¶РµРЅРёРµ СЃС‚Р°РІРёС‚СЃСЏ РЅР° РґРѕРјР°С€РЅРёР№ СЌРєСЂР°РЅ: СЃРІРѕСЏ РёРєРѕРЅРєР°, РїРѕР»РЅС‹Р№ СЌРєСЂР°РЅ, СЂР°Р±РѕС‚Р° Р±РµР· РёРЅС‚РµСЂРЅРµС‚Р°.</p>
    <button class="btn btn--ghost" id="install-app" style="display:none">РЈСЃС‚Р°РЅРѕРІРёС‚СЊ РїСЂРёР»РѕР¶РµРЅРёРµ</button>
    <p class="muted-note" id="install-hint" style="display:none;margin:0">
      Android: Chrome РїСЂРµРґР»РѕР¶РёС‚ СѓСЃС‚Р°РЅРѕРІРєСѓ СЃР°Рј вЂ” РјРµРЅСЋ В«в‹®В» в†’ В«РЈСЃС‚Р°РЅРѕРІРёС‚СЊ РїСЂРёР»РѕР¶РµРЅРёРµВ».
      iPhone: Safari в†’ В«РџРѕРґРµР»РёС‚СЊСЃСЏВ» в†’ В«РќР° СЌРєСЂР°РЅ Р”РѕРјРѕР№В».
      QR-РєРѕРґ РґР»СЏ СЃРєР°РЅРёСЂРѕРІР°РЅРёСЏ вЂ” <a href="qr.html" style="color:var(--accent)">Р·РґРµСЃСЊ</a>.
    </p>
  </div>

  <h2 class="sect">РњР°РіР°Р·РёРЅ</h2>
  <div class="card card--pad">
    <p class="muted-note" style="margin:0 0 12px">РЈ РІР°СЃ рџ’Ћ <b style="color:var(--text)">${S.gems || 0}</b>. Р“РµРјС‹ РґР°СЋС‚СЃСЏ Р·Р° РІРµСЂРЅС‹Рµ РѕС‚РІРµС‚С‹, СѓСЂРѕРєРё, Р·Р°РґР°РЅРёСЏ Рё С„РѕРєСѓСЃ.</p>
    <div class="shop">
      <div class="shop__i">
        <div class="shop__ico">вќ¤пёЏ</div>
        <div class="shop__body">
          <b>Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ СЃРµСЂРґРµС‡РєРё</b>
          <i>РЎСЂР°Р·Сѓ 5 РёР· 5 вЂ” РЅРµ Р¶РґР°С‚СЊ РїРѕР»С‡Р°СЃР°</i>
        </div>
        <button class="shop__buy" id="buy-hearts" ${heartsNow() >= 5 ? 'disabled' : ''}>30 рџ’Ћ</button>
      </div>
      <div class="shop__i">
        <div class="shop__ico">вќ„пёЏ</div>
        <div class="shop__body">
          <b>Р—Р°РјРѕСЂРѕР·РєР° СЃРµСЂРёРё</b>
          <i>РЎРїР°СЃС‘С‚ СЃРµСЂРёСЋ РїСЂРё РїСЂРѕРїСѓСЃРєРµ В· СЃРµР№С‡Р°СЃ ${S.freezes}</i>
        </div>
        <button class="shop__buy" id="buy-freeze">20 рџ’Ћ</button>
      </div>
    </div>
  </div>

  <h2 class="sect">Р›РёРіР° РЅРµРґРµР»Рё</h2>
  <div class="card card--pad">
    <p class="muted-note" style="margin:0 0 12px">РЎРѕСЂРµРІРЅРѕРІР°РЅРёРµ РїРѕ РѕРїС‹С‚Сѓ Р·Р° РЅРµРґРµР»СЋ. РќСѓР¶РµРЅ Р°РєРєР°СѓРЅС‚ вЂ” С‚Р°Р±Р»РёС†Р° СЃС‡РёС‚Р°РµС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂРµ РјРµР¶РґСѓ РІСЃРµРјРё РёРіСЂРѕРєР°РјРё.</p>
    <button class="btn btn--ghost" id="to-league">РћС‚РєСЂС‹С‚СЊ Р»РёРіСѓ</button>
  </div>

  <h2 class="sect">Рћ РїСЂРёР»РѕР¶РµРЅРёРё</h2>
  <div class="card card--pad muted-note">
    <p style="margin:0 0 10px"><b style="color:var(--text)">SkillUp</b> вЂ” РєРѕСЂРѕС‚РєРёРµ СѓСЂРѕРєРё
    СЃ РёРЅС‚РµСЂРІР°Р»СЊРЅС‹Рј РїРѕРІС‚РѕСЂРµРЅРёРµРј. РљР°СЂС‚РѕС‡РєРё РІРѕР·РІСЂР°С‰Р°СЋС‚СЃСЏ РїРѕ Р°Р»РіРѕСЂРёС‚РјСѓ SM-2:
    С‚Рѕ, С‡С‚Рѕ РІС‹ РїРѕРјРЅРёС‚Рµ С…РѕСЂРѕС€Рѕ, РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ СЂРµР¶Рµ, Р° С‚СЂСѓРґРЅРѕРµ вЂ” С‡Р°С‰Рµ.</p>
    <p style="margin:0">Р Р°Р±РѕС‚Р°РµС‚ Р±РµР· РёРЅС‚РµСЂРЅРµС‚Р°. РџСЂРѕРіСЂРµСЃСЃ С…СЂР°РЅРёС‚СЃСЏ РІ С‚РµР»РµС„РѕРЅРµ,
    Р° СЃ Р°РєРєР°СѓРЅС‚РѕРј вЂ” РµС‰С‘ Рё РЅР° СЃРµСЂРІРµСЂРµ.</p>
  </div>`;
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ Р·Р°РЅСЏС‚РёРµ РєР°СЂС‚РѕС‡РєР°РјРё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function startSession() {
  /* РџСЂР°РєС‚РёРєР° вЂ” С‚РѕР»СЊРєРѕ РєР°СЂС‚РѕС‡РєРё, Сѓ РєРѕС‚РѕСЂС‹С… РїРѕРґРѕС€С‘Р» СЃСЂРѕРє РїРѕРІС‚РѕСЂРµРЅРёСЏ.
     РќРѕРІС‹Рµ РєР°СЂС‚РѕС‡РєРё РёР·СѓС‡Р°СЋС‚СЃСЏ РІ СѓСЂРѕРєР°С…, Р° РЅРµ В«РІ Р»РѕР±В». */
  const due = dueCards();
  if (!due.length) {
    toast('Р’СЃС‘ РїРѕРІС‚РѕСЂРµРЅРѕ вЂ” РѕС‚РєСЂРѕР№С‚Рµ РЅРѕРІС‹Р№ СѓСЂРѕРє', 'info');
    tab = 'skills';
    render();
    return;
  }
  session = { queue: due, index: 0, revealed: false, correct: 0, wrong: 0, gems: 0, startedAt: Date.now() };
  render();
}

/* РќРѕСЂРјР°Р»РёР·Р°С†РёСЏ РѕС‚РІРµС‚Р°: СЂРµРіРёСЃС‚СЂ, Р·РЅР°РєРё РїСЂРµРїРёРЅР°РЅРёСЏ Рё Р»РёС€РЅРёРµ РїСЂРѕР±РµР»С‹
   РЅРµ СЃС‡РёС‚Р°СЋС‚СЃСЏ РѕС€РёР±РєРѕР№ вЂ” В«To GoВ», В«to go!В» Рё В«to  goВ» СЂР°РІРЅРѕС†РµРЅРЅС‹. */
const normAns = (s) => String(s || '').toLowerCase()
  .replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();

/**
 * РџСЂРѕРІРµСЂРєР° РѕС‚РІРµС‚Р°. РЎС‚СЂРѕРіР°СЏ СЃРІРµСЂРєР° СЂР°Р·РґСЂР°Р¶Р°РµС‚: В«7 С‡Р°СЃРѕРІВ» Рё В«70В» вЂ” С‚РѕР¶Рµ
 * РїСЂР°РІРёР»СЊРЅС‹Рµ РѕС‚РІРµС‚С‹. РџРѕСЌС‚РѕРјСѓ РєСЂРѕРјРµ С‚РѕС‡РЅРѕРіРѕ СЃРѕРІРїР°РґРµРЅРёСЏ СЂР°Р±РѕС‚Р°СЋС‚:
 *   вЂў С‡РёСЃР»Р° вЂ” С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ С‡РёСЃР»Р° РёР»Рё РїРѕРїР°РґР°РЅРёРµ РІ РґРёР°РїР°Р·РѕРЅ (В«60вЂ“80В»);
 *   вЂў СЃР»РѕРІР° вЂ” РІР°СЂРёР°РЅС‚ РґРѕР»Р¶РµРЅ РІСЃС‚СЂРµС‚РёС‚СЊСЃСЏ РІ РѕС‚РІРµС‚Рµ С†РµР»С‹Рј СЃР»РѕРІРѕРј
 *     (В«РјРѕР·РіВ» Р·Р°СЃС‡РёС‚Р°РµС‚ В«СЌС‚Рѕ РјРѕР·РіВ», РЅРѕ РЅРµ В«РјРѕР·Р¶РµС‡РѕРєВ»).
 */
function checkAnswer(given, accept) {
  const g = normAns(given);
  if (!g) return false;
  for (const raw of accept || []) {
    const n = normAns(raw);
    if (!n) continue;
    if (g === n) return true;

    /* С‡РёСЃР»РѕРІРѕР№ РѕС‚РІРµС‚ */
    const numG = g.match(/\d+(?:[.,]\d+)?/);
    const numsA = n.match(/\d+(?:[.,]\d+)?/g) || [];
    if (numG && numsA.length) {
      const v = Number(numG[0]);
      if (numsA.some((x) => Number(x) === v)) return true;
      if (numsA.length >= 2 && v >= Number(numsA[0]) && v <= Number(numsA[numsA.length - 1])) return true;
      continue;
    }

    /* СЃР»РѕРІРµСЃРЅС‹Р№ РѕС‚РІРµС‚ вЂ” С†РµР»С‹Рј СЃР»РѕРІРѕРј */
    const re = new RegExp('(^|\\s)' + n + '(\\s|$)');
    if (n.length >= 3 && re.test(g)) return true;
    const re2 = new RegExp('(^|\\s)' + g + '(\\s|$)');
    if (g.length >= 3 && re2.test(n)) return true;
  }
  return false;
}

/** РћС†РµРЅРєР° РѕС‚РІРµС‚Р° Р»СЋР±РѕРіРѕ С‚РёРїР°: РІРµСЂРЅРѕ в†’ q=4, РѕС€РёР±РєР° в†’ q=1 Рё РјРёРЅСѓСЃ СЃРµСЂРґРµС‡РєРѕ. */
function gradeAnswer(ok, picked) {
  const item = session.queue[session.index];
  const fresh = !S.cards[item.id];
  if (ok) {
    session.correct++;
    if (fresh) session.gems = (session.gems || 0) + 1;
  } else {
    session.wrong++;
    loseHeart();
  }
  review(item.id, ok ? 4 : 1);
  session.answer = { ok, picked };
  if (!ok) session.queue.push(item);   // РѕС€РёР±СЃСЏ вЂ” РєР°СЂС‚РѕС‡РєР° РІРµСЂРЅС‘С‚СЃСЏ РІ РєРѕРЅС†Рµ Р·Р°РЅСЏС‚РёСЏ
  /* РѕС‚РєР»РёРє: Р·РІСѓРє Рё Р»С‘РіРєР°СЏ РІРёР±СЂР°С†РёСЏ РЅР° РѕС€РёР±РєРµ (Android) */
  if (ok) snd.ok(); else { snd.bad(); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
  render();
  scheduleSync();
  /* СЃРµСЂРґРµС‡РєРё РєРѕРЅС‡РёР»РёСЃСЊ вЂ” Р·Р°РЅСЏС‚РёРµ РЅР° РїР°СѓР·Рµ СЃ СЌРєСЂР°РЅРѕРј РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ */
  if (S.hearts <= 0) {
    screen = 'nohearts';
    render();
  }
}

/** РџР»Р°С€РєР° СЂРµР·СѓР»СЊС‚Р°С‚Р° СЃ РїСЂР°РІРёР»СЊРЅС‹Рј РѕС‚РІРµС‚РѕРј Рё РѕР±СЉСЏСЃРЅРµРЅРёРµРј. */
function feedbackHtml(ok, card) {
  const right = card.options ? esc(card.options[card.a]) : (card.a != null ? esc(card.a) : '');
  const sound = !card.options && speakable(card.a)
    ? ' <button class="speak" id="speak" title="РџСЂРѕРёР·РЅРµСЃС‚Рё">рџ”Љ</button>' : '';
  return `<div class="fb ${ok ? 'fb--ok' : 'fb--bad'}">
    <b>${ok ? 'Р’РµСЂРЅРѕ!' : 'РќРµРІРµСЂРЅРѕ'}</b>
    ${!ok && right ? ` вЂ” РїСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚: <b>${right}</b>${sound}` : (ok && sound ? sound : '')}
    ${card.explain ? `<span class="fb__ex">${esc(card.explain)}</span>` : ''}
  </div>
  <button class="btn btn--primary" id="next">РџСЂРѕРґРѕР»Р¶РёС‚СЊ</button>`;
}

/** РЎРѕРґРµСЂР¶РёРјРѕРµ РєР°СЂС‚РѕС‡РєРё Р·Р°РІРёСЃРёС‚ РѕС‚ С‚РёРїР° РІРѕРїСЂРѕСЃР°. */
function sessionBody(item) {
  const card = item.card || {};
  const type = card.type || 'flip';
  const ans = session.answer || null;

  if (type === 'choice') {
    /* РІР°СЂРёР°РЅС‚С‹ РїРµСЂРµРјРµС€РёРІР°СЋС‚СЃСЏ, РЅРѕ РїРѕСЂСЏРґРѕРє Р·Р°РїРѕРјРёРЅР°РµС‚СЃСЏ: РїСЂРё РїРѕРІС‚РѕСЂРЅРѕР№
       РѕС‚СЂРёСЃРѕРІРєРµ СЌС‚РѕР№ Р¶Рµ РєР°СЂС‚РѕС‡РєРё (РїР»Р°С€РєР° СЂРµР·СѓР»СЊС‚Р°С‚Р°) РєРЅРѕРїРєРё РЅРµ РїСЂС‹РіР°СЋС‚ */
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
          autocapitalize="off" autofocus placeholder="РќР°РїРёС€РёС‚Рµ РѕС‚РІРµС‚">
        <button class="btn btn--primary" id="check">РџСЂРѕРІРµСЂРёС‚СЊ</button>`}
      ${ans ? feedbackHtml(ans.ok, card) : ''}`;
  }

  if (type === 'build') {
    /* РїР»РёС‚РєРё-СЃР»РѕРІР° РєР°Рє РІ Duolingo: СЃРѕР±РёСЂР°РµРј С„СЂР°Р·Сѓ РїРѕСЃС‚СѓРєРёРІР°РЅРёРµРј.
       РџРѕСЂСЏРґРѕРє РїР»РёС‚РѕРє РїРµСЂРµРјРµС€РёРІР°РµС‚СЃСЏ Рё Р·Р°РїРѕРјРёРЅР°РµС‚СЃСЏ, С‡С‚РѕР±С‹ РїСЂРё
       РїРµСЂРµСЂРёСЃРѕРІРєРµ РєР°СЂС‚РѕС‡РєРё РѕРЅРё РЅРµ РїСЂС‹РіР°Р»Рё. */
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
        <div class="tiles__row">${answerRow || '<span class="tiles__empty">РЎРѕР±РёСЂР°Р№С‚Рµ РѕС‚РІРµС‚ Р·РґРµСЃСЊ</span>'}</div>
        <div class="tiles__row tiles__pool">${pool}</div>
      </div>
      ${ans ? '' : `<button class="btn btn--primary" id="check-build" ${chosen.length ? '' : 'disabled'}>РџСЂРѕРІРµСЂРёС‚СЊ</button>`}
      ${ans ? feedbackHtml(ans.ok, card) : ''}`;
  }

  /* flip вЂ” С‡РµСЃС‚РЅР°СЏ СЃР°РјРѕРїСЂРѕРІРµСЂРєР° */
  return `<div class="flip__q">${esc(card.q)}</div>
    ${session.revealed
      ? `<div class="flip__a">${esc(card.a)}${speakable(card.a) ? ' <button class="speak" id="speak" title="РџСЂРѕРёР·РЅРµСЃС‚Рё">рџ”Љ</button>' : ''}</div>
         <div class="flip__hint">${esc(card.hint || '')}</div>`
      : `<button class="btn btn--primary" id="reveal">РџРѕРєР°Р·Р°С‚СЊ РѕС‚РІРµС‚</button>`}`;
}

function screenSession() {
  const item = session.queue[session.index];
  if (!item) return sessionDone();

  const pct = Math.round((session.index / session.queue.length) * 100);
  const st = S.cards[item.id];
  const isNew = !st;
  const type = (item.card && item.card.type) || 'flip';
  const typeLabel = type === 'choice' ? 'РІС‹Р±РѕСЂ' : type === 'type' ? 'РІРІРѕРґ'
    : type === 'build' ? 'СЃРѕР±РµСЂРё С„СЂР°Р·Сѓ' : 'СЃР°РјРѕРїСЂРѕРІРµСЂРєР°';

  return `<div class="sess">
    <div class="sess__top">
      <button class="icon" id="quit">вњ•</button>
      <div class="sess__bar"><i style="width:${pct}%"></i></div>
      <div class="sess__count"><span class="hearts" title="РЎРµСЂРґРµС‡РєРё">${'вќ¤пёЏ'.repeat(Math.max(0, heartsNow()))}</span> В· ${session.correct}вњ“ ${session.wrong}вњ— В· ${session.index + 1}/${session.queue.length}</div>
    </div>

    <div class="sess__skill" style="color:${item.skill.color}">
      ${item.skill.icon} ${esc(item.skill.name)} В· ${esc(item.lesson.title)}
      ${isNew ? '<span class="tag">РЅРѕРІР°СЏ</span>' : ''}
      <span class="tag">${typeLabel}</span>
    </div>

    <div class="flip ${type === 'flip' && session.revealed ? 'is-open' : ''}" id="flip">
      ${sessionBody(item)}
    </div>

    ${type === 'flip' && session.revealed ? `
      <div class="rate">
        <div class="rate__label">РќР°СЃРєРѕР»СЊРєРѕ Р»РµРіРєРѕ РІСЃРїРѕРјРЅРёР»РѕСЃСЊ?</div>
        <div class="rate__row">
          <button class="rate__b rate__b--bad" data-q="1">Р—Р°Р±С‹Р»</button>
          <button class="rate__b rate__b--hard" data-q="3">РЎР»РѕР¶РЅРѕ</button>
          <button class="rate__b rate__b--good" data-q="4">РҐРѕСЂРѕС€Рѕ</button>
          <button class="rate__b rate__b--easy" data-q="5">Р›РµРіРєРѕ</button>
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
    <div class="done__ico">рџЋ‰</div>
    <h1 class="h1">Р—Р°РЅСЏС‚РёРµ Р·Р°РІРµСЂС€РµРЅРѕ</h1>
    <p class="lead">${session.queue.length} ${plural(session.queue.length, 'РєР°СЂС‚РѕС‡РєР°', 'РєР°СЂС‚РѕС‡РєРё', 'РєР°СЂС‚РѕС‡РµРє')} Р·Р° ${Math.max(1, Math.round(secs / 60))} РјРёРЅ</p>
    <div class="grid3">
      ${statCard(session.correct, 'РІРµСЂРЅРѕ')}
      ${statCard(session.wrong, 'РѕС€РёР±РѕРє')}
      ${statCard(acc + '%', 'С‚РѕС‡РЅРѕСЃС‚СЊ')}
    </div>
    <div class="done__gain">+${session.correct * 8} XP В· +${session.gems || 0} рџ’Ћ</div>
    <button class="btn btn--primary" id="done">РџСЂРѕРґРѕР»Р¶РёС‚СЊ</button>
  </div>`;
}

/* РџР°СѓР·Р°, РєРѕРіРґР° РєРѕРЅС‡РёР»РёСЃСЊ СЃРµСЂРґРµС‡РєРё. Р—Р°РЅСЏС‚РёРµ РЅРµ С‚РµСЂСЏРµС‚СЃСЏ:
   РїРѕСЃР»Рµ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РїСЂРѕРґРѕР»Р¶Р°РµРј СЃ С‚РѕР№ Р¶Рµ РєР°СЂС‚РѕС‡РєРё. */
function screenNoHearts() {
  const canBuy = (S.gems || 0) >= 30;
  return `<div class="done">
    <div class="done__ico">рџ’”</div>
    <h1 class="h1">РЎРµСЂРґРµС‡РєРё Р·Р°РєРѕРЅС‡РёР»РёСЃСЊ</h1>
    <p class="lead">РћРґРЅРѕ СЃРµСЂРґРµС‡РєРѕ РІРѕР·РІСЂР°С‰Р°РµС‚СЃСЏ РєР°Р¶РґС‹Рµ 30 РјРёРЅСѓС‚. Р—Р°РЅСЏС‚РёРµ РЅР° РїР°СѓР·Рµ вЂ” РїСЂРѕРіСЂРµСЃСЃ РЅРµ РїРѕС‚РµСЂСЏРЅ.</p>
    ${canBuy
      ? `<button class="btn btn--primary" id="hearts-buy">Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ Р·Р° 30 рџ’Ћ</button>`
      : `<div class="card card--pad muted-note" style="margin:14px 0">РЈ РІР°СЃ ${S.gems || 0} рџ’Ћ вЂ” РЅСѓР¶РЅРѕ 30. Р“РµРјС‹ РґР°СЋС‚СЃСЏ Р·Р° РІРµСЂРЅС‹Рµ РѕС‚РІРµС‚С‹, СѓСЂРѕРєРё Рё Р·Р°РґР°РЅРёСЏ.</div>`}
    <button class="btn btn--quiet" id="hearts-quit">Р—Р°РІРµСЂС€РёС‚СЊ Р·Р°РЅСЏС‚РёРµ</button>
  </div>`;
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СѓСЂРѕРє в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function screenLesson() {
  const skill = SKILLS.find((s) => s.lessons.some((l) => l.id === lessonView.id));
  const lesson = skill.lessons.find((l) => l.id === lessonView.id);
  const done = !!S.lessons[lesson.id];

  if (!lessonView.reading) {
    return `<div class="lesson-view">
      <button class="icon" id="back">вЂ№</button>
      <div class="sess__skill" style="color:${skill.color}">${skill.icon} ${esc(skill.name)}</div>
      <h1 class="h1">${esc(lesson.title)}</h1>
      <div class="lead">${lesson.minutes} РјРёРЅ В· ${lesson.cards.length} ${plural(lesson.cards.length, 'РєР°СЂС‚РѕС‡РєР°', 'РєР°СЂС‚РѕС‡РєРё', 'РєР°СЂС‚РѕС‡РµРє')}</div>
      <div class="card card--pad theory">${esc(lesson.theory)}</div>
      <button class="btn btn--primary" id="begin">${done ? 'РџРѕРІС‚РѕСЂРёС‚СЊ РєР°СЂС‚РѕС‡РєРё' : 'РџРµСЂРµР№С‚Рё Рє РєР°СЂС‚РѕС‡РєР°Рј'}</button>
    </div>`;
  }
  return screenSession();
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РѕС‚СЂРёСЃРѕРІРєР° в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function render() {
  const nav = document.querySelector('.nav');

  /* СЃРµСЃСЃРёСЏ РїРµСЂРµР¶РёРІР°РµС‚ РїРµСЂРµР·Р°РіСЂСѓР·РєСѓ СЃС‚СЂР°РЅРёС†С‹: СЃРѕС…СЂР°РЅСЏРµРј РµС‘ РІ С…СЂР°РЅРёР»РёС‰Рµ
     РїСЂРё РєР°Р¶РґРѕР№ РѕС‚СЂРёСЃРѕРІРєРµ Рё РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°РµРј РїСЂРё Р·Р°РїСѓСЃРєРµ */
  persistSession();

  /* Р·РЅР°РєРѕРјСЃС‚РІРѕ РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ РґРѕ РІСЃРµРіРѕ РѕСЃС‚Р°Р»СЊРЅРѕРіРѕ Рё Р±РµР· РЅРёР¶РЅРµРіРѕ РјРµРЅСЋ,
     С‡С‚РѕР±С‹ РЅРµ РѕС‚РІР»РµРєР°С‚СЊ */
  if (!S.settings.onboarded) {
    if (nav) nav.hidden = true;
    app.innerHTML = screenOnboarding();
    bindOnboarding();
    return;
  }
  if (nav) nav.hidden = false;

  /* РђРєРєР°СѓРЅС‚ РѕР±СЏР·Р°С‚РµР»РµРЅ: Р±РµР· РЅРµРіРѕ РєР°СЂС‚РѕС‡РєРё Рё СѓСЂРѕРєРё РЅРµРґРѕСЃС‚СѓРїРЅС‹.
     Р“РѕСЃС‚СЊ РІРёРґРёС‚ С‚РѕР»СЊРєРѕ Р·РЅР°РєРѕРјСЃС‚РІРѕ Рё СЌРєСЂР°РЅ РІС…РѕРґР°. */
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
    /* Р»РёРЅРёРё РєР°СЂС‚С‹ СЃС‡РёС‚Р°РµРј РїРѕСЃР»Рµ РІСЃС‚Р°РІРєРё РІ РґРѕРєСѓРјРµРЅС‚: РґРѕ СЌС‚РѕРіРѕ Сѓ СѓР·Р»РѕРІ
       РµС‰С‘ РЅРµС‚ РєРѕРѕСЂРґРёРЅР°С‚ */
    if (tab === 'map') {
      bindMap();
      drawMapLines();
    }
  }

  document.querySelectorAll('.nav__b').forEach((b) => {
    b.classList.toggle('is-on', b.dataset.tab === tab && !session && !lessonView && !screen);
  });

  /* РєРЅРѕРїРєР° СѓСЃС‚Р°РЅРѕРІРєРё: РїРѕРєР°Р·С‹РІР°РµРј, РєРѕРіРґР° Р±СЂР°СѓР·РµСЂ РіРѕС‚РѕРІ, РёРЅР°С‡Рµ вЂ” РїРѕРґСЃРєР°Р·РєСѓ */
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РѕР±СЂР°Р±РѕС‚С‡РёРєРё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

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
      /* СѓСЂРѕРєРё РѕС‚РєСЂС‹РІР°СЋС‚СЃСЏ РїРѕ РѕС‡РµСЂРµРґРё: Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅС‹Рµ РЅРµ РѕС‚РєСЂС‹РІР°РµРј,
         РґР°Р¶Рµ РµСЃР»Рё РєР»РёРє РїСЂРёС€С‘Р» РїСЂРѕРіСЂР°РјРјРЅРѕ */
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
    session = { queue, index: 0, revealed: false, correct: 0, wrong: 0, gems: 0, startedAt: Date.now(), isLesson: true };
    lessonView.reading = true;
    render();
  });

  on('#back', 'click', () => { lessonView = null; render(); });

  on('#reveal', 'click', () => { session.revealed = true; render(); });

  /* РІС‹Р±РѕСЂ РІР°СЂРёР°РЅС‚Р° вЂ” РѕС†РµРЅРєР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ */
  document.querySelectorAll('[data-opt]').forEach((b) => {
    b.addEventListener('click', () => {
      gradeAnswer(Number(b.dataset.opt) === session.queue[session.index].card.a, Number(b.dataset.opt));
    });
  });

  /* РІРІРѕРґ РѕС‚РІРµС‚Р° вЂ” СЃРІРµСЂСЏРµРј СЃ РґРѕРїСѓСЃС‚РёРјС‹РјРё С„РѕСЂРјСѓР»РёСЂРѕРІРєР°РјРё */
  on('#check', 'click', () => {
    const item = session.queue[session.index];
    const given = (document.getElementById('ans-in') || {}).value || '';
    if (!given.trim()) return;
    gradeAnswer(checkAnswer(given, item.card.accept || []), given);
  });

  /* Enter РІ РїРѕР»Рµ РІРІРѕРґР° вЂ” С‚Рѕ Р¶Рµ, С‡С‚Рѕ РЅР°Р¶Р°С‚СЊ В«РџСЂРѕРІРµСЂРёС‚СЊВ» */
  on('#ans-in', 'keydown', (e) => {
    if (e.key === 'Enter') {
      const btn = document.getElementById('check');
      if (btn) btn.click();
    }
  });

  /* РїР»РёС‚РєРё-СЃР»РѕРІР°: РІ РѕС‚РІРµС‚ Рё РѕР±СЂР°С‚РЅРѕ */
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

  /* РґР°Р»СЊС€Рµ вЂ” Рє СЃР»РµРґСѓСЋС‰РµР№ РєР°СЂС‚РѕС‡РєРµ */
  on('#next', 'click', () => {
    session.index++;
    session.revealed = false;
    session.answer = null;
    render();
  });

  /* СЃРµСЂРґРµС‡РєРё РєРѕРЅС‡РёР»РёСЃСЊ: РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ Р·Р° РіРµРјС‹ РёР»Рё Р·Р°РІРµСЂС€РёС‚СЊ */
  on('#hearts-buy', 'click', () => {
    if ((S.gems || 0) < 30) { toast('РќРµ С…РІР°С‚Р°РµС‚ РіРµРјРѕРІ', 'info'); return; }
    S.gems -= 30;
    S.hearts = 5;
    S.heartsAt = Date.now();
    save();
    screen = null;
    render();
    toast('РЎРµСЂРґРµС‡РєРё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅС‹ вЂ” РїСЂРѕРґРѕР»Р¶Р°РµРј!', 'quest');
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
      /* РјРёРЅСѓС‚С‹ Р·Р°РЅСЏС‚РёСЏ РёРґСѓС‚ РІ РµР¶РµРґРЅРµРІРЅРѕРµ Р·Р°РґР°РЅРёРµ */
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
      const fresh = !S.cards[item.id];
      if (q >= 3) { session.correct++; if (fresh) session.gems = (session.gems || 0) + 1; snd.ok(); }
      else { session.wrong++; loseHeart(); snd.bad(); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
      review(item.id, q);
      /* РѕС€РёР±СЃСЏ вЂ” РІРµСЂРЅСѓС‚СЊ РєР°СЂС‚РѕС‡РєСѓ РІ РєРѕРЅРµС† РѕС‡РµСЂРµРґРё СЌС‚РѕРіРѕ Р·Р°РЅСЏС‚РёСЏ */
      if (q < 3) session.queue.push(item);
      session.index++;
      session.revealed = false;
      render();
      /* РѕС‚РїСЂР°РІР»СЏРµРј РЅР° СЃРµСЂРІРµСЂ СЃ Р·Р°РґРµСЂР¶РєРѕР№, С‡С‚РѕР±С‹ РЅРµ РґС‘СЂРіР°С‚СЊ СЃРµС‚СЊ
         РЅР° РєР°Р¶РґС‹Р№ РѕС‚РІРµС‚ */
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

  /* Р·Р°РіСЂСѓР·РєР° РїСЂРѕРіСЂРµСЃСЃР° РёР· С„Р°Р№Р»Р° вЂ” РїРµСЂРµРЅРѕСЃ РјРµР¶РґСѓ СѓСЃС‚СЂРѕР№СЃС‚РІР°РјРё Р±РµР· Р°РєРєР°СѓРЅС‚Р° */
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
        toast('РџСЂРѕРіСЂРµСЃСЃ Р·Р°РіСЂСѓР¶РµРЅ', 'quest');
      } catch (err) {
        toast('Р¤Р°Р№Р» РЅРµ РїРѕС…РѕР¶ РЅР° РїСЂРѕРіСЂРµСЃСЃ SkillUp', 'info');
      }
    };
    rd.readAsText(file);
  });

  on('#reset', 'click', () => {
    if (confirm('РЎР±СЂРѕСЃРёС‚СЊ РІРµСЃСЊ РїСЂРѕРіСЂРµСЃСЃ? Р­С‚Рѕ РЅРµР»СЊР·СЏ РѕС‚РјРµРЅРёС‚СЊ.')) {
      localStorage.removeItem(KEY);
      S = blank();
      render();
      toast('РџСЂРѕРіСЂРµСЃСЃ СЃР±СЂРѕС€РµРЅ', 'info');
    }
  });

  /* в”Ђв”Ђ РїСЂРѕС„РёР»СЊ Рё Р°РєРєР°СѓРЅС‚ в”Ђв”Ђ */
  on('#to-auth', 'click', () => { screen = 'auth'; authMode = 'login'; authError = ''; render(); });
  on('#to-me', 'click', () => { tab = 'me'; render(); });
  on('#to-map', 'click', () => { tab = 'map'; render(); });
  on('#back-today', 'click', () => { screen = null; tab = 'today'; render(); });
  on('#to-focus', 'click', () => { screen = 'focus'; render(); });

  /* в”Ђв”Ђ С„РѕРєСѓСЃ в”Ђв”Ђ */
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
      /* РїР°СѓР·Р°: Р·Р°РїРѕРјРёРЅР°РµРј, СЃРєРѕР»СЊРєРѕ РѕСЃС‚Р°Р»РѕСЃСЊ */
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
    toast('Р’С‹ РІС‹С€Р»Рё РёР· Р°РєРєР°СѓРЅС‚Р°', 'info');
    render();
  });

  on('#del-acc', 'click', async () => {
    if (!confirm('РЈРґР°Р»РёС‚СЊ Р°РєРєР°СѓРЅС‚ РІРјРµСЃС‚Рµ СЃРѕ РІСЃРµРј РїСЂРѕРіСЂРµСЃСЃРѕРј РЅР° СЃРµСЂРІРµСЂРµ? Р­С‚Рѕ РЅРµР»СЊР·СЏ РѕС‚РјРµРЅРёС‚СЊ.')) return;
    try {
      await apiDeleteAccount();
      toast('РђРєРєР°СѓРЅС‚ СѓРґР°Р»С‘РЅ. РџСЂРѕРіСЂРµСЃСЃ РѕСЃС‚Р°Р»СЃСЏ РІ С‚РµР»РµС„РѕРЅРµ.', 'info');
    } catch (e) {
      toast(e.message, 'info');
    }
    render();
  });

  on('#sync-now', 'click', async () => {
    setSyncState('wait');
    const r = await syncNow();
    setSyncState(r.error ? 'err' : 'ok');
    toast(r.error ? r.error : 'РџСЂРѕРіСЂРµСЃСЃ СЃРѕС…СЂР°РЅС‘РЅ РІ Р°РєРєР°СѓРЅС‚', r.error ? 'info' : 'quest');
  });

  on('#redo-onboard', 'click', () => {
    obStep = 0;
    obGoal = S.settings.goal;
    obPicked = S.settings.picked || [];
    S.settings.onboarded = false;
    save();
    render();
  });

  /* СЃС‚СЂР°РЅРёС†Р° СЃ QR-РєРѕРґРѕРј: СѓРґРѕР±РЅРѕ РїРѕРєР°Р·Р°С‚СЊ РґСЂСѓРіСѓ вЂ” С‚РѕС‚ СЃРєР°РЅРёСЂСѓРµС‚ РєР°РјРµСЂРѕР№ */
  on('#to-qr', 'click', () => { location.href = 'qr.html'; });

  /* СѓСЃС‚Р°РЅРѕРІРєР° РїСЂРёР»РѕР¶РµРЅРёСЏ: РєРЅРѕРїРєР° СЂР°Р±РѕС‚Р°РµС‚ С‡РµСЂРµР· СЃРѕР±С‹С‚РёРµ Р±СЂР°СѓР·РµСЂР° */
  on('#install-app', 'click', async () => {
    if (!window.__install) return;
    window.__install.prompt();
    try {
      await window.__install.userChoice;
    } catch (e) {
      /* РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РїРµСЂРµРґСѓРјР°Р» вЂ” РЅРµ СЃС‚СЂР°С€РЅРѕ */
    }
    window.__install = null;
    render();
  });

  /* в”Ђв”Ђ Р»РёРіР° Рё РјР°РіР°Р·РёРЅ в”Ђв”Ђ */
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
    if ((S.gems || 0) < 30) { toast('РќРµ С…РІР°С‚Р°РµС‚ РіРµРјРѕРІ', 'info'); return; }
    S.gems -= 30;
    S.hearts = 5;
    S.heartsAt = Date.now();
    save();
    render();
    toast('РЎРµСЂРґРµС‡РєРё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅС‹!', 'quest');
  });
  on('#buy-freeze', 'click', () => {
    if ((S.gems || 0) < 20) { toast('РќРµ С…РІР°С‚Р°РµС‚ РіРµРјРѕРІ', 'info'); return; }
    S.gems -= 20;
    S.freezes = (S.freezes || 0) + 1;
    save();
    render();
    toast('Р—Р°РјРѕСЂРѕР·РєР° РєСѓРїР»РµРЅР°', 'quest');
  });

  /* РѕР·РІСѓС‡РєР° С„СЂР°Р·С‹ */
  on('#speak', 'click', () => {
    const item = session.queue[session.index];
    if (item && typeof item.card.a === 'string') speak(item.card.a);
  });

  /* Р’С‹РіСЂСѓР·РєР° РїСЂРѕРіСЂРµСЃСЃР° С„Р°Р№Р»РѕРј: РµСЃР»Рё С‡РµР»РѕРІРµРє Р·Р°С…РѕС‡РµС‚ РїРµСЂРµРЅРµСЃС‚Рё РµРіРѕ
     РІСЂСѓС‡РЅСѓСЋ РёР»Рё РїСЂРѕСЃС‚Рѕ СЃРѕС…СЂР°РЅРёС‚СЊ РєРѕРїРёСЋ */
  on('#export', 'click', () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `skillup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Р¤Р°Р№Р» СЃРѕС…СЂР°РЅС‘РЅ', 'info');
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РЅР°РїРѕРјРёРЅР°РЅРёСЏ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

async function askNotify() {
  if (!('Notification' in window)) {
    toast('РЈРІРµРґРѕРјР»РµРЅРёСЏ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ', 'info');
    return;
  }
  const p = await Notification.requestPermission();
  if (p === 'granted') toast('РќР°РїРѕРјРёРЅР°РЅРёРµ РІРєР»СЋС‡РµРЅРѕ', 'quest');
  else toast('Р Р°Р·СЂРµС€РµРЅРёРµ РЅРµ РІС‹РґР°РЅРѕ', 'info');
}

/** РџСЂРѕРІРµСЂСЏРµРј СЂР°Р· РІ РјРёРЅСѓС‚Сѓ: РµСЃР»Рё РІСЂРµРјСЏ РїРѕРґРѕС€Р»Рѕ Рё СЃРµРіРѕРґРЅСЏ РЅРµ Р·Р°РЅРёРјР°Р»РёСЃСЊ вЂ” РЅР°РїРѕРјРёРЅР°РµРј. */
setInterval(() => {
  if (!S.settings.reminder || Notification?.permission !== 'granted') return;
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  if (hhmm !== S.settings.reminderTime) return;
  if (S.lastActive === today()) return;
  const key = 'notified.' + today();
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  new Notification('SkillUp', { body: 'РџРѕСЂР° РїРѕР·Р°РЅРёРјР°С‚СЊСЃСЏ вЂ” СЃРµСЂРёСЏ Р¶РґС‘С‚!', icon: 'icon-192.png' });
}, 60000);

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЂРµР¶РёРј С„РѕРєСѓСЃРёСЂРѕРІРєРё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

let focusState = { minutes: 25, left: 25 * 60, running: false, endAt: 0 };

/* РўРёРєР°СЋС‰РёР№ С‚Р°Р№РјРµСЂ: РїРѕРєР° РёРґС‘С‚ С„РѕРєСѓСЃ, РѕР±РЅРѕРІР»СЏРµРј С†РёС„РµСЂР±Р»Р°С‚ РЅР° СЌРєСЂР°РЅРµ.
   РџРµСЂРµСЂРёСЃРѕРІС‹РІР°РµРј С‚РѕР»СЊРєРѕ СЃР°Рј СЌРєСЂР°РЅ С„РѕРєСѓСЃР° вЂ” РґСЂСѓРіРёРµ СЌРєСЂР°РЅС‹ РЅРµ С‚СЂРѕРіР°РµРј. */
setInterval(() => {
  if (!focusState.running) return;
  if (Date.now() >= focusState.endAt) {
    focusState.running = false;
    focusState.left = 0;
    completeFocus(focusState.minutes);
    snd.level();
    toast(`Р¤РѕРєСѓСЃ Р·Р°РІРµСЂС€С‘РЅ: +${focusState.minutes * 4} XP`, 'quest');
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

  return `<button class="icon back" id="back-today">вЂ№</button>
  <h1 class="h1">Р РµР¶РёРј С„РѕРєСѓСЃРёСЂРѕРІРєРё</h1>
  <p class="lead">${m} РјРёРЅСѓС‚ Р±РµР· РѕС‚РІР»РµС‡РµРЅРёР№. Р—Р° Р·Р°РІРµСЂС€С‘РЅРЅСѓСЋ СЃРµСЃСЃРёСЋ вЂ” ${m * 4} РѕРїС‹С‚Р°, РјРёРЅСѓС‚С‹ Р·Р°РЅСЏС‚РёСЏ Рё Р°РєС‚РёРІРЅС‹Р№ РґРµРЅСЊ СЃРµСЂРёРё.</p>

  <div class="focus__ring">
    ${progressRing(percent, 230, 12, '#b794ff')}
    <div class="focus__time">
      <b>${mm}:${ss}</b>
      <span>${focusState.running ? 'РёРґС‘С‚ СЂР°Р±РѕС‚Р°вЂ¦' : 'РіРѕС‚РѕРІС‹?'}</span>
    </div>
  </div>

  <div class="focus__pick">
    ${[5, 15, 25, 45].map((v) => `<button class="focus__p ${m === v ? 'is-on' : ''}" data-min="${v}">${v} РјРёРЅ</button>`).join('')}
  </div>

  <button class="btn btn--primary" id="focus-go">${focusState.running ? 'РџР°СѓР·Р°' : (left < total ? 'РџСЂРѕРґРѕР»Р¶РёС‚СЊ' : 'РќР°С‡Р°С‚СЊ')}</button>
  <button class="btn btn--quiet" id="focus-reset">РЎР±СЂРѕСЃРёС‚СЊ</button>
  <p class="muted-note" style="margin-top:16px">РЎРѕРІРµС‚: СѓР±РµСЂРёС‚Рµ С‚РµР»РµС„РѕРЅ РІ РґСЂСѓРіСѓСЋ РєРѕРјРЅР°С‚Сѓ Рё Р·Р°РєСЂРѕР№С‚Рµ Р»РёС€РЅРёРµ РІРєР»Р°РґРєРё. РћРґРёРЅ РѕС‚СЂРµР·РѕРє вЂ” РѕРґРЅР° Р·Р°РґР°С‡Р°.</p>`;
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ Р·РІСѓРєРё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

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
    /* Р±РµР· Р·РІСѓРєР° РїСЂРёР»РѕР¶РµРЅРёРµ РѕР±СЏР·Р°РЅРѕ СЂР°Р±РѕС‚Р°С‚СЊ */
  }
}
const snd = {
  ok: () => { beep(660, 0.12); setTimeout(() => beep(880, 0.14), 90); },
  bad: () => beep(220, 0.22, 'triangle', 0.09),
  level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.22), i * 110)),
};

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РїСЂР°Р·РґРЅРѕРІР°РЅРёРµ СѓСЂРѕРІРЅСЏ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function celebrate(level) {
  const el = document.createElement('div');
  el.className = 'celebrate';
  el.innerHTML = `<div class="celebrate__card">
    <div class="celebrate__stars">вњЁ</div>
    <b>РЈСЂРѕРІРµРЅСЊ ${level}!</b>
    <span>Р Р°СЃС‚С‘С‚Рµ РЅР° РіР»Р°Р·Р°С…</span>
  </div>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2500);
  snd.level();
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ СЃРµСЃСЃРёСЏ РїРµСЂРµР¶РёРІР°РµС‚ РїРµСЂРµР·Р°РіСЂСѓР·РєСѓ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function persistSession() {
  try {
    if (session) {
      localStorage.setItem('skillup.session', JSON.stringify({ session, lessonView, tab, screen }));
    } else {
      localStorage.removeItem('skillup.session');
    }
  } catch (e) {
    /* РїСЂРёРІР°С‚РЅС‹Р№ СЂРµР¶РёРј вЂ” РїСЂРѕСЃС‚Рѕ РЅРµ СЃРѕС…СЂР°РЅСЏРµРј СЃРµСЃСЃРёСЋ */
  }
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РёС‚РѕРіРё РїСЂРѕС€Р»РѕР№ РЅРµРґРµР»Рё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

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

  /* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ Р»РёРіР° РЅРµРґРµР»Рё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

let leagueData = null;

function screenLeague() {
  const isLogged = loggedIn();
  return `<button class="icon back" id="back-today">вЂ№</button>
  <h1 class="h1">Р›РёРіР° РЅРµРґРµР»Рё</h1>
  <p class="lead">РљС‚Рѕ РЅР°Р±СЂР°Р» Р±РѕР»СЊС€Рµ РѕРїС‹С‚Р° Р·Р° СЌС‚Сѓ РЅРµРґРµР»СЋ вЂ” СЃС‡РёС‚Р°РµС‚СЃСЏ СЃ РїРѕРЅРµРґРµР»СЊРЅРёРєР°.</p>
  ${!isLogged
    ? `<div class="card card--pad">
        <p class="muted-note" style="margin:0 0 14px">Р›РёРіР° СЃСЂР°РІРЅРёРІР°РµС‚ РёРіСЂРѕРєРѕРІ РїРѕ Р°РєРєР°СѓРЅС‚Р°Рј вЂ” РІРѕР№РґРёС‚Рµ, С‡С‚РѕР±С‹ СѓС‡Р°СЃС‚РІРѕРІР°С‚СЊ. РџСЂРѕРіСЂРµСЃСЃ РїСЂРё СЌС‚РѕРј РѕСЃС‚Р°РЅРµС‚СЃСЏ РІ С‚РµР»РµС„РѕРЅРµ.</p>
        <button class="btn btn--primary" id="to-auth">Р’РѕР№С‚Рё РёР»Рё СЃРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚</button>
      </div>`
    : leagueData === null
      ? `<div class="card card--pad"><p class="muted-note" style="margin:0">Р—Р°РіСЂСѓР¶Р°РµРј С‚Р°Р±Р»РёС†СѓвЂ¦</p></div>`
      : leagueData.error
        ? `<div class="card card--pad"><p class="muted-note" style="margin:0">РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р»РёРіСѓ: ${esc(leagueData.error)}</p></div>`
        : leagueRows()}
  ${isLogged ? `<button class="btn btn--quiet" id="league-refresh">РћР±РЅРѕРІРёС‚СЊ</button>` : ''}`;
}

function leagueRows() {
  const board = (leagueData && leagueData.board) || [];
  if (!board.length) {
    return `<div class="card card--pad"><p class="muted-note" style="margin:0">РџРѕРєР° РІ Р»РёРіРµ РїСѓСЃС‚Рѕ вЂ” РЅР°Р±РµСЂРёС‚Рµ РѕРїС‹С‚, С‡С‚РѕР±С‹ РїРѕСЏРІРёС‚СЊСЃСЏ РІ С‚Р°Р±Р»РёС†Рµ.</p></div>`;
  }
  const medals = ['рџҐ‡', 'рџҐ€', 'рџҐ‰'];
  const rows = board.slice(0, 20).map((u, i) => `
    <div class="lg__row ${u.me ? 'is-me' : ''}">
      <span class="lg__pos">${i < 3 ? medals[i] : (i + 1)}</span>
      <span class="lg__name">${esc(u.name)}${u.me ? ' <i>(РІС‹)</i>' : ''}</span>
      <b class="lg__xp">${u.xp}</b>
    </div>`).join('');
  return `<div class="card card--pad lg">
    <div class="lg__head">РРіСЂРѕРє В· РѕРїС‹С‚ Р·Р° РЅРµРґРµР»СЋ</div>
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

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РѕР·РІСѓС‡РєР° в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function speak(text, lang) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || (/[A-Za-z]{3,}/.test(text) ? 'en-US' : 'ru-RU');
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* Р±РµР· СЃРёРЅС‚РµР·Р° СЂРµС‡Рё РїСЂРёР»РѕР¶РµРЅРёРµ СЂР°Р±РѕС‚Р°РµС‚ РєР°Рє СЂР°РЅСЊС€Рµ */
  }
}

/** РћР·РІСѓС‡РёРІР°С‚СЊ СЃС‚РѕРёС‚ С„СЂР°Р·С‹ СЃ Р»Р°С‚РёРЅРёС†РµР№ вЂ” СЂСѓСЃСЃРєРёР№ СЃРёРЅС‚РµР· РѕСЃС‚Р°РІРёРј СЃРёСЃС‚РµРјРµ. */
const speakable = (text) => typeof text === 'string' && /[A-Za-z]{3,}/.test(text);

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ Р·Р°РїСѓСЃРє в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

/* РЎРµСЃСЃРёСЏ, РїСЂРµСЂРІР°РЅРЅР°СЏ РїРµСЂРµР·Р°РіСЂСѓР·РєРѕР№, РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°РµС‚СЃСЏ */
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
  /* РїРѕРІСЂРµР¶РґС‘РЅРЅР°СЏ СЃРµСЃСЃРёСЏ вЂ” РЅР°С‡РёРЅР°РµРј Р·Р°РЅРѕРІРѕ */
}

/* РњРµРЅСЋ Рё СЃРѕРґРµСЂР¶РёРјРѕРµ СЃРІСЏР·С‹РІР°СЋС‚СЃСЏ РІРЅСѓС‚СЂРё bind() РїСЂРё РєР°Р¶РґРѕР№ РѕС‚СЂРёСЃРѕРІРєРµ,
   РїРѕСЌС‚РѕРјСѓ Р·РґРµСЃСЊ С‚РѕР»СЊРєРѕ РїРµСЂРІС‹Р№ Р·Р°РїСѓСЃРє. */
render();

/* РЎРѕРѕР±С‰Р°РµРј Р±СЂР°СѓР·РµСЂСѓ, С‡С‚Рѕ РїСЂРёР»РѕР¶РµРЅРёРµ РіРѕС‚РѕРІРѕ Рє СѓСЃС‚Р°РЅРѕРІРєРµ */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__install = e;
  const bar = document.getElementById('install');
  if (bar) bar.hidden = false;
});
