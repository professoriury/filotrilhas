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
  let editingEnemId = null;

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
    return `<a class="lesson-card" href="aula.html?id=${encodeURIComponent(lesson.id)}"><div class="lesson-meta"><span class="pill">${escapeHtml((lesson.grades || []).join(' · '))}</span><span class="pill">${escapeHtml(lesson.discipline)}</span>${badge(lesson)}</div><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.topic)} · ${escapeHtml(lesson.objective || '')}</p><div class="card-foot"><span>${escapeHtml(lesson.trackId || 'Aula')}</span><span class="card-progress"><span>${pct}%</span><span class="progress-track"><span style="width:${pct}%"></span></span></span></div></a>`;
  }
  function renderSeries() {
    const grades = ['1º ano', '2º ano', '3º ano'];
    $('#series-grid').innerHTML = grades.map((grade, index) => {
      const lessons = allLessons().filter(lesson => (lesson.grades || []).includes(grade));
      const subjects = [...new Set(lessons.map(lesson => lesson.discipline))].join(' · ') || 'Novos conteúdos em breve';
      const stageLabel = index === 2 ? 'Toda a História da Filosofia para o ENEM' : `ETAPA 0${index + 1}`;
      const stageClass = index === 2 ? 'series-stage-label-long' : '';
      return `<a class="series-card" href="#buscar" data-grade-card="${escapeHtml(grade)}"><span class="series-card-top"><span class="${stageClass}">${escapeHtml(stageLabel)}</span><span>${String(lessons.length).padStart(2,'0')} AULAS</span></span><strong>${escapeHtml(grade)}</strong><small>${escapeHtml(subjects)}</small><span class="series-arrow" aria-hidden="true">↗</span></a>`;
    }).join('');
    $$('[data-grade-card]').forEach(link => link.addEventListener('click', () => { $('#filter-grade').value = link.dataset.gradeCard; renderSearch(); }));
  }
  function searchableText(lesson) {
    const videoType = lesson.video?.url ? ' vídeo ' : '';
    const materialType = (lesson.recovery ? ' recuperação atividade ' : '') + (lesson.summary ? ' resumo ' : '') + (lesson.activity ? ' atividade ' : '');
    return normalize([lesson.title, lesson.topic, lesson.discipline, lesson.objective, lesson.summary, lesson.recovery, lesson.activity, lesson.challenge, ...(lesson.grades || []), ...(lesson.keyConcepts || []), ...(lesson.keywords || []), ...(lesson.materials || []).map(item => typeof item === 'string' ? item : item.label || item.url), videoType, materialType, lesson.challenge ? ' desafio ' : '', (lesson.materials || []).length ? ' material complementar ' : ''].join(' '));
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
      if (type === 'atividade' && !lesson.activity) return false;
      if (type === 'resumo' && !lesson.summary) return false;
      if (type === 'recuperação' && !lesson.recovery) return false;
      if (type === 'desafio' && !lesson.challenge) return false;
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
    $('[data-filter-recovery]').addEventListener('click', () => { $('#filter-type').value = 'recuperação'; renderSearch(); });
  }
  function safeId() { return `aula-${Date.now().toString(36)}`; }
  function uniqueTrackId() { return `trilha-${Date.now().toString(36)}`; }
  function formatMaterial(item) {
    if (typeof item === 'string') return item;
    const url = item?.url || '';
    const label = item?.label || '';
    return label && label !== url ? `${label} | ${url}` : url;
  }
  function parseMaterials(value, existing) {
    return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const separator = line.indexOf('|');
      const label = separator >= 0 ? line.slice(0, separator).trim() : '';
      const url = (separator >= 0 ? line.slice(separator + 1) : line).trim();
      const previous = (existing || []).find(item => (typeof item === 'string' ? item : item.url) === url);
      if (previous && !label) return previous;
      if (previous && typeof previous === 'object') return {...previous, url, label:label || previous.label || url};
      return {url, label:label || url};
    });
  }
  function fillTrackSelect() {
    const select = $('#edit-track-select');
    const current = select.value;
    select.innerHTML = '<option value="">Nova trilha</option>' + (data.tracks || []).map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('');
    if ((data.tracks || []).some(item => item.id === current)) select.value = current;
  }
  function fillLessonSelect() {
    const select = $('#edit-lesson-select');
    const current = select.value;
    select.innerHTML = '<option value="">Nova aula</option>' + allLessons().map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('');
    if (allLessons().some(item => item.id === current)) select.value = current;
    const trackSelect = $('#lesson-track-select');
    const currentTrack = trackSelect.value;
    trackSelect.innerHTML = '<option value="">Sem trilha</option>' + (data.tracks || []).map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`).join('');
    if ((data.tracks || []).some(item => item.id === currentTrack)) trackSelect.value = currentTrack;
  }
  function renderTrackLessonOptions(track) {
    const selected = new Set(track?.lessonIds || []);
    $('#track-lesson-options').innerHTML = allLessons().length ? allLessons().map(lesson => {
      const moves = lesson.trackId && lesson.trackId !== track?.id ? ` · será movida de ${escapeHtml((data.tracks || []).find(item => item.id === lesson.trackId)?.title || 'outra trilha')}` : '';
      return `<label><input type="checkbox" name="trackLessons" value="${escapeHtml(lesson.id)}" ${selected.has(lesson.id) ? 'checked' : ''}><span>${escapeHtml(lesson.title)} <small>${escapeHtml((lesson.grades || []).join(' · '))}${moves}</small></span></label>`;
    }).join('') : '<span class="privacy-note">Cadastre uma aula antes de a associar a uma trilha.</span>';
  }
  function setTrackForm(track) {
    const form = $('#track-form');
    form.reset();
    form.elements.id.value = track?.id || uniqueTrackId();
    form.elements.title.value = track?.title || '';
    form.elements.discipline.value = track?.discipline || 'Filosofia';
    form.elements.description.value = track?.description || '';
    form.elements.status.value = track?.status || 'draft';
    $$('input[name="trackGrades"]', form).forEach(checkbox => { checkbox.checked = (track?.grades || []).includes(checkbox.value); });
    renderTrackLessonOptions(track);
    $('#track-feedback').textContent = '';
  }
  function setLessonForm(lesson) {
    const form = $('#lesson-form');
    form.reset();
    form.elements.id.value = lesson?.id || safeId();
    form.elements.title.value = lesson?.title || '';
    form.elements.discipline.value = lesson?.discipline || 'Filosofia';
    form.elements.topic.value = lesson?.topic || '';
    form.elements.trackId.value = lesson?.trackId || '';
    form.elements.objective.value = lesson?.objective || '';
    form.elements.videoUrl.value = lesson?.video?.url || '';
    form.elements.videoLabel.value = lesson?.video?.label || '';
    form.elements.videoPublished.checked = lesson?.video?.published === true;
    form.elements.summary.value = lesson?.summary || '';
    form.elements.keyConcepts.value = (lesson?.keyConcepts || []).join(', ');
    form.elements.recovery.value = lesson?.recovery || '';
    form.elements.activity.value = lesson?.activity || '';
    form.elements.challenge.value = lesson?.challenge || '';
    form.elements.studyQuestions.value = (lesson?.studyQuestions || []).join('\n');
    form.elements.materials.value = (lesson?.materials || []).map(formatMaterial).join('\n');
    form.elements.status.value = lesson?.status || 'draft';
    $$('input[name="grades"]', form).forEach(checkbox => { checkbox.checked = (lesson?.grades || []).includes(checkbox.value); });
    $('#lesson-feedback').textContent = '';
  }
  function initTeacherTabs() {
    const activateTab = (button, focus = false) => {
      $$('.teacher-tab').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
      $$('.teacher-panel').forEach(panel => { panel.hidden = panel.id !== `panel-${button.dataset.tab}`; panel.classList.toggle('active', panel.id === `panel-${button.dataset.tab}`); });
      if (focus) button.focus();
    };
    $$('.teacher-tab').forEach(button => {
      button.addEventListener('click', () => activateTab(button));
      button.addEventListener('keydown', event => {
        const tabs = $$('.teacher-tab');
        let next = tabs.indexOf(button);
        if (event.key === 'ArrowRight') next = (next + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (next - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault(); activateTab(tabs[next], true);
      });
    });
    $('#edit-track-select').addEventListener('change', event => setTrackForm((data.tracks || []).find(item => item.id === event.target.value)));
    $('#new-track-button').addEventListener('click', () => { $('#edit-track-select').value = ''; setTrackForm(null); });
    $('#track-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const id = form.elements.id.value.trim();
      const oldId = $('#edit-track-select').value;
      const existingIndex = (data.tracks || []).findIndex(track => track.id === oldId);
      const otherIds = [...allLessons().map(item => item.id), ...(data.tracks || []).filter((_,index) => index !== existingIndex).map(item => item.id), ...(data.weeklyQuestion ? [data.weeklyQuestion.id] : []), ...(data.enemQuestions || []).map(item => item.id)];
      const grades = $$('input[name="trackGrades"]:checked', form).map(item => item.value);
      const selectedLessonIds = $$('input[name="trackLessons"]:checked', form).map(item => item.value);
      const feedback = $('#track-feedback');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || otherIds.includes(id)) { feedback.textContent = 'Use um ID único, em minúsculas, com letras, números e hífens.'; feedback.classList.add('error'); return; }
      if (!grades.length) { feedback.textContent = 'Selecione pelo menos uma série para a trilha.'; feedback.classList.add('error'); return; }
      if (new Set(selectedLessonIds).size !== selectedLessonIds.length || selectedLessonIds.some(lessonId => !allLessons().some(lesson => lesson.id === lessonId))) { feedback.textContent = 'A seleção de aulas contém uma referência inválida.'; feedback.classList.add('error'); return; }
      const track = { ...(existingIndex >= 0 ? data.tracks[existingIndex] : {}), id, title:form.elements.title.value.trim(), discipline:form.elements.discipline.value.trim(), grades, description:form.elements.description.value.trim(), lessonIds:selectedLessonIds, status:form.elements.status.value };
      const selected = new Set(selectedLessonIds);
      allLessons().forEach(lesson => { if (lesson.trackId === oldId || selected.has(lesson.id)) lesson.trackId = selected.has(lesson.id) ? id : ''; });
      if (existingIndex >= 0) data.tracks[existingIndex] = track; else data.tracks.push(track);
      data.tracks.forEach(item => { item.lessonIds = allLessons().filter(lesson => lesson.trackId === item.id).map(lesson => lesson.id); });
      fillTrackSelect(); $('#edit-track-select').value = id; fillLessonSelect();
      refreshApp(); setTrackForm(track);
      feedback.textContent = 'Trilha guardada nesta sessão. As associações das aulas foram atualizadas; exporte o JSON para preservar a alteração.'; feedback.classList.remove('error');
    });
    $('#delete-track-button').addEventListener('click', () => {
      const id = $('#edit-track-select').value;
      if (!id) { $('#track-feedback').textContent = 'Selecione uma trilha existente para excluir.'; return; }
      data.tracks = data.tracks.filter(track => track.id !== id);
      allLessons().forEach(lesson => { if (lesson.trackId === id) lesson.trackId = ''; });
      data.tracks.forEach(track => { track.lessonIds = allLessons().filter(lesson => lesson.trackId === track.id).map(lesson => lesson.id); });
      fillTrackSelect(); setTrackForm(null); fillLessonSelect(); refreshApp();
      $('#track-feedback').textContent = 'Trilha removida desta sessão; as aulas foram preservadas sem associação. Exporte o JSON para confirmar.';
    });
    $('#edit-lesson-select').addEventListener('change', event => setLessonForm(allLessons().find(item => item.id === event.target.value)));
    $('#new-lesson-button').addEventListener('click', () => { $('#edit-lesson-select').value = ''; setLessonForm(null); });
    $('#lesson-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const id = form.elements.id.value.trim();
      const existingIndex = allLessons().findIndex(item => item.id === $('#edit-lesson-select').value);
      const otherIds = [...allLessons().filter((_,index) => index !== existingIndex).map(item => item.id), ...(data.tracks || []).map(item => item.id), ...(data.weeklyQuestion ? [data.weeklyQuestion.id] : []), ...(data.enemQuestions || []).map(item => item.id)];
      const grades = $$('input[name="grades"]:checked', form).map(item => item.value);
      const feedback = $('#lesson-feedback');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || otherIds.includes(id)) { feedback.textContent = 'Use um ID único, em minúsculas, com letras, números e hífens.'; feedback.classList.add('error'); return; }
      if (!grades.length) { feedback.textContent = 'Selecione pelo menos uma série.'; feedback.classList.add('error'); return; }
      const videoUrl = form.elements.videoUrl.value.trim();
      const prior = existingIndex >= 0 ? allLessons()[existingIndex] : {};
      if (videoUrl && !safeLink(videoUrl)) { feedback.textContent = 'O vídeo precisa usar HTTPS, HTTP ou um caminho relativo seguro.'; feedback.classList.add('error'); return; }
      const materials = parseMaterials(form.elements.materials.value, prior.materials || []);
      if (materials.some(item => !safeLink(typeof item === 'string' ? item : item.url))) { feedback.textContent = 'Um material contém um protocolo inseguro. Use HTTPS, HTTP ou um caminho relativo seguro.'; feedback.classList.add('error'); return; }
      const trackId = form.elements.trackId.value.trim();
      if (trackId && !(data.tracks || []).some(track => track.id === trackId)) { feedback.textContent = 'Selecione uma trilha existente ou crie-a primeiro no separador Trilhas.'; feedback.classList.add('error'); return; }
      const priorVideo = prior.video || {};
      const keywords = [...new Set([...(prior.keywords || []), ...form.elements.keyConcepts.value.split(',').map(value => value.trim()).filter(Boolean), ...form.elements.topic.value.split(/\s+/).filter(Boolean)])];
      const lesson = {
        ...prior,
        id, title:form.elements.title.value.trim(), grades, discipline:form.elements.discipline.value.trim(), topic:form.elements.topic.value.trim(), trackId, objective:form.elements.objective.value.trim(),
        video:{...priorVideo,url:videoUrl,label:form.elements.videoLabel.value.trim() || (videoUrl ? 'Vídeo indicado pelo professor' : 'Vídeo não publicado'),published:Boolean(videoUrl && form.elements.videoPublished.checked)},
        summary:form.elements.summary.value.trim(), keyConcepts:form.elements.keyConcepts.value.split(',').map(value => value.trim()).filter(Boolean), recovery:form.elements.recovery.value.trim(), activity:form.elements.activity.value.trim(), challenge:form.elements.challenge.value.trim(),
        studyQuestions:form.elements.studyQuestions.value.split('\n').map(value => value.trim()).filter(Boolean), materials, status:form.elements.status.value, keywords, updatedAt:new Date().toISOString().slice(0,10)
      };
      if (existingIndex >= 0) data.lessons[existingIndex] = lesson; else data.lessons.push(lesson);
      data.tracks.forEach(track => { track.lessonIds = allLessons().filter(item => item.trackId === track.id).map(item => item.id); });
      fillTrackSelect(); fillLessonSelect(); $('#edit-lesson-select').value = id; setLessonForm(lesson);
      refreshApp();
      feedback.textContent = 'Aula guardada nesta sessão. Exporte o JSON para preservar e publicar a alteração.'; feedback.classList.remove('error');
    });
    $('#delete-lesson-button').addEventListener('click', () => {
      const id = $('#edit-lesson-select').value;
      if (!id) { $('#lesson-feedback').textContent = 'Selecione uma aula existente para excluir.'; return; }
      data.lessons = data.lessons.filter(item => item.id !== id);
      (data.tracks || []).forEach(track => { track.lessonIds = allLessons().filter(item => item.trackId === track.id).map(item => item.id); });
      delete progress[id]; saveProgress(); fillTrackSelect(); fillLessonSelect(); setLessonForm(null); refreshApp();
      $('#lesson-feedback').textContent = 'Aula removida desta sessão. Exporte o JSON para confirmar a alteração.';
    });
    $('#weekly-form').addEventListener('submit', event => {
      event.preventDefault(); const form = event.currentTarget; const options = form.elements.options.value.split('\n').map(item => item.trim()).filter(Boolean); const correctIndex = Number(form.elements.correctIndex.value) - 1;
      const feedback = $('#weekly-feedback');
      if (!options.length || correctIndex < 0 || correctIndex >= options.length) { feedback.textContent = 'Verifique as alternativas e o índice da resposta correta.'; feedback.classList.add('error'); return; }
      data.weeklyQuestion = {id:data.weeklyQuestion?.id || `semana-${Date.now().toString(36)}`,prompt:form.elements.prompt.value.trim(),options,correctIndex,source:form.elements.source.value.trim(),explanation:form.elements.explanation.value.trim(),provenance:'autoral'};
      renderWeekly(); feedback.textContent = 'Questão atualizada nesta sessão. Exporte o JSON para preservar a alteração.'; feedback.classList.remove('error');
    });
    $('#enem-form').addEventListener('submit', event => {
      event.preventDefault(); const form = event.currentTarget; const options = form.elements.options.value.split('\n').map(item => item.trim()).filter(Boolean); const correctIndex = Number(form.elements.correctIndex.value) - 1; const official = form.elements.provenance.value === 'oficial'; const source = form.elements.source.value.trim(); const feedback = $('#enem-feedback');
      if (!options.length || correctIndex < 0 || correctIndex >= options.length) { feedback.textContent = 'Verifique as alternativas e o índice da resposta correta.'; feedback.classList.add('error'); return; }
      const sourceYear = source.match(/\b(?:19|20)\d{2}\b/);
      const year = form.elements.year.value ? Number(form.elements.year.value) : sourceYear ? Number(sourceYear[0]) : null;
      if (official && !identifiedSource(source, year)) { feedback.textContent = 'Informe origem INEP ou URL HTTPS em domínio gov.br, ENEM, ano e número da questão/item. O site não verifica a autenticidade da fonte automaticamente.'; feedback.classList.add('error'); return; }
      const question = {id:`enem-${Date.now().toString(36)}`,year,application:form.elements.application.value.trim() || (official ? 'Aplicação indicada pelo professor' : 'Autoral — sem aplicação oficial'),discipline:form.elements.discipline.value.trim(),topic:form.elements.topic.value.trim(),prompt:form.elements.prompt.value.trim(),options,correctIndex,explanation:form.elements.explanation.value.trim(),analysis:form.elements.analysis.value.split('\n').map(item => item.trim()).filter(Boolean),source:source || 'Questão autoral; demonstração sem fonte oficial.',provenance:official ? 'oficial' : 'autoral',status:official ? 'published' : 'demo'};
      if (editingEnemId) {
        question.id = editingEnemId;
        const index = data.enemQuestions.findIndex(item => item.id === editingEnemId);
        if (index >= 0) data.enemQuestions[index] = question;
        editingEnemId = null;
        feedback.textContent = 'Questão atualizada nesta sessão. Exporte o JSON para preservar a alteração.';
        form.querySelector('[type="submit"]').textContent = 'Adicionar questão';
      } else {
        data.enemQuestions.push(question);
        feedback.textContent = 'Questão adicionada nesta sessão. Exporte o JSON para preservar a alteração.';
      }
      form.reset(); feedback.classList.remove('error'); populateEnemFilters(); renderEnem(); renderTeacherEnem();
    });
    $('#export-json').addEventListener('click', exportJson);
  }
  function renderTeacherEnem() {
    $('#teacher-enem-list').innerHTML = (data.enemQuestions || []).map(question => `<div class="teacher-enem-row"><span>${escapeHtml(question.discipline)} · ${escapeHtml(question.topic)} · ${escapeHtml(question.provenance === 'oficial' ? 'Declarada oficial — fonte não verificada' : 'Autoral')}</span><span><button type="button" data-edit-enem="${escapeHtml(question.id)}">Editar</button> <button type="button" data-remove-enem="${escapeHtml(question.id)}">Excluir</button></span></div>`).join('') || '<p class="privacy-note">Nenhuma questão cadastrada.</p>';
    $$('[data-edit-enem]').forEach(button => button.addEventListener('click', () => {
      const question = data.enemQuestions.find(item => item.id === button.dataset.editEnem);
      if (!question) return;
      const form = $('#enem-form');
      editingEnemId = question.id;
      form.elements.prompt.value = question.prompt || '';
      form.elements.options.value = (question.options || []).join('\n');
      form.elements.correctIndex.value = Number(question.correctIndex) + 1;
      form.elements.year.value = question.year || '';
      form.elements.application.value = question.application || '';
      form.elements.discipline.value = question.discipline || '';
      form.elements.topic.value = question.topic || '';
      form.elements.provenance.value = question.provenance === 'oficial' ? 'oficial' : 'autoral';
      form.elements.source.value = question.source || '';
      form.elements.explanation.value = question.explanation || '';
      form.elements.analysis.value = (question.analysis || []).join('\n');
      form.querySelector('[type="submit"]').textContent = 'Guardar alterações';
      $('#enem-feedback').textContent = `A editar: ${question.id}.`;
      form.scrollIntoView({behavior:'smooth',block:'center'});
    }));
    $$('[data-remove-enem]').forEach(button => button.addEventListener('click', () => { const id = button.dataset.removeEnem; data.enemQuestions = data.enemQuestions.filter(item => item.id !== id); if (editingEnemId === id) { editingEnemId = null; $('#enem-form').reset(); $('#enem-form').querySelector('[type="submit"]').textContent = 'Adicionar questão'; } renderTeacherEnem(); populateEnemFilters(); renderEnem(); }));
  }
  function fillWeeklyForm() {
    const question = data.weeklyQuestion;
    if (!question) return;
    const form = $('#weekly-form');
    form.elements.prompt.value = question.prompt || '';
    form.elements.options.value = (question.options || []).join('\n');
    form.elements.correctIndex.value = Number(question.correctIndex) + 1;
    form.elements.source.value = question.source || '';
    form.elements.explanation.value = question.explanation || '';
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
      if (!Array.isArray(lesson.materials || [])) return fail(`Os materiais da aula “${lesson.id}” devem ser uma lista.`);
      if ((lesson.materials || []).some(item => !safeLink(typeof item === 'string' ? item : item?.url))) return fail(`Um material da aula “${lesson.id}” usa um protocolo de URL não permitido.`);
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
  function exportJson() {
    const validationError = validateData(data);
    if (validationError) { $('#export-feedback').textContent = `Exportação interrompida: ${validationError}`; return; }
    data.updatedAt = new Date().toISOString().slice(0,10);
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'aulas.json'; link.click(); URL.revokeObjectURL(url);
    $('#export-feedback').textContent = 'JSON válido exportado. Substitua data/aulas.json no repositório GitHub e publique pelo fluxo habitual do Pages.';
  }
  function refreshApp() {
    renderSeries(); renderSearch(); renderTracks(); renderRecent(); renderProgress(); renderSubjectFilters(); renderSearch(); renderWeekly(); populateEnemFilters(); renderEnem(); renderTeacherEnem();
    renderTrackLessonOptions((data.tracks || []).find(item => item.id === $('#edit-track-select').value));
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
      initSearchEvents(); initTeacherTabs(); initNav(); refreshApp(); fillTrackSelect(); fillLessonSelect(); setLessonForm(null); setTrackForm(null); fillWeeklyForm();
      ['#enem-year','#enem-application','#enem-subject','#enem-topic'].forEach(selector => $(selector).addEventListener('change', renderEnem));
    } catch (error) {
      document.querySelector('.main-content').insertAdjacentHTML('afterbegin', `<div class="empty-state">${escapeHtml(error.message)} Abra o site por um servidor estático e confira o arquivo de dados.</div>`);
    }
  }
  start();
})();
