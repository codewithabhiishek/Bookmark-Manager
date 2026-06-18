// Default bookmark seeds (Scrapbook theme matching user's template)
const defaultBookmarks = [
  { id: '1', title: 'Gmail', url: 'https://mail.google.com', category: 'personal', pinned: false },
  { id: '2', title: 'Udemy', url: 'https://www.udemy.com', category: 'learning', pinned: false },
  { id: '3', title: 'YouTube', url: 'https://www.youtube.com', category: 'personal', pinned: false },
  { id: '4', title: 'Unstop', url: 'https://unstop.com', category: 'learning', pinned: false },
  { id: '5', title: 'ChatGPT', url: 'https://chatgpt.com', category: 'dev', pinned: true },
  { id: '6', title: 'Claude', url: 'https://claude.ai', category: 'dev', pinned: true },
  { id: '7', title: 'Supabase', url: 'https://supabase.com', category: 'dev', pinned: true },
  { id: '8', title: 'Firebase', url: 'https://firebase.google.com', category: 'dev', pinned: false },
  { id: '9', title: 'Vercel', url: 'https://vercel.com', category: 'dev', pinned: true },
  { id: '10', title: 'Wooble', url: 'https://wooble.ai', category: 'design', pinned: false },
  { id: '11', title: 'Figma', url: 'https://figma.com', category: 'design', pinned: false },
  { id: '12', title: 'Coolors', url: 'https://coolors.co', category: 'design', pinned: false },
  { id: '13', title: 'Dribbble', url: 'https://dribbble.com', category: 'design', pinned: false },
  { id: '14', title: 'Github', url: 'https://github.com', category: 'dev', pinned: true },
  { id: '15', title: 'AuraBuild', url: 'https://aurabuild.co', category: 'freelance', pinned: false },
  { id: '16', title: 'Web3Forms', url: 'https://web3forms.com', category: 'freelance', pinned: false },
  { id: '17', title: 'My-Portfolio', url: 'https://my-portfolio.com', category: 'personal', pinned: false },
  { id: '18', title: 'Skills Directory', url: 'https://skillsdirectory.dev', category: 'learning', pinned: false },
  { id: '19', title: 'Free for Developers', url: 'https://free-for.dev', category: 'learning', pinned: true },
  { id: '20', title: 'Neal.fun', url: 'https://neal.fun', category: 'fun', pinned: false },
  { id: '21', title: 'Pointer Pointer', url: 'https://pointerpointer.com', category: 'fun', pinned: false },
  { id: '22', title: 'Radio Garden', url: 'https://radio.garden', category: 'fun', pinned: false },
  { id: '23', title: 'A Soft Murmur', url: 'https://asoftmurmur.com', category: 'fun', pinned: false }
];

const defaultCategories = {
  dev: 'Dev-Tools/',
  design: 'Design-Frontend/',
  learning: 'Learning/',
  freelance: 'Freelance-Tools/',
  personal: 'Personal/',
  fun: 'Fun-Websites/'
};

const categoryColors = {
  dev: 'var(--green)',
  design: 'var(--pink)',
  learning: 'var(--amber)',
  freelance: 'var(--cyan)',
  personal: '#aaa',
  fun: '#c084fc'
};

// Application State
let bookmarks = JSON.parse(localStorage.getItem('zenmark_bookmarks_v4')) || defaultBookmarks;
let categories = JSON.parse(localStorage.getItem('zenmark_categories_v4')) || defaultCategories;
let searchSelectedIndex = -1;
let filteredSearchResults = [];

// DOM Elements
const addDialog = document.getElementById('add-bookmark-dialog');
const searchDialog = document.getElementById('search-dialog');
const addForm = document.getElementById('add-bookmark-form');
const btnAddTrigger = document.getElementById('btn-add-trigger');
const btnCloseAdd = document.getElementById('btn-close-add');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results');
const toastContainer = document.getElementById('toast-container');
const pinStrip = document.getElementById('pin-strip');
const categoriesBoard = document.getElementById('categories-board');

