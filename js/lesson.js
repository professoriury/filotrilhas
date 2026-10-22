(() => {
  'use strict';
  const STORAGE_KEY = 'trilha-progress-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const multiline = value => escapeHtml(value).replace(/\r?\n/g, '<br>');
  function safeHttpUrl(value) {
    const raw = String(value || '').trim();
    if (!raw || raw.startsWith('//')) return '';
    try { return ['https:','http:'].includes(new URL(raw, document.baseURI).protocol) ? raw : ''; }
    catch { return ''; }
  }
  const steps = [['assistir','Assistir'],['estudar','Estudar'],['praticar','Praticar'],['refletir','Refletir']];
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { progress = {}; }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* armazenamento indisponível */ } }
  function loadProgress(id) { return progress[id] || (progress[id] = {}); }
  function concepts(list) { return list?.length ? `<div class="concept-list">${list.map(item => `<span class="concept-chip">${escapeHtml(item)}</span>`).join('')}</div>` : '<p>Conceitos ainda não cadastrados.</p>'; }
  function renderReferences(items) {
    const list = (items || []).map(item => {
      const text = typeof item === 'string' ? item.trim() : '';
      const looksLikeUrl = text && /^(?:https?:\/\/|\.{1,2}\/|\/|[\w-]+\/)/i.test(text);
      const rawUrl = typeof item === 'string' ? (looksLikeUrl ? text : '') : String(item?.url || '').trim();
      const label = typeof item === 'string' ? text : String(item?.label || item?.text || rawUrl).trim();
      if (!label && !rawUrl) return '';
      const url = rawUrl ? safeHttpUrl(rawUrl) : '';
      if (url) return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a></li>`;
      return `<li>${escapeHtml(label || rawUrl)}${rawUrl ? ' <span>(link não permitido)</span>' : ''}</li>`;
    }).filter(Boolean).join('');
    return list ? `<ul>${list}</ul>` : '<p>Nenhuma referência cadastrada.</p>';
  }
  function render(lesson, tracks = []) {
    document.title = `${lesson.title} — FILOTRILHAS`;
    const trackTitle = (tracks || []).find(track => track.id === lesson.trackId)?.title || lesson.trackId || '';
    const status = lesson.status === 'published' ? '<span class="pill">PUBLICADO</span>' : '<span class="pill pill-demo">DEMONSTRAÇÃO · NÃO PUBLICADO</span>';
    const videoUrl = safeHttpUrl(lesson.video?.url);
    const video = videoUrl && lesson.video?.published
      ? `<a class="button button-outline" href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">Abrir vídeo indicado pelo professor ↗</a>`
      : `<div class="video-placeholder"><div><strong>${lesson.video?.url && !videoUrl ? 'Link de vídeo bloqueado' : 'Vídeo não publicado'}</strong>${escapeHtml(lesson.video?.url && !videoUrl ? 'Só são aceites links HTTPS, HTTP ou caminhos relativos seguros.' : lesson.video?.label || 'Nenhum link de vídeo foi fornecido para esta demonstração.')}</div></div>`;
    const studyQuestions = (lesson.studyQuestions || []).length
      ? `<ol>${lesson.studyQuestions.map(question => `<li class="print-question">${escapeHtml(question)}</li>`).join('')}</ol>`
      : '<p>Questões ainda não cadastradas.</p>';
    const recommendationBody = multiline(lesson.recommendations || 'Nenhuma recomendação POP cadastrada.');
    const activityBody = multiline(lesson.activity || 'Atividade reflexiva ainda não cadastrada.');
    const supplementalText = String(lesson.challenge || '').trim();
    const supplementalPrompt = supplementalText
      ? `<div class="lesson-exercise"><h3>Pergunta complementar</h3><p>${multiline(supplementalText)}</p></div>`
      : '';
    $('#lesson-content').innerHTML = `<div class="lesson-hero"><p class="print-heading">FILOTRILHAS · ESTUDO DIRIGIDO</p><div class="lesson-kicker">${(lesson.grades || []).map(grade => `<span class="pill">${escapeHtml(grade)}</span>`).join('')}<span class="pill">${escapeHtml(lesson.discipline)}</span>${status}</div><h1>${escapeHtml(lesson.title)}</h1><p class="objective">${escapeHtml(lesson.objective || '')}</p><p class="lesson-meta-line">${escapeHtml(lesson.topic)}${lesson.trackId ? ` · Trilha: ${escapeHtml(trackTitle)}` : ''}</p></div>
      <section class="steps-panel no-print"><h2>Missão da aula <span class="privacy-note">Marque cada etapa quando você decidir que concluiu.</span></h2><div class="steps-grid">${steps.map(([key,label],index) => `<button class="step-button ${loadProgress(lesson.id)[key] ? 'done' : ''}" type="button" data-step="${key}" aria-pressed="${Boolean(loadProgress(lesson.id)[key])}">${String(index+1).padStart(2,'0')} · ${label}<span>${loadProgress(lesson.id)[key] ? 'Concluída por você' : 'Marcar ao concluir'}</span></button>`).join('')}</div></section>
      <section class="lesson-content-section"><h2>Objetivo de aprendizagem</h2><p>${escapeHtml(lesson.objective || 'Objetivo não informado.')}</p></section>
      <section class="lesson-content-section"><h2>Assistir Vídeo</h2>${video}</section>
      <section class="lesson-content-section"><h2>Resumo do Conteúdo</h2><p>${escapeHtml(lesson.summary || 'Resumo ainda não cadastrado.')}</p></section>
      <section class="lesson-content-section"><h2>Conceitos-chave</h2>${concepts(lesson.keyConcepts)}</section>
      <section class="lesson-content-section"><h2>Recomendações POP</h2><div class="lesson-exercise"><p>${recommendationBody}</p></div></section>
      <section class="lesson-content-section"><h2>Atividade Reflexiva</h2><div class="lesson-exercise"><h3>Atividade</h3><p>${activityBody}</p></div>${supplementalPrompt}</section>
      <section class="lesson-content-section"><h2>Estudo Dirigido</h2>${studyQuestions}</section>
      <section class="lesson-content-section"><h2>Referências</h2>${renderReferences(lesson.materials)}</section>
      <div class="lesson-action-row no-print"><a class="back-link" href="./">← Voltar às trilhas</a><button id="print-inline" class="button button-dark" type="button">Imprimir / Guardar em PDF ↗</button></div>`;
    $$stepButtons();
    $('#print-inline').addEventListener('click', () => window.print());
  }
  function $$stepButtons() {
    document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
      const id = new URLSearchParams(location.search).get('id');
      const item = loadProgress(id);
      item[button.dataset.step] = !item[button.dataset.step];
      save();
      button.classList.toggle('done', item[button.dataset.step]);
      button.setAttribute('aria-pressed', String(item[button.dataset.step]));
      button.querySelector('span').textContent = item[button.dataset.step] ? 'Concluída por você' : 'Marcar ao concluir';
    }));
  }
  async function start() {
    $('#print-button').addEventListener('click', () => window.print());
    const id = new URLSearchParams(location.search).get('id');
    try {
      if (!id) throw new Error('Esta página precisa de um identificador de aula.');
      const response = await fetch(new URL('data/aulas.json', document.baseURI));
      if (!response.ok) throw new Error('Não foi possível carregar o arquivo de aulas.');
      const data = await response.json();
      const lesson = (data.lessons || []).find(item => item.id === id && item.status !== 'draft');
      if (!lesson) throw new Error('A aula solicitada não foi encontrada.');
      render(lesson, (data.tracks || []).filter(track => track.status !== 'draft'));
    } catch (error) {
      $('#lesson-content').innerHTML = `<section class="lesson-error"><span class="eyebrow">CONTEÚDO INDISPONÍVEL</span><h1>Não encontramos esta aula.</h1><p>${escapeHtml(error.message)}</p><a class="button button-dark" href="./">Voltar ao início</a></section>`;
    }
  }
  start();
})();
