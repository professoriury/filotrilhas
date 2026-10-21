(() => {
  'use strict';
  const STORAGE_KEY = 'trilha-progress-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const safeLink = value => {
    const raw = String(value || '').trim();
    if (!raw || raw.startsWith('//')) return null;
    try { return ['https:','http:'].includes(new URL(raw, document.baseURI).protocol) ? raw : null; }
    catch { return null; }
  };
  let data;
  let progress = readProgress();

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveProgress() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* armazenamento local pode estar indisponível */ } }
  function stepsFor(id) { return progress[id] || {}; }
  function lessonDoneCount(lesson) { return Object.values(stepsFor(lesson.id)).filter(Boolean).length; }
  function stepCount() { return data.lessons.length * 4; }
  function doneCount() { return data.lessons.reduce((sum, lesson) => sum + lessonDoneCount(lesson), 0); }
  function percent() { return stepCount() ? Math.round(doneCount() / stepCount() * 100) : 0; }
  function allLessons() { return Array.isArray(data?.lessons) ? data.lessons : []; }
  function isDemo(item) { return item.status === 'demo' || item.status === 'draft'; }
  function badge(lesson) { return isDemo(lesson) ? '<span class="pill pill-demo">DEMONSTRAÇÃO · NÃO PUBLICADO</span>' : '<span class="pill">PUBLICADO</span>'; }
  function trackProgress(track) {
    const lessons = (track.lessonIds || []).map(id => allLessons().find(lesson => lesson.id === id)).filter(Boolean);
    const total = lessons.length * 4;
    const done = lessons.reduce((sum, lesson) => sum + lessonDoneCount(lesson), 0);
    return total ? Math.round(done / total * 100) : 0;
  }
  function card(lesson) {
    const pct = Math.round(lessonDoneCount(lesson) / 4 * 100);
    const trackTitle = (data.tracks || []).find(track => track.id === lesson.trackId)?.title || 'Aula';
    return `<a class="lesson-card" href="aula.html?id=${encodeURIComponent(lesson.id)}"><div class="lesson-meta"><span class="pill">${escapeHtml((lesson.grades || []).join(' · '))}</span><span class="pill">${escapeHtml(lesson.discipline)}</span>${badge(lesson)}</div><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.topic)} · ${escapeHtml(lesson.objective || '')}</p><div class="card-foot"><span>${escapeHtml(trackTitle)}</span><span class="card-progress"><span>${pct}%</span><span class="progress-track"><span style="width:${pct}%"></span></span></span></div></a>`;
  }
  function renderSeries() {
    const displayNames = ['1ª Série', '2ª Série', '3ª Série'];
    const stageLabels = ['Da Antiguidade ao Humanismo', 'Do Renascimento à Contemporaneidade', 'Toda a História da Filosofia para o ENEM'];
    const grades = ['1º ano', '2º ano', '3º ano'];
    $('#series-grid').innerHTML = grades.map((grade, index) => {
      const lessons = allLessons().filter(lesson => (lesson.grades || []).includes(grade));
      const subjects = [...new Set(lessons.map(lesson => lesson.discipline))].join(' · ') || 'Novos conteúdos em breve';
      const stageLabel = stageLabels[index];
      return `<a class="series-card" href="#buscar" data-grade-card="${escapeHtml(grade)}"><span class="series-card-top"><span class="series-stage-label-long">${escapeHtml(stageLabel)}</span><span>${String(lessons.length).padStart(2,'0')} AULAS</span></span><strong>${escapeHtml(displayNames[index])}</strong><small>${escapeHtml(subjects)}</small><span class="series-arrow" aria-hidden="true">↗</span></a>`;
    }).join('');
    $$('[data-grade-card]').forEach(link => link.addEventListener('click', () => { $('#filter-grade').value = link.dataset.gradeCard; renderSearch(); }));
  }
  function searchableText(lesson) {
    const videoType = lesson.video?.url ? ' vídeo ' : '';
    const materialType = (lesson.summary ? ' resumo ' : '') + (lesson.activity || lesson.challenge ? ' atividade ' : '') + (lesson.recommendations ? ' recomendação ' : '');
    return normalize([lesson.title, lesson.topic, lesson.discipline, lesson.objective, lesson.summary, lesson.activity, lesson.challenge, lesson.recommendations, ...(lesson.grades || []), ...(lesson.keyConcepts || []), ...(lesson.keywords || []), ...(lesson.materials || []).flatMap(item => typeof item === 'string' ? [item] : [item.label, item.text, item.url]), videoType, materialType, lesson.challenge ? ' pergunta complementar ' : '', (lesson.materials || []).length ? ' referência referências ' : ''].join(' '));
  }
  function renderSearch() {
    const term = normalize($('#search-input').value);
    const grade = $('#filter-grade').value;
    const subject = $('#filter-subject').value;
    const type = $('#filter-type').value;
    let found = allLessons().filter(lesson => {
      if (grade && !(lesson.grades || []).includes(grade)) return false;
      if (subject && lesson.discipline !== subject) return false;
      const text = searchableText(lesson);
      if (term && !text.includes(term)) return false;
      if (type === 'vídeo' && !lesson.video?.url) return false;
      if (type === 'atividade' && !lesson.activity && !lesson.challenge) return false;
      if (type === 'resumo' && !lesson.summary) return false;
      if (type === 'desafio' && !lesson.challenge) return false;
      if (type === 'recommendation' && !lesson.recommendations?.trim()) return false;
      if (type === 'material' && !(lesson.materials || []).length) return false;
      return true;
    });
    $('#search-count').textContent = `${found.length} ${found.length === 1 ? 'aula' : 'aulas'}`;
    $('#search-results').innerHTML = found.length ? found.map(card).join('') : '<div class="empty-state">Nenhuma aula encontrada. Experimente outro termo ou ajuste os filtros.</div>';
  }
  function renderTracks() {
    const tracks = data.tracks || [];
    $('#tracks-list').innerHTML = tracks.length ? tracks.map((track, index) => {
      const pct = trackProgress(track);
      const lessons = (track.lessonIds || []).map(id => allLessons().find(lesson => lesson.id === id)).filter(Boolean);
      const lessonLinks = lessons.length ? lessons.map(lesson => `<a href="aula.html?id=${encodeURIComponent(lesson.id)}">${escapeHtml(lesson.title)} ↗</a>`).join('') : '<span>Sem aulas associadas.</span>';
      return `<article class="track-item"><span class="track-step">0${index + 1}</span><div class="track-copy"><h3>${escapeHtml(track.title)}</h3><p>${escapeHtml(track.description)}</p><div class="track-lessons">${lessonLinks}</div></div><span class="track-side">${pct}%<span class="progress-track"><span style="width:${pct}%"></span></span></span></article>`;
    }).join('') : '<div class="empty-state">Ainda não há trilhas cadastradas.</div>';
  }
  function renderRecent() {
    const lessons = [...allLessons()].reverse().slice(0, 3);
    $('#recent-lessons').innerHTML = lessons.length ? lessons.map((lesson, i) => `<a class="recent-item" href="aula.html?id=${encodeURIComponent(lesson.id)}"><span class="recent-swatch">0${i+1}</span><span><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml((lesson.grades || []).join(' · '))} · ${escapeHtml(lesson.topic)}</p></span><span class="recent-arrow" aria-hidden="true">↗</span></a>`).join('') : '<div class="empty-state">Nenhuma aula disponível.</div>';
  }
  function renderProgress() {
    const value = percent();
    $('#sidebar-progress').textContent = `${value}%`;
    $('#progress-percent').textContent = `${value}%`;
    $('#sidebar-progress-bar').style.width = `${value}%`;
    $('#overall-progress-bar').style.width = `${value}%`;
    const badges = [
      ['primeiro-passo', 'Primeiro passo', doneCount() >= 1],
      ['ritmo-constante', 'Ritmo constante', doneCount() >= 4],
      ['trilha-completa', 'Trilha completa', (data.tracks || []).some(track => trackProgress(track) === 100)]
    ];
    $('#achievements').innerHTML = badges.map(([, label, unlocked]) => `<span class="achievement ${unlocked ? 'unlocked' : ''}"><span class="achievement-mark">${unlocked ? '✓' : '·'}</span>${label}</span>`).join('');
  }
  function renderSubjectFilters() {
    const subjects = [...new Set(allLessons().map(lesson => lesson.discipline))].sort();
    $('#filter-subject').innerHTML = '<option value="">Todas as disciplinas</option>' + subjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join('');
  }
  function questionMarkup(question, prefix) {
    if (!question) return '<p class="empty-state">A questão ainda não foi selecionada.</p>';
    const options = question.options || [];
    return `<p class="question-prompt">${escapeHtml(question.prompt)}</p><div class="options-list" role="group" aria-label="Alternativas">${options.map((option, index) => `<button type="button" class="option-button" data-question="${escapeHtml(prefix)}" data-index="${index}"><span class="option-letter">${String.fromCharCode(65 + index)}.</span><span>${escapeHtml(option)}</span></button>`).join('')}</div><p class="answer-feedback" id="feedback-${escapeHtml(prefix)}" aria-live="polite"></p><p class="question-source">${escapeHtml(question.source || 'Fonte não informada')}</p>`;
  }
  function renderWeekly() {
    $('#weekly-question').innerHTML = questionMarkup(data.weeklyQuestion, 'weekly');
    $$('#weekly-question .option-button').forEach(button => button.addEventListener('click', () => {
      const selected = Number(button.dataset.index);
      const correct = Number(data.weeklyQuestion.correctIndex);
      $$('#weekly-question .option-button').forEach(item => item.classList.remove('selected','correct','incorrect'));
      button.classList.add(selected === correct ? 'correct' : 'incorrect');
      const feedback = $('#feedback-weekly');
      feedback.textContent = selected === correct ? `Isso! ${data.weeklyQuestion.explanation}` : `Ainda não. ${data.weeklyQuestion.explanation}`;
      feedback.className = `answer-feedback ${selected === correct ? 'success' : 'error'}`;
    }));
  }
  function populateEnemFilters() {
    const questions = data.enemQuestions || [];
    const fill = (selector, values, label) => { $(selector).innerHTML = `<option value="">${label}</option>` + [...new Set(values.filter(value => value !== null && value !== undefined && value !== ''))].sort((a,b) => String(a).localeCompare(String(b),'pt-BR')).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join(''); };
    fill('#enem-year', questions.map(item => item.year), 'Todos os anos');
    fill('#enem-application', questions.map(item => item.application), 'Todas as aplicações');
    fill('#enem-subject', questions.map(item => item.discipline), 'Todas as disciplinas');
    fill('#enem-topic', questions.map(item => item.topic), 'Todos os temas');
  }
  function renderEnem() {
    const filters = {year:$('#enem-year').value, application:$('#enem-application').value, discipline:$('#enem-subject').value, topic:$('#enem-topic').value};
    const questions = (data.enemQuestions || []).filter(item => Object.entries(filters).every(([key,value]) => !value || String(item[key]) === value));
    $('#enem-questions').innerHTML = questions.length ? questions.map((question, index) => {
      const prefix = `enem-${index}`;
      const provenance = question.provenance === 'oficial' ? 'DECLARADA OFICIAL · FONTE NÃO VERIFICADA' : 'AUTORAL · DEMONSTRAÇÃO';
      const year = question.year || 'Sem ano oficial';
      const options = (question.options || []).map((option, i) => `<button type="button" class="option-button" data-enem-id="${escapeHtml(question.id)}" data-index="${i}"><span class="option-letter">${String.fromCharCode(65+i)}.</span><span>${escapeHtml(option)}</span></button>`).join('');
      const analysis = question.analysis?.length ? `<ul class="question-analysis">${question.analysis.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : '';
      return `<article class="question-item"><div class="lesson-meta"><span class="pill">${escapeHtml(provenance)}</span><span class="pill">${escapeHtml(String(year))}</span><span class="pill">${escapeHtml(question.application || 'Aplicação não informada')}</span></div><h3>${escapeHtml(question.discipline)} · ${escapeHtml(question.topic)}</h3><p class="question-prompt">${escapeHtml(question.prompt)}</p><div class="options-list">${options}</div><p class="answer-feedback" id="feedback-${prefix}" aria-live="polite"></p><details><summary>Ver comentário e análise</summary><p>${escapeHtml(question.explanation || '')}</p>${analysis}</details><p class="question-source">Fonte informada${question.provenance === 'oficial' ? ' pelo professor; não verificada automaticamente' : ''}: ${escapeHtml(question.source || 'Não informada')}</p></article>`;
    }).join('') : '<div class="empty-state">Nenhuma questão corresponde aos filtros atuais.</div>';
    $$('#enem-questions [data-enem-id]').forEach(button => button.addEventListener('click', () => {
      const question = (data.enemQuestions || []).find(item => item.id === button.dataset.enemId);
      if (!question) return;
      const correct = Number(question.correctIndex);
      const selected = Number(button.dataset.index);
      $$(`[data-enem-id="${CSS.escape(question.id)}"]`).forEach(item => item.classList.remove('correct','incorrect'));
      button.classList.add(selected === correct ? 'correct' : 'incorrect');
      const feedback = button.closest('.question-item').querySelector('.answer-feedback');
      feedback.textContent = `${selected === correct ? 'Resposta correta. ' : 'Revise esta resposta. '}${question.explanation || ''}`;
    }));
  }
  function identifiedSource(value, yearValue = null) {
    const source = String(value || '').trim();
    const sourceYear = source.match(/\b(?:19|20)\d{2}\b/);
    const year = Number(yearValue || sourceYear?.[0]);
    const hasYear = Number.isInteger(year) && year >= 1998 && year <= 2100;
    const hasEnem = /\bENEM\b/i.test(source);
    const hasItemNumber = /\b(?:quest[aã]o|item)\s*(?:(?:n[º°.]?|#)\s*)?\d{1,3}\b/i.test(source);
    if (!hasYear || !hasEnem || !hasItemNumber) return false;
    if (/https?:\/\//i.test(source)) {
      const match = source.match(/https:\/\/[^\s)]+/i);
      if (!match) return false;
      try {
        const parsed = new URL(match[0].replace(/[.,;]+$/, ''));
        return parsed.protocol === 'https:' && (parsed.hostname === 'gov.br' || parsed.hostname.endsWith('.gov.br'));
      } catch { return false; }
    }
    return /\bINEP\b|Instituto\s+Nacional\s+de\s+Estudos\s+e\s+Pesquisas\s+Educacionais/i.test(source);
  }
  function initSearchEvents() {
    $('#search-form').addEventListener('submit', event => event.preventDefault());
    $('#search-input').addEventListener('input', renderSearch);
    ['#filter-grade','#filter-subject','#filter-type'].forEach(selector => $(selector).addEventListener('change', renderSearch));
    document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#search-input').focus(); } });
  }
  function validateData(candidate) {
    const fail = message => message;
    const validId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
    const gradesAllowed = new Set(['1º ano','2º ano','3º ano']);
    if (!candidate || !Array.isArray(candidate.lessons) || !Array.isArray(candidate.tracks) || !Array.isArray(candidate.enemQuestions)) return fail('O JSON precisa conter arrays de aulas, trilhas e questões ENEM.');
    if (!candidate.weeklyQuestion || typeof candidate.weeklyQuestion !== 'object') return fail('A questão da semana está ausente ou inválida.');
    const entities = [...candidate.lessons, ...candidate.tracks, candidate.weeklyQuestion, ...candidate.enemQuestions];
    if (entities.some(item => !item || !validId(item.id))) return fail('Cada aula, trilha e questão deve ter um ID único em minúsculas, com letras, números e hífens.');
    const ids = entities.map(item => item.id);
    if (new Set(ids).size !== ids.length) return fail('Há IDs repetidos entre aulas, trilhas e questões.');
    const trackById = new Map(candidate.tracks.map(track => [track.id, track]));
    const lessonById = new Map(candidate.lessons.map(lesson => [lesson.id, lesson]));
    for (const lesson of candidate.lessons) {
      if (!lesson.title?.trim() || !lesson.discipline?.trim() || !lesson.topic?.trim() || !Array.isArray(lesson.grades) || !lesson.grades.length || lesson.grades.some(grade => !gradesAllowed.has(grade))) return fail(`A aula “${lesson.id}” tem título, disciplina, tema ou séries inválidos.`);
      if (lesson.trackId && !trackById.has(lesson.trackId)) return fail(`A aula “${lesson.id}” aponta para uma trilha inexistente.`);
      if (lesson.trackId && !(trackById.get(lesson.trackId).lessonIds || []).includes(lesson.id)) return fail(`A aula “${lesson.id}” e a sua trilha não têm associação recíproca.`);
      if (lesson.video?.url && !safeLink(lesson.video.url)) return fail(`O vídeo da aula “${lesson.id}” usa um protocolo de URL não permitido.`);
      if (lesson.recommendations != null && typeof lesson.recommendations !== 'string') return fail(`As Recomendações POP da aula “${lesson.id}” devem ser texto.`);
      if (!Array.isArray(lesson.materials || [])) return fail(`Os materiais da aula “${lesson.id}” devem ser uma lista.`);
      if ((lesson.materials || []).some(item => {
        if (typeof item === 'string') return !item.trim() || (/^https?:\/\//i.test(item.trim()) && !safeLink(item));
        if (!item || typeof item !== 'object') return true;
        const url = String(item.url || '').trim(), label = String(item.label || item.text || '').trim();
        return (!url && !label) || Boolean(url && !safeLink(url));
      })) return fail(`Uma referência da aula “${lesson.id}” está vazia ou contém um link inválido.`);
    }
    for (const track of candidate.tracks) {
      if (!track.title?.trim() || !track.discipline?.trim() || !Array.isArray(track.grades) || !track.grades.length || track.grades.some(grade => !gradesAllowed.has(grade)) || !Array.isArray(track.lessonIds)) return fail(`A trilha “${track.id}” tem campos obrigatórios inválidos.`);
      if (new Set(track.lessonIds).size !== track.lessonIds.length) return fail(`A trilha “${track.id}” lista uma aula mais de uma vez.`);
      if (track.lessonIds.some(id => !lessonById.has(id) || lessonById.get(id).trackId !== track.id)) return fail(`A trilha “${track.id}” contém uma referência de aula inválida ou desatualizada.`);
    }
    const validQuestion = question => question && typeof question.prompt === 'string' && question.prompt.trim() && Array.isArray(question.options) && question.options.length >= 2 && Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.options.length;
    if (!validQuestion(candidate.weeklyQuestion) || !String(candidate.weeklyQuestion.source || '').trim()) return fail('A Questão da Semana precisa de enunciado, alternativas, resposta correta e fonte/identificação.');
    if (candidate.enemQuestions.some(question => !validQuestion(question) || !question.discipline?.trim() || !question.topic?.trim())) return fail('Uma questão ENEM tem enunciado, alternativas, resposta, disciplina ou tema inválidos.');
    if (candidate.enemQuestions.some(question => question.provenance === 'oficial' && !identifiedSource(question.source, question.year))) return fail('Uma questão declarada oficial precisa indicar origem INEP ou domínio gov.br, ENEM, ano e número da questão/item. O professor deve confirmar a fonte original.');
    return '';
  }
  function refreshApp() {
    renderSeries(); renderSearch(); renderTracks(); renderRecent(); renderProgress(); renderSubjectFilters(); renderSearch(); renderWeekly(); populateEnemFilters(); renderEnem();
  }
  function initNav() {
    const button = $('.menu-toggle');
    button?.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!open)); $('.sidebar').classList.toggle('mobile-open', !open); });
    $$('.primary-nav .nav-link').forEach(link => link.addEventListener('click', () => { $$('.primary-nav .nav-link').forEach(item => item.classList.remove('active')); link.classList.add('active'); }));
  }
  async function start() {
    try {
      const response = await fetch(new URL('data/aulas.json', document.baseURI));
      if (!response.ok) throw new Error('Não foi possível carregar data/aulas.json.');
      data = await response.json();
      const validationError = validateData(data);
      if (validationError) throw new Error(`O arquivo data/aulas.json tem dados inválidos: ${validationError}`);
      initSearchEvents(); initNav(); refreshApp();
      ['#enem-year','#enem-application','#enem-subject','#enem-topic'].forEach(selector => $(selector).addEventListener('change', renderEnem));
    } catch (error) {
      document.querySelector('.main-content').insertAdjacentHTML('afterbegin', `<div class="empty-state">${escapeHtml(error.message)} Abra o site por um servidor estático e confira o arquivo de dados.</div>`);
    }
  }
  start();
})();