// Event Listeners Initialization
// Event Listeners Initialization
function init() {
  renderAll();
  rotateMarqueeLogs();
  
  // Modal toggle listeners
  btnAddTrigger.addEventListener('click', () => { playSound('click'); openAddModal(); });
  btnCloseAdd.addEventListener('click', () => { playSound('click'); addDialog.close(); });
  btnCancelAdd.addEventListener('click', () => { playSound('click'); addDialog.close(); });
  addForm.addEventListener('submit', handleAddBookmarkSubmit);
  
  // Search actions
  searchInput.addEventListener('input', handleSearchInput);
  
  // Global '/' shortcut key
  window.addEventListener('keydown', handleGlobalKeydown);
  
  // Search Modal Navigation Keys
  searchDialog.addEventListener('keydown', handleSearchNavigation);

  // Close dialog on backdrop click
  [addDialog, searchDialog].forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        playSound('click');
        dialog.close();
      }
    });
  });

  // Handle bookmarklet query parameters & search startup
  const params = new URLSearchParams(window.location.search);
  const addParam = params.get('add');
  const urlParam = params.get('url');
  const titleParam = params.get('title');
  const qParam = params.get('q');
  
  let isRedirecting = false;
  if (qParam) {
    const query = qParam.toLowerCase().trim();
    // Search bookmarks for an exact title match or a partial URL hostname match
    const match = bookmarks.find(b => 
      b.title.toLowerCase() === query || 
      b.url.toLowerCase().includes(query)
    );
    
    if (match) {
      isRedirecting = true;
      window.location.replace(match.url);
    }
  }
  
  if (!isRedirecting) {
    if (addParam === 'true' && urlParam) {
      openAddModal();
      document.getElementById('bookmark-url').value = urlParam;
      if (titleParam) {
        document.getElementById('bookmark-title').value = titleParam;
      }
      // Clean up query string from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (qParam) {
      // If qParam did not match any direct URL, open the search dialog pre-filled with the query
      openSearchModal();
      searchInput.value = qParam.trim();
      handleSearchInput();
    } else {
      // Default startup: auto-focus search palette
      openSearchModal();
    }
  }
}

// Global render router
function renderAll() {
  renderMarquee();
  renderPinnedStickers();
  renderCategoryCards();
  syncCategoryDropdown();
}

// Sync counts in status bar marquee
function renderMarquee() {
  const textEl = document.getElementById('marquee-text');
  if (textEl) {
    textEl.textContent = `» jugaad mode: on • ${bookmarks.length} bookmarks loaded • status: synced • welcome back guest «`;
  }
}

// Dynamic Pinned Stickers Rendering
function renderPinnedStickers() {
  if (!pinStrip) return;
  pinStrip.innerHTML = '';
  
  const pinnedList = bookmarks.filter(b => b.pinned);
  
  if (pinnedList.length === 0) {
    pinStrip.innerHTML = `<div style="font-size: 10px; color: var(--muted); padding: 8px;">* No links pinned to top. Star a link chip to pin!</div>`;
    return;
  }
  
  // Starred cards capped at 6
  pinnedList.slice(0, 6).forEach(bookmark => {
    const glyph = getGlyphForDomain(bookmark.url);
    const sticker = document.createElement('a');
    sticker.href = bookmark.url;
    sticker.target = '_blank';
    sticker.rel = 'noopener noreferrer';
    sticker.className = 'sticker';
    sticker.title = `${bookmark.title} (${bookmark.url})`;
    
    let host = '';
    try {
      host = new URL(bookmark.url).hostname;
    } catch (e) {}
    
    const iconUrl = host ? `https://www.google.com/s2/favicons?sz=64&domain=${host}` : '';
    
    sticker.innerHTML = `
      <span class="pin-badge">★</span>
      <div class="glyph">
        ${iconUrl ? `
          <img class="domain-icon" src="${iconUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <span class="domain-icon-fallback" style="display:none;">${glyph}</span>
        ` : `<span>${glyph}</span>`}
      </div>
      <div class="name">${bookmark.title}</div>
    `;
    
    pinStrip.appendChild(sticker);
  });
}

