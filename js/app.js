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
  function stepCount() { return allLessons().length * 4; }
  function doneCount() { return allLessons().reduce((sum, lesson) => sum + lessonDoneCount(lesson), 0); }
  function percent() { return stepCount() ? Math.round(doneCount() / stepCount() * 100) : 0; }
  function allLessons() { return Array.isArray(data?.lessons) ? data.lessons.filter(lesson => lesson.status !== 'draft') : []; }
  function visibleTracks() {
    return Array.isArray(data?.tracks) ? data.tracks.filter(track => track.status !== 'draft') : [];
  }
  function isDemo(item) { return item.status === 'demo'; }
  function badge(lesson) { return isDemo(lesson) ? '<span class="pill pill-demo">DEMONSTRAÇÃO · NÃO PUBLICADO</span>' : '<span class="pill">PUBLICADO</span>'; }
  function trackProgress(track) {
    const lessons = (track.lessonIds || []).map(id => allLessons().find(lesson => lesson.id === id)).filter(Boolean);
    const total = lessons.length * 4;
    const done = lessons.reduce((sum, lesson) => sum + lessonDoneCount(lesson), 0);
    return total ? Math.round(done / total * 100) : 0;
  }
  function card(lesson) {
    const pct = Math.round(lessonDoneCount(lesson) / 4 * 100);
    const trackTitle = visibleTracks().find(track => track.id === lesson.trackId)?.title || 'Aula';
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
    const tracks = visibleTracks();
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
      ['trilha-completa', 'Trilha completa', visibleTracks().some(track => trackProgress(track) === 100)]
    ];
    $('#achievements').innerHTML = badges.map(([, label, unlocked]) => `<span class="achievement ${unlocked ? 'unlocked' : ''}"><span class="achievement-mark">${unlocked ? '✓' : '·'}</span>${label}</span>`).join('');
  }
  function renderSubjectFilters() {
    const subjects = [...new Set(allLessons().map(lesson => lesson.discipline))].sort();
    $('#filter-subject').innerHTML = '<option value="">Todas as disciplinas</option>' + subjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join('');
  }
  function sourceMarkup(value) {
    const source = String(value || 'Fonte não informada');
    const matcher = /https?:\/\/[^\s<>"']+/gi;
    let cursor = 0, linkCount = 0, output = '', match;
    while ((match = matcher.exec(source))) {
      const token = match[0];
      const cleanUrl = token.replace(/[.,;:!?\)\]]+$/, '');
      const punctuation = token.slice(cleanUrl.length);
      let href = '';
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.protocol === 'https:' && /(^|\.)gov\.br$/i.test(parsed.hostname)) href = parsed.href;
      } catch {}
      output += escapeHtml(source.slice(cursor, match.index));
      const nearLabel = source.slice(Math.max(0, match.index - 40), match.index);
      const label = /gabarito\s*[:—-]?\s*$/i.test(nearLabel) ? 'Abrir gabarito oficial' : /(?:prova|caderno)\s*[:—-]?\s*$/i.test(nearLabel) ? 'Abrir caderno oficial' : `Abrir fonte oficial ${linkCount + 1}`;
      output += href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>` : escapeHtml(token);
      output += escapeHtml(punctuation);
      if (href) linkCount += 1;
      cursor = match.index + token.length;
    }
    return (output + escapeHtml(source.slice(cursor))).replace(/\r?\n/g, '<br>');
  }
  function questionMarkup(question, prefix) {
    if (!question) return '<p class="empty-state">A questão ainda não foi selecionada.</p>';
    const options = question.options || [];
    return `<p class="question-prompt">${escapeHtml(question.prompt)}</p><div class="options-list" role="group" aria-label="Alternativas">${options.map((option, index) => `<button type="button" class="option-button" data-question="${escapeHtml(prefix)}" data-index="${index}" aria-pressed="false" aria-describedby="feedback-${escapeHtml(prefix)}"><span class="option-letter">${String.fromCharCode(65 + index)}.</span><span>${escapeHtml(option)}</span></button>`).join('')}</div><p class="answer-feedback" id="feedback-${escapeHtml(prefix)}" role="status" aria-live="polite" aria-atomic="true"></p><p class="question-source">${sourceMarkup(question.source || 'Fonte não informada')}</p>`;
  }
  function renderWeekly() {
    $('#weekly-question').innerHTML = questionMarkup(data.weeklyQuestion, 'weekly');
    $$('#weekly-question .option-button').forEach(button => button.addEventListener('click', () => {
      const selected = Number(button.dataset.index);
      const correct = Number(data.weeklyQuestion.correctIndex);
      const choices = [...$('#weekly-question').querySelectorAll('.option-button')];
      choices.forEach(item => { item.classList.remove('selected','correct','incorrect'); item.setAttribute('aria-pressed','false'); });
      button.setAttribute('aria-pressed','true');
      button.classList.add(selected === correct ? 'correct' : 'incorrect');
      if (selected !== correct && choices[correct]) choices[correct].classList.add('correct');
      const feedback = $('#feedback-weekly');
      const selectedLetter = String.fromCharCode(65 + selected), correctLetter = String.fromCharCode(65 + correct);
      feedback.textContent = selected === correct
        ? `Alternativa ${selectedLetter}: correta.${data.weeklyQuestion.explanation ? ' ' + data.weeklyQuestion.explanation : ''}`
        : `Alternativa ${selectedLetter}: incorreta. A alternativa correta é ${correctLetter}.${data.weeklyQuestion.explanation ? ' ' + data.weeklyQuestion.explanation : ''}`;
      feedback.className = `answer-feedback ${selected === correct ? 'correct' : 'incorrect'}`;
    }));
  }
  function studentVisibleQuestions() {
    return (data.enemQuestions || []).filter(item => item.status !== 'draft' && (item.provenance !== 'oficial' || item.sourceVerified === true));
  }
  function populateEnemFilters() {
    const questions = studentVisibleQuestions();
    const fill = (selector, values, label) => { $(selector).innerHTML = `<option value="">${label}</option>` + [...new Set(values.filter(value => value !== null && value !== undefined && value !== ''))].sort((a,b) => String(a).localeCompare(String(b),'pt-BR')).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join(''); };
    fill('#enem-year', questions.map(item => item.year), 'Todos os anos');
    fill('#enem-application', questions.map(item => item.application), 'Todas as aplicações');
    fill('#enem-subject', questions.map(item => item.discipline), 'Todas as disciplinas');
    fill('#enem-topic', questions.map(item => item.topic), 'Todos os temas');
  }
  function renderEnem() {
    const filters = {year:$('#enem-year').value, application:$('#enem-application').value, discipline:$('#enem-subject').value, topic:$('#enem-topic').value};
    const questions = studentVisibleQuestions().filter(item => Object.entries(filters).every(([key,value]) => !value || String(item[key]) === value));
    $('#enem-questions').innerHTML = questions.length ? questions.map((question, index) => {
      const prefix = `enem-${index}`;
      const provenance = question.provenance === 'oficial' ? (question.sourceVerified ? 'QUESTÃO OFICIAL · FONTE CONFERIDA' : 'QUESTÃO OFICIAL · FONTE A CONFERIR') : 'AUTORAL · DEMONSTRAÇÃO';
      const year = question.year || 'Sem ano oficial';
      const answerable = question.status !== 'annulled' && Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < (question.options || []).length;
      const options = (question.options || []).map((option, i) => `<button type="button" class="option-button" data-enem-id="${escapeHtml(question.id)}" data-index="${i}" aria-pressed="false" aria-describedby="feedback-${prefix}"${answerable ? '' : ' disabled aria-disabled="true"'}><span class="option-letter">${String.fromCharCode(65+i)}.</span><span>${escapeHtml(option)}</span></button>`).join('');
      const analysis = question.analysis?.length ? `<ul class="question-analysis">${question.analysis.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : '';
      const unavailableFeedback = question.status === 'annulled' ? 'Questão anulada oficialmente; não há alternativa correta para conferir.' : 'Gabarito não confirmado; esta questão não permite correção automática.';
      const initialFeedback = answerable ? '' : unavailableFeedback;
      const sourceNote = question.provenance === 'oficial' ? (question.sourceVerified ? 'Fonte conferida no material oficial.' : 'Fonte indicada; ainda não conferida.') : 'Questão autoral de demonstração.';
      return `<article class="question-item"><div class="lesson-meta"><span class="pill">${escapeHtml(question.status === 'annulled' ? 'ANULADA PELO INEP' : provenance)}</span><span class="pill">${escapeHtml(String(year))}</span><span class="pill">${escapeHtml(question.application || 'Aplicação não informada')}</span></div><h3>${escapeHtml(question.discipline)} · ${escapeHtml(question.topic)}</h3><p class="question-prompt" id="prompt-${prefix}">${escapeHtml(question.prompt)}</p><div class="options-list" role="group" aria-labelledby="prompt-${prefix}">${options}</div><p class="answer-feedback" id="feedback-${prefix}" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(initialFeedback)}</p><details><summary>Ver comentário e análise</summary><p>${escapeHtml(question.explanation || '')}</p>${analysis}</details><p class="question-source"><strong>Fonte:</strong> ${sourceMarkup(question.source || 'Não informada')} <span>${escapeHtml(sourceNote)}</span></p></article>`;
    }).join('') : '<div class="empty-state">Nenhuma questão corresponde aos filtros atuais.</div>';
    $$('#enem-questions .option-button[data-enem-id]:not(:disabled)').forEach(button => button.addEventListener('click', () => {
      const question = (data.enemQuestions || []).find(item => item.id === button.dataset.enemId);
      if (!question) return;
      const correct = Number(question.correctIndex);
      const selected = Number(button.dataset.index);
      const card = button.closest('.question-item');
      const choices = [...card.querySelectorAll('.option-button')];
      choices.forEach(item => { item.classList.remove('correct','incorrect'); item.setAttribute('aria-pressed','false'); });
      card.querySelector('.answer-feedback').classList.remove('correct','incorrect');
      button.setAttribute('aria-pressed','true');
      button.classList.add(selected === correct ? 'correct' : 'incorrect');
      const correctLetter = String.fromCharCode(65 + correct);
      const selectedLetter = String.fromCharCode(65 + selected);
      if (selected !== correct && choices[correct]) choices[correct].classList.add('correct');
      const feedback = card.querySelector('.answer-feedback');
      const isCorrect = selected === correct;
      feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
      feedback.textContent = isCorrect
        ? `Alternativa ${selectedLetter}: correta.${question.explanation ? ' ' + question.explanation : ''}`
        : `Alternativa ${selectedLetter}: incorreta. A alternativa correta é ${correctLetter}.${question.explanation ? ' ' + question.explanation : ''}`;
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
    const proofMatch = source.match(/(?:prova|caderno)[^:\n]{0,60}:\s*(https:\/\/[^\s)]+)/i);
    const keyMatch = source.match(/gabarito[^:\n]{0,60}:\s*(https:\/\/[^\s)]+)/i);
    if (!proofMatch || !keyMatch) return false;
    const officialUrl = value => {
      try {
        const url = new URL(value.replace(/[.,;!?]+$/, ''));
        return url.protocol === 'https:' && (url.hostname === 'gov.br' || url.hostname.endsWith('.gov.br'));
      } catch { return false; }
    };
    const proofUrl = proofMatch[1].replace(/[.,;!?]+$/, '');
    const keyUrl = keyMatch[1].replace(/[.,;!?]+$/, '');
    return proofUrl !== keyUrl && officialUrl(proofUrl) && officialUrl(keyUrl);
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
    const validQuestion = question => question && typeof question.prompt === 'string' && question.prompt.trim() && Array.isArray(question.options) && question.options.length >= 2 && (question.status === 'annulled' ? question.correctIndex === null && question.provenance === 'oficial' && question.sourceVerified === true : Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.options.length);
    if (!validQuestion(candidate.weeklyQuestion) || !String(candidate.weeklyQuestion.source || '').trim()) return fail('A Questão da Semana precisa de enunciado, alternativas, resposta correta e fonte/identificação.');
    if (candidate.enemQuestions.some(question => !validQuestion(question) || !question.discipline?.trim() || !question.topic?.trim())) return fail('Uma questão ENEM tem enunciado, alternativas, resposta, disciplina ou tema inválidos.');
    if (candidate.enemQuestions.some(question => question.provenance === 'oficial' && !identifiedSource(question.source, question.year))) return fail('Uma questão oficial precisa identificar ENEM, ano e número e incluir links HTTPS gov.br distintos para o caderno/prova e o gabarito da mesma aplicação.');
    if (candidate.enemQuestions.some(question => question.provenance === 'oficial' && question.status === 'published' && question.sourceVerified !== true)) return fail('Uma questão oficial publicada precisa ter a fonte conferida manualmente no caderno e no gabarito oficiais.');
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
