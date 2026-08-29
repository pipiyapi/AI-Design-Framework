const state = {
  data: null,
  tab: 'inbox',
  index: 0,
  mediaIndex: 0,
  aspects: new Set(),
  classification: 'project-only',
};

const copy = {
  inbox: {
    kicker: '审美确认',
    heading: '先看真实效果，再做判断。',
    type: '参考候选',
    negative: '不喜欢',
    defer: '暂不确定',
    positive: '保留',
  },
  patterns: {
    kicker: '模式晋级',
    heading: '这条规律，真的属于你的审美吗？',
    type: '模式候选',
    negative: '拒绝晋级',
    defer: '继续观察',
    positive: '确认晋级',
  },
  feedback: {
    kicker: '项目反馈',
    heading: '问题来自审美、场景，还是实现？',
    type: '反馈候选',
    negative: '留在收件箱',
    defer: '稍后再看',
    positive: '确认吸收',
  },
};

const aspects = [
  ['typography', '字体与排版'],
  ['layout', '布局'],
  ['color', '颜色'],
  ['motion', '动效'],
  ['components', '组件细节'],
  ['overall-tone', '整体气质'],
];

const classifications = [
  ['project-only', '仅限这个项目', '模式本身可能仍适合其他场景。'],
  ['general-preference', '长期审美偏好', '它应该影响你的个人设计 DNA。'],
  ['implementation-mismatch', '实现没有还原好', '保留模式，改进实现配方或复刻过程。'],
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function currentList() { return state.data?.[state.tab] || []; }
function currentItem() { return currentList()[state.index] || null; }

function mediaUrl(mediaPath) {
  return `/api/media?path=${encodeURIComponent(mediaPath)}`;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function setStatus(message) { $('#memory-status').textContent = message; }

function renderCounts() {
  for (const key of ['inbox', 'patterns', 'feedback']) {
    $(`[data-count="${key}"]`).textContent = state.data?.[key]?.length || 0;
  }
}

function renderMedia(item) {
  const frame = $('#evidence-frame');
  const strip = $('#evidence-strip');
  frame.replaceChildren();
  strip.replaceChildren();
  const media = item.media || [];
  if (!media.length) {
    const placeholder = document.createElement('p');
    placeholder.className = 'evidence-placeholder';
    placeholder.textContent = '暂时没有视觉材料。请先补充截图或录屏，再做审美判断。';
    frame.append(placeholder);
    return;
  }
  state.mediaIndex = Math.min(state.mediaIndex, media.length - 1);
  const selected = media[state.mediaIndex];
  const isVideo = /\.(mp4|mov|webm)$/i.test(selected);
  const visual = document.createElement(isVideo ? 'video' : 'img');
  visual.src = mediaUrl(selected);
  if (isVideo) {
    visual.controls = true;
    visual.loop = true;
    visual.preload = 'metadata';
  } else {
    visual.alt = `${item.title} 的视觉材料`;
    visual.decoding = 'async';
  }
  frame.append(visual);

  media.forEach((asset, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === state.mediaIndex));
    const filename = asset.split('/').pop();
    button.textContent = /mobile/i.test(filename) ? '手机版' : /desktop/i.test(filename) ? '桌面版' : /\.(mp4|mov|webm)$/i.test(filename) ? '播放动效' : `视觉材料 ${index + 1}`;
    button.addEventListener('click', () => {
      state.mediaIndex = index;
      renderMedia(item);
    });
    strip.append(button);
  });
}

function renderTags(item) {
  const container = $('#tag-list');
  container.replaceChildren();
  const tags = [...new Set([...(item.tags || []), ...(item.suggestedTags || [])])];
  if (!tags.length) {
    const tag = document.createElement('span');
    tag.textContent = '等待分析';
    container.append(tag);
    return;
  }
  tags.forEach(value => {
    const tag = document.createElement('span');
    tag.textContent = value;
    container.append(tag);
  });
}

function renderAspects(item) {
  const section = $('#aspect-section');
  const grid = $('#aspect-grid');
  section.hidden = state.tab !== 'inbox';
  grid.replaceChildren();
  state.aspects = new Set(item.likedAspects || []);
  aspects.forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(state.aspects.has(value)));
    button.addEventListener('click', () => {
      state.aspects.has(value) ? state.aspects.delete(value) : state.aspects.add(value);
      button.setAttribute('aria-pressed', String(state.aspects.has(value)));
      updateAspectToggle();
    });
    grid.append(button);
  });
  updateAspectToggle();
}