// Dynamic Categories Board Cards Rendering
function renderCategoryCards() {
  if (!categoriesBoard) return;
  categoriesBoard.innerHTML = '';
  
  const categoryKeys = Object.keys(categories);
  
  categoryKeys.forEach(catKey => {
    const catName = categories[catKey];
    const catBookmarks = bookmarks.filter(b => b.category === catKey);
    const cardColor = categoryColors[catKey] || 'var(--green)';
    
    // Sort bookmarks alphabetically
    catBookmarks.sort((a, b) => a.title.localeCompare(b.title));
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-color', cardColor);
    card.setAttribute('data-cat', catKey);
    
    const titleValue = catName.endsWith('/') ? catName : `${catName}/`;
    
    card.innerHTML = `
      <div class="tape"></div>
      <div class="card-title-container">
        <input type="text" class="card-title-input" value="${titleValue}" data-key="${catKey}" aria-label="Rename Category">
        <button class="btn-card-add" data-cat="${catKey}" title="Add link to ${catName}">[+]</button>
      </div>
      <div class="card-count">${catBookmarks.length} links</div>
      <div class="chip-list" id="chip-list-${catKey}"></div>
    `;
    
    const chipListContainer = card.querySelector(`#chip-list-${catKey}`);
    
    if (catBookmarks.length === 0) {
      chipListContainer.innerHTML = `<div style="font-size: 9px; color: var(--muted); padding: 4px 0;">[empty folder]</div>`;
    } else {
      catBookmarks.forEach(bookmark => {
        const chipWrap = document.createElement('div');
        chipWrap.className = 'chip-wrapper';
        
        let host = '';
        try {
          host = new URL(bookmark.url).hostname;
        } catch (e) {}
        const iconUrl = host ? `https://www.google.com/s2/favicons?sz=32&domain=${host}` : '';
        
        chipWrap.innerHTML = `
          <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="chip ${bookmark.pinned ? 'starred' : ''}" title="${bookmark.url}">
            ${iconUrl ? `<img class="chip-icon" src="${iconUrl}" alt="" onerror="this.style.display='none'">` : ''}
            <span>${bookmark.title}</span>
          </a>
          <div class="chip-actions">
            <button class="chip-btn btn-star-chip" title="${bookmark.pinned ? 'Unstar link' : 'Star/Pin link'}">★</button>
            <button class="chip-btn btn-copy-chip" title="Copy share link">❐</button>
            <button class="chip-btn btn-delete-chip" title="Delete link">✖</button>
          </div>
          <div class="copy-tooltip">Copied!</div>
        `;
        
        // Bind chip action button listeners
        chipWrap.querySelector('.btn-star-chip').addEventListener('click', (e) => {
          e.preventDefault();
          togglePin(bookmark.id);
        });
        chipWrap.querySelector('.btn-copy-chip').addEventListener('click', (e) => {
          e.preventDefault();
          copyLink(bookmark.url, chipWrap.querySelector('.btn-copy-chip'), chipWrap.querySelector('.copy-tooltip'));
        });
        chipWrap.querySelector('.btn-delete-chip').addEventListener('click', (e) => {
          e.preventDefault();
          deleteBookmark(bookmark.id);
        });
        
        chipListContainer.appendChild(chipWrap);
      });
    }
    
    // Bind card header title rename events
    const titleInput = card.querySelector('.card-title-input');
    titleInput.addEventListener('blur', handleCategoryRename);
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        titleInput.blur();
      }
    });
    
    // Bind Card Quick Add [+]
    card.querySelector('.btn-card-add').addEventListener('click', (e) => {
      openAddModal(catKey);
    });
    
    categoriesBoard.appendChild(card);
  });
}

function syncCategoryDropdown() {
  const select = document.getElementById('bookmark-category');
  if (!select) return;
  select.innerHTML = '';
  
  Object.keys(categories).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = categories[key];
    select.appendChild(opt);
  });
}

// Logic Events
function saveState() {
  localStorage.setItem('zenmark_bookmarks_v4', JSON.stringify(bookmarks));
  localStorage.setItem('zenmark_categories_v4', JSON.stringify(categories));
}

function handleCategoryRename(e) {
  const input = e.target;
  const key = input.getAttribute('data-key');
  let newName = input.value.trim();
  
  // Ensure title suffix matches directory feel
  if (newName && !newName.endsWith('/')) {
    newName += '/';
  }
  
  if (newName && newName !== categories[key]) {
    categories[key] = newName;
    saveState();
    renderAll();
    showToast(`Renamed to "${newName}"`);
  } else {
    input.value = categories[key];
  }
}

