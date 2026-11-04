/* ═══════════════════════════════════════════════════════════════
   SkillUp — карта развития.

   Уроки внутри навыка открываются по очереди: следующий становится
   доступен, когда пройден предыдущий. Это даёт ощущение пути, а не
   списка. Линии между узлами рисуются в SVG по реальным координатам
   элементов — поэтому карта остаётся ровной на любом экране.
   ═══════════════════════════════════════════════════════════════ */

let mapSkill = null;

/** Звания внутри навыка: как растёт мастерство. */
const RANKS = ['Новичок', 'Ученик', 'Практик', 'Мастер'];

function rankOf(doneCount) {
  return RANKS[Math.min(doneCount, RANKS.length - 1)];
}

/** Следующий непройденный урок — он и есть текущая цель. */
function nextLesson(skill) {
  return skill.lessons.find((l) => !S.lessons[l.id]) || null;
}

/** Карточки, которые даются тяжело: много ошибок или низкий коэффициент. */
function hardCards() {
  const out = [];
  for (const skill of SKILLS) {
    for (const lesson of skill.lessons) {
      lesson.cards.forEach((card, i) => {
        const id = `${lesson.id}#${i}`;
        const st = S.cards[id];
        if (st && (st.lapses >= 2 || st.ef < 2.1)) out.push({ id, card, lesson, skill, st });
      });
    }
  }
  return out.sort((a, b) => (b.st.lapses - a.st.lapses) || (a.st.ef - b.st.ef));
}

function screenMap() {
  const skill = SKILLS.find((s) => s.id === mapSkill) || SKILLS[0];
  mapSkill = skill.id;
  const p = skillProgress(skill);
  const target = nextLesson(skill);
  const hard = hardCards();

  const nodes = skill.lessons.map((l, i) => {
    const done = !!S.lessons[l.id];
    const isTarget = target && target.id === l.id;
    const locked = !done && !isTarget;
    const st = seenLesson(l.id);
    return { lesson: l, done, isTarget, locked, started: st && !done, i };
  });

  return `<button class="icon back" id="back-today">‹</button>
  <h1 class="h1">Карта развития</h1>
  <p class="lead">Уроки открываются по очереди. Пройдите текущий, чтобы открыть следующий.</p>

  <div class="sksel">
    ${SKILLS.map((s) => {
      const sp = skillProgress(s);
      return `<button class="sksel__b ${s.id === skill.id ? 'is-on' : ''}" data-map="${s.id}"
        style="--c:${s.color}">
        <span>${s.icon}</span>
        <i style="height:${Math.max(6, sp.percent)}%"></i>
      </button>`;
    }).join('')}
  </div>

  <div class="card card--pad rank">
    <div class="rank__ico" style="background:${skill.color}22;color:${skill.color}">${skill.icon}</div>
    <div class="rank__body">
      <div class="rank__name">${esc(skill.name)}</div>
      <div class="rank__title">${rankOf(p.lessonsDone)} · ${p.lessonsDone} из ${p.lessons}</div>
    </div>
    <div class="rank__pct" style="color:${skill.color}">${p.percent}%</div>
  </div>

  <div class="map" style="--c:${skill.color}">
    <svg class="map__svg" aria-hidden="true"><path d=""/></svg>
    ${nodes.map((n) => `
      <button class="mnode ${n.done ? 'is-done' : ''} ${n.isTarget ? 'is-target' : ''} ${n.locked ? 'is-locked' : ''}"
        data-lesson="${n.lesson.id}" ${n.locked ? 'disabled' : ''}
        style="--c:${skill.color};--i:${n.i}" aria-label="${esc(n.lesson.title)}">
        <span class="mnode__dot">${n.done ? '✓' : (n.locked ? '🔒' : '▶')}</span>
        <span class="mnode__body">
          <b>${esc(n.lesson.title)}</b>
          <i>${n.lesson.cards.length} ${plural(n.lesson.cards.length, 'карточка', 'карточки', 'карточек')} · ${n.lesson.minutes} мин${n.started ? ' · начат' : ''}</i>
        </span>
      </button>`).join('')}
  </div>

  ${hard.length ? `<div class="card card--pad hard">
    <div class="hard__head">
      <b>Сложные вопросы</b>
      <span>${hard.length}</span>
    </div>
    <p class="hard__text">Эти карточки даются тяжелее остальных — в них больше всего ошибок.
    Прогоните их отдельно, чтобы закрепить.</p>
    <button class="btn btn--ghost" id="hard-go">Повторить сложные</button>
  </div>` : ''}

  <h2 class="sect">Все навыки</h2>
  <div class="tree">
    ${SKILLS.map((s) => {
      const sp = skillProgress(s);
      const nx = nextLesson(s);
      return `<button class="tree__b" data-map="${s.id}">
        <span class="tree__ico" style="background:${s.color}22;color:${s.color}">${s.icon}</span>
        <span class="tree__body">
          <b>${esc(s.name)}</b>
          <i>${rankOf(sp.lessonsDone)} · ${nx ? 'дальше: ' + esc(nx.title) : 'всё пройдено'}</i>
        </span>
        <span class="tree__bar"><i style="width:${sp.percent}%;background:${s.color}"></i></span>
      </button>`;
    }).join('')}
  </div>`;
}

/**
 * Рисуем линии между узлами дерева.
 *
 * Координаты берём настоящие, через getBoundingClientRect, а не
 * считаем формулами. Тогда карта сходится при любой ширине экрана,
 * размере шрифта и переносе текста в узлах.
 */
function drawMapLines() {
  const wrap = document.querySelector('.map');
  if (!wrap) return;
  const svg = wrap.querySelector('.map__svg');
  const path = svg && svg.querySelector('path');
  if (!svg || !path) return;

  const nodes = [...wrap.querySelectorAll('.mnode')];
  if (!nodes.length) {
    path.setAttribute('d', '');
    return;
  }

  const box = wrap.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${Math.max(1, box.width)} ${Math.max(1, box.height)}`);
  svg.setAttribute('width', box.width);
  svg.setAttribute('height', box.height);

  let d = '';
  nodes.forEach((n, i) => {
    const b = n.getBoundingClientRect();
    const x = b.left - box.left + b.width / 2;
    const y = b.top - box.top + b.height / 2;
    d += (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  path.setAttribute('d', d);
}

function bindMap() {
  document.querySelectorAll('[data-map]').forEach((b) => {
    b.addEventListener('click', () => { mapSkill = b.dataset.map; render(); });
  });

  document.querySelectorAll('.mnode:not(.is-locked)').forEach((b) => {
    b.addEventListener('click', () => {
      lessonView = { id: b.dataset.lesson, reading: false };
      render();
    });
  });

  const hard = document.querySelector('#hard-go');
  if (hard) {
    hard.addEventListener('click', () => {
      const list = hardCards();
      if (!list.length) return;
      session = { queue: list.slice(), index: 0, revealed: false, correct: 0, wrong: 0, startedAt: Date.now() };
      render();
    });
  }
}