function updateAspectToggle() {
  $('#toggle-aspects').textContent = state.aspects.size === aspects.length ? '取消全选' : '全选';
}

function renderClassifications() {
  const section = $('#feedback-section');
  const container = $('#classification-list');
  section.hidden = state.tab !== 'feedback';
  container.replaceChildren();
  classifications.forEach(([value, label, description]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(state.classification === value));
    const strong = document.createElement('strong');
    strong.textContent = label;
    const small = document.createElement('small');
    small.textContent = description;
    button.append(strong, small);
    button.addEventListener('click', () => {
      state.classification = value;
      renderClassifications();
    });
    container.append(button);
  });
}

function render() {
  if (!state.data) return;
  renderCounts();
  const config = copy[state.tab];
  $('#review-kicker').textContent = config.kicker;
  $('#review-heading').textContent = config.heading;
  const list = currentList();
  state.index = Math.min(state.index, Math.max(0, list.length - 1));
  const item = currentItem();
  $('#review-progress').textContent = `${list.length ? state.index + 1 : 0} / ${list.length}`;
  $('#review-stage').hidden = !item;
  $('#decision-bar').hidden = !item;
  $('#empty-state').hidden = Boolean(item);
  if (!item) return;

  $('#decision-type').textContent = config.type;
  $('#decision-title').textContent = item.title;
  const source = $('#decision-source');
  source.hidden = !item.sourceUrl;
  source.href = item.sourceUrl || '#';
  $('#decision-summary').textContent = item.summary || '视觉材料已经准备好。等你确认值得保留后，再进行更深入的分析。';
  renderTags(item);
  renderMedia(item);
  renderAspects(item);
  renderClassifications();

  $('[data-action="negative"]').textContent = config.negative;
  $('[data-action="defer"]').textContent = config.defer;
  $('[data-action="positive"]').textContent = config.positive;
}

async function load() {
  setStatus('正在加载中央知识队列…');
  const response = await fetch('/api/state');
  if (!response.ok) throw new Error('无法加载待确认内容。');
  state.data = await response.json();
  setStatus(`${state.data.settings.vaultName} · Skill ${state.data.settings.skillVersion}`);
  render();
}

async function post(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || '保存确认结果失败。');
  }
}

async function act(kind) {
  const item = currentItem();
  if (!item) return;
  setStatus('正在保存你的判断…');
  if (state.tab === 'inbox') {
    const decision = kind === 'positive' ? 'liked' : kind === 'negative' ? 'rejected' : 'unsure';
    await post('/api/review/reference', { id: item.id, decision, aspects: [...state.aspects] });
  } else if (state.tab === 'patterns') {
    const decision = kind === 'positive' ? 'approved' : kind === 'negative' ? 'rejected' : 'observe';
    await post('/api/review/pattern', { id: item.id, decision });
  } else {
    const decision = kind === 'positive' ? 'approved' : 'deferred';
    await post('/api/review/feedback', { id: item.id, decision, classification: state.classification });
  }
  showToast('判断已保存到 Obsidian 知识库。');
  state.mediaIndex = 0;
  await load();
}

$$('.review-tabs button').forEach(button => {
  button.addEventListener('click', () => {
    state.tab = button.dataset.tab;
    state.index = 0;
    state.mediaIndex = 0;
    $$('.review-tabs button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render();
  });
});

$('#toggle-aspects').addEventListener('click', () => {
  if (state.aspects.size === aspects.length) state.aspects.clear();
  else aspects.forEach(([value]) => state.aspects.add(value));
  $$('#aspect-grid button').forEach((button, index) => button.setAttribute('aria-pressed', String(state.aspects.has(aspects[index][0]))));
  updateAspectToggle();
});

$$('[data-action]').forEach(button => button.addEventListener('click', () => act(button.dataset.action).catch(error => {
  setStatus(error.message);
  showToast(error.message);
})));

load().catch(error => {
  setStatus(error.message);
  showToast(error.message);
});