function openAddModal(preSelectedCat = '') {
  addForm.reset();
  if (preSelectedCat) {
    document.getElementById('bookmark-category').value = preSelectedCat;
  }
  addDialog.showModal();
}

function handleAddBookmarkSubmit(e) {
  e.preventDefault();
  let url = document.getElementById('bookmark-url').value.trim();
  let title = document.getElementById('bookmark-title').value.trim();
  const category = document.getElementById('bookmark-category').value;
  
  if (!url) return;
  
  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  if (!title) {
    try {
      const hostname = new URL(url).hostname;
      title = hostname.replace('www.', '');
    } catch (e) {
      title = url;
    }
  }
  
  const newBookmark = {
    id: Date.now().toString(),
    title,
    url,
    category,
    pinned: false
  };
  
  bookmarks.push(newBookmark);
  saveState();
  renderAll();
  playSound('success');
  addDialog.close();
  showToast(`Added link "${title}"`);
}

function deleteBookmark(id) {
  const b = bookmarks.find(x => x.id === id);
  if (!b) return;
  
  bookmarks = bookmarks.filter(x => x.id !== id);
  saveState();
  renderAll();
  playSound('click');
  showToast(`Deleted link "${b.title}"`);
}

function togglePin(id) {
  const b = bookmarks.find(x => x.id === id);
  if (!b) return;
  
  if (!b.pinned) {
    const currentPinned = bookmarks.filter(x => x.pinned).length;
    if (currentPinned >= 6) {
      showToast(`Limit of 6 pinned bookmarks reached!`, true);
      return;
    }
  }
  
  b.pinned = !b.pinned;
  saveState();
  renderAll();
  playSound('star');
}

function copyLink(url, btnEl, tooltipEl) {
  navigator.clipboard.writeText(url).then(() => {
    playSound('copy');
    tooltipEl.classList.add('show');
    const originalText = btnEl.textContent;
    btnEl.textContent = '✔';
    btnEl.style.color = 'var(--green)';
    
    setTimeout(() => {
      tooltipEl.classList.remove('show');
      btnEl.textContent = originalText;
      btnEl.style.color = '';
    }, 1200);
  }).catch(err => {
    console.error('Copy failed: ', err);
    showToast('Failed to copy link', true);
  });
}

// Search Modal functionality
function openSearchModal() {
  searchSelectedIndex = -1;
  searchInput.value = '';
  filteredSearchResults = [];
  searchResultsContainer.innerHTML = '';
  searchDialog.showModal();
  setTimeout(() => searchInput.focus(), 50);
}

function handleSearchInput() {
  const query = searchInput.value.toLowerCase().trim();
  searchResultsContainer.innerHTML = '';
  searchSelectedIndex = -1;
  
  if (!query) {
    filteredSearchResults = [];
    return;
  }
  
  filteredSearchResults = bookmarks.filter(b => 
    b.title.toLowerCase().includes(query) || 
    b.url.toLowerCase().includes(query)
  );
  
  if (filteredSearchResults.length === 0) {
    searchResultsContainer.innerHTML = `<div class="search-no-results">> NO MATCHES FOUND</div>`;
    return;
  }
  
  filteredSearchResults.forEach((result, idx) => {
    const item = document.createElement('a');
    item.href = result.url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.className = 'search-result-item';
    item.setAttribute('data-id', result.id);
    
    item.innerHTML = `
      <div class="search-result-info">
        <span class="search-result-title">${result.title}</span>
        <span class="search-result-url">${result.url}</span>
      </div>
      <div class="search-result-actions">
        <span class="search-result-category">${categories[result.category]}</span>
        <button class="btn-search-copy" title="Copy URL" data-url="${result.url}">[COPY]</button>
      </div>
    `;
    
    item.querySelector('.btn-search-copy').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = e.currentTarget.getAttribute('data-url');
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied!');
      });
    });
    
    searchResultsContainer.appendChild(item);
  });
}

function handleSearchNavigation(e) {
  const items = searchResultsContainer.querySelectorAll('.search-result-item');
  if (items.length === 0) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchSelectedIndex = (searchSelectedIndex + 1) % items.length;
    updateSearchSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchSelectedIndex = (searchSelectedIndex - 1 + items.length) % items.length;
    updateSearchSelection(items);
  } else if (e.key === 'Enter') {
    let targetIndex = searchSelectedIndex;
    if (targetIndex === -1 && items.length > 0) {
      targetIndex = 0; // Default to first result
    }
    if (targetIndex >= 0 && targetIndex < items.length) {
      e.preventDefault();
      playSound('click');
      items[targetIndex].click();
      searchDialog.close();
    }
  }
}

function updateSearchSelection(items) {
  items.forEach((item, index) => {
    if (index === searchSelectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

function handleGlobalKeydown(e) {
  const activeTag = document.activeElement.tagName.toLowerCase();
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
    return; // Skip hotkeys when editing text inputs
  }

  // 1-6 number hotkeys for top pinned bookmarks
  if (e.key >= '1' && e.key <= '6') {
    const pinnedList = bookmarks.filter(b => b.pinned);
    const index = parseInt(e.key) - 1;
    if (pinnedList[index]) {
      e.preventDefault();
      playSound('click');
      window.open(pinnedList[index].url, '_blank');
      showToast(`Opening ${pinnedList[index].title}...`);
    }
  }

  if (e.key === '/') {
    e.preventDefault();
    openSearchModal();
  }
}

// Glyph lookup based on bookmark URL domains for sticker widgets
function getGlyphForDomain(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('github')) return '⌥';
    if (host.includes('vercel')) return '▲';
    if (host.includes('supabase')) return '⚡';
    if (host.includes('windsurf') || host.includes('codeium')) return '⌬';
    if (host.includes('figma')) return '◆';
    if (host.includes('google') || host.includes('gmail') || host.includes('mail.google')) return '✉';
    if (host.includes('reddit')) return 'R';
    if (host.includes('spotify')) return 'S';
    if (host.includes('udemy')) return 'U';
    if (host.includes('youtube')) return '▶';
    if (host.includes('unstop')) return '⎋';
    if (host.includes('chatgpt') || host.includes('openai')) return '💬';
    if (host.includes('claude')) return '✿';
    if (host.includes('firebase')) return '🔥';
    if (host.includes('wooble')) return 'W';
    if (host.includes('coolors')) return '🎨';
    if (host.includes('dribbble')) return '🏀';
    if (host.includes('neal.fun')) return '🎈';
    if (host.includes('pointerpointer')) return '☞';
    if (host.includes('radio.garden')) return '📻';
    if (host.includes('asoftmurmur')) return '🌊';
    if (host.includes('aurabuild')) return '⏏';
    if (host.includes('web3forms')) return '▩';
    if (host.includes('my-portfolio') || host.includes('myportfolio')) return '💻';
    if (host.includes('skillsdirectory')) return '⌘';
    if (host.includes('free-for')) return '🆓';
    return '★';
  } catch (e) {
    return '★';
  }
}

// Retro-style terminal warnings and notification alerts
function showToast(message, isWarning = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isWarning) {
    toast.style.borderColor = 'var(--pink)';
    toast.style.color = 'var(--pink)';
  }
  
  toast.innerHTML = `
    <span>> ${message.toUpperCase()}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'scroll 0.3s reverse ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Dynamic Sys-Logs rotation
const sysLogs = [
  "jugaad mode: active",
  "system status: nominal",
  "listening on local port 8000",
  "localstorage database: synced",
  "press '/' key for search hub",
  "scanline display frequency: 60hz",
  "welcome guest @localhost"
];
let currentLogIndex = 0;

function rotateMarqueeLogs() {
  const marqueeText = document.getElementById('marquee-text');
  if (!marqueeText) return;
  
  setInterval(() => {
    currentLogIndex = (currentLogIndex + 1) % sysLogs.length;
    const msg = `» ${sysLogs[currentLogIndex].toUpperCase()} • ${bookmarks.length} BOOKMARKS LOADED • STATUS: SYNCED • WELCOME BACK GUEST «`;
    marqueeText.textContent = msg;
  }, 4000);
}

// 8-Bit Synth Sound Synthesizer (Web Audio API)
let audioCtx;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'star') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); 
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); 
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'copy') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('AudioContext blocked or not supported', e);
  }
}

// Kickoff
window.addEventListener('DOMContentLoaded', init);
