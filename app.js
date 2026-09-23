import {
  FORBIDDEN_OBJECT_KEYS,
  stripTags,
  escapeHTML,
  isSafeUrl,
  sanitizeUrl,
  formatBookmarkTitle,
  formatCategoryName,
  getCategoryColor,
  generateSecureKey,
  validateSyncKey,
  getGlyphForDomain,
  validateSyncPayload
} from './bookmarkUtils.js';

// Speed-Trap timing tracker to defend against automated script spam (< 1.8s)
const modalOpenTimes = {
  add: 0,
  edit: 0,
  addCat: 0,
  editCat: 0
};

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
  fun: 'Fun-Websites/',
  vibe: 'Vibe-Coding/'
};

// ── Project Icon Registry ──────────────────────────────────────────────
// Maps hostname fragments to local favicon files under /assets/project-icons/.
// These are the REAL application favicons copied from each project's /public/ dir.
// For your own projects, this ensures the actual app icon is always displayed
// instead of a generic CDN-fetched icon or placeholder.
const PROJECT_ICONS = {
  'my-portfolio':    '/assets/project-icons/my-portfolio.svg',
  'study-os':        '/assets/project-icons/study-os.ico',
  'studyos':         '/assets/project-icons/study-os.ico',
  'mystudy':         '/assets/project-icons/study-os.ico',
  'book-vault':      '/assets/project-icons/book-vault.svg',
  'bookvault':       '/assets/project-icons/book-vault.svg',
  'fitarena':        '/assets/project-icons/fitarena.svg',
  'fit-arena':       '/assets/project-icons/fitarena.svg',
  'college-track':   '/assets/project-icons/college-tracker.svg',
  'college-tracker': '/assets/project-icons/college-tracker.svg',
  'traffic-hub':     '/assets/project-icons/traffic-hub.svg',
  'smart-traffic':   '/assets/project-icons/traffic-hub.svg',
  'ev-route':        '/assets/project-icons/ev-route.svg',
  'evroute':         '/assets/project-icons/ev-route.svg',
  'cursor-100':      '/assets/project-icons/cursor-100kg.svg',
  'cursor-100kg':    '/assets/project-icons/cursor-100kg.svg',
  'zen-sudoku':      '/assets/project-icons/zen-sudoku.png',
  'windows-xp':      '/assets/project-icons/windows-xp.svg',
  'retro-windows':   '/assets/project-icons/windows-xp.svg',
};

// Resolve the favicon URL for a bookmark.
// 1. If the hostname matches a project in PROJECT_ICONS, use the local icon.
// 2. If it's a localhost URL, try origin/favicon.ico directly.
// 3. Otherwise, use the DuckDuckGo favicon API for external websites.
// Returns { iconUrl, isProjectIcon }
function getProjectIcon(host, origin) {
  if (!host) return { iconUrl: '', isProjectIcon: false };
  const hostLower = host.toLowerCase();
  for (const [fragment, iconPath] of Object.entries(PROJECT_ICONS)) {
    if (hostLower.includes(fragment)) {
      return { iconUrl: iconPath, isProjectIcon: true };
    }
  }
  const isLocal = hostLower.includes('localhost') || hostLower.includes('127.0.0.1') || hostLower.includes('0.0.0.0');
  if (isLocal) {
    return { iconUrl: origin ? `${origin}/favicon.ico` : '', isProjectIcon: false };
  }
  return { iconUrl: `https://icons.duckduckgo.com/ip3/${host}.ico`, isProjectIcon: false };
}

// Application State
try {
  localStorage.setItem('zenmark_has_visited', 'true');
} catch (err) {
  void err;
}

let bookmarks = defaultBookmarks;
let syncKey = localStorage.getItem('zenmark_sync_key') || '';

try {
  const localBookmarks = localStorage.getItem('zenmark_bookmarks_v4');
  if (localBookmarks) {
    bookmarks = JSON.parse(localBookmarks);
  }
} catch {
  console.warn('Failed to parse bookmarks from localStorage, using defaults.');
}

bookmarks.forEach((b, index) => {
  if (typeof b.sortIndex !== 'number') {
    b.sortIndex = index;
  }
});
bookmarks.sort((a, b) => a.sortIndex - b.sortIndex);

let savedCategories = null;
try {
  const localCats = localStorage.getItem('zenmark_categories_v4');
  if (localCats) {
    savedCategories = JSON.parse(localCats);
  }
} catch {
  console.warn('Failed to parse categories from localStorage.');
}

let categories = savedCategories ? { ...savedCategories } : { ...defaultCategories };
if (savedCategories) {
  // Preserve saved user key order 100%; only append missing defaults at the end if any
  Object.keys(defaultCategories).forEach(key => {
    if (!(key in categories)) {
      categories[key] = defaultCategories[key];
    }
  });
}
let searchSelectedIndex = -1;
let filteredSearchResults = [];

// DOM Elements
const addDialog = document.getElementById('add-bookmark-dialog');
const editDialog = document.getElementById('edit-bookmark-dialog');
const searchDialog = document.getElementById('search-dialog');
const addForm = document.getElementById('add-bookmark-form');
const editForm = document.getElementById('edit-bookmark-form');
const btnAddTrigger = document.getElementById('btn-add-trigger');
const btnCloseAdd = document.getElementById('btn-close-add');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const btnCloseEdit = document.getElementById('btn-close-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const editBookmarkId = document.getElementById('edit-bookmark-id');
const editBookmarkUrl = document.getElementById('edit-bookmark-url');
const editBookmarkTitle = document.getElementById('edit-bookmark-title');
const editBookmarkCategory = document.getElementById('edit-bookmark-category');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results');
const toastContainer = document.getElementById('toast-container');
const pinStrip = document.getElementById('pin-strip');
const categoriesBoard = document.getElementById('categories-board');

const editCatDialog = document.getElementById('edit-category-dialog');
const editCatForm = document.getElementById('edit-category-form');
const btnCloseEditCat = document.getElementById('btn-close-edit-cat');
const btnCancelEditCat = document.getElementById('btn-cancel-edit-cat');

const addCatDialog = document.getElementById('add-category-dialog');
const addCatForm = document.getElementById('add-category-form');
const btnCloseAddCat = document.getElementById('btn-close-add-cat');
const btnCancelAddCat = document.getElementById('btn-cancel-add-cat');
const btnAddCategoryTrigger = document.getElementById('btn-add-category-trigger');

// Cloud Sync DOM Elements
const btnSyncTrigger = document.getElementById('btn-sync-trigger');
const syncDialog = document.getElementById('sync-dialog');
const btnCloseSync = document.getElementById('btn-close-sync');
const syncStatusBox = document.getElementById('sync-status-box');
const syncStatusLabel = document.getElementById('sync-status-label');
const syncActiveKey = document.getElementById('sync-active-key');
const btnCopySyncKey = document.getElementById('btn-copy-sync-key');
const btnGenerateSyncKey = document.getElementById('btn-generate-sync-key');
const syncInputKey = document.getElementById('sync-input-key');
const btnConnectSyncKey = document.getElementById('btn-connect-sync-key');
const btnDisconnectSync = document.getElementById('btn-disconnect-sync');

// Event Listeners Initialization
function init() {
  if (syncKey) {
    document.body.inert = true;
    document.body.classList.add('is-syncing');
  }
  renderAll();
  rotateMarqueeLogs();
  updateSyncUI();
  
  // Sync bookmarks and categories if syncKey is configured
  if (syncKey) {
    syncFromCloud();
  } else {
    document.body.inert = false;
    document.body.classList.remove('is-syncing');
  }

  // Cloud Sync Modal listeners
  if (btnSyncTrigger) {
    btnSyncTrigger.addEventListener('click', () => {
      playSound('click');
      updateSyncUI();
      syncDialog.showModal();
    });
  }
  if (btnCloseSync) {
    btnCloseSync.addEventListener('click', () => {
      playSound('click');
      syncDialog.close();
    });
  }
  if (btnCopySyncKey) {
    btnCopySyncKey.addEventListener('click', handleCopySyncKey);
  }
  if (btnGenerateSyncKey) {
    btnGenerateSyncKey.addEventListener('click', handleGenerateNewSyncKey);
  }
  if (btnConnectSyncKey) {
    btnConnectSyncKey.addEventListener('click', handleConnectSyncKey);
  }
  if (btnDisconnectSync) {
    btnDisconnectSync.addEventListener('click', handleDisconnectSync);
  }

  // Modal toggle listeners
  btnAddTrigger.addEventListener('click', () => { playSound('click'); openAddModal(); });
  btnCloseAdd.addEventListener('click', () => { playSound('click'); addDialog.close(); });
  btnCancelAdd.addEventListener('click', () => { playSound('click'); addDialog.close(); });
  addForm.addEventListener('submit', handleAddBookmarkSubmit);
  
  // Edit Modal toggle listeners
  btnCloseEdit.addEventListener('click', () => { playSound('click'); editDialog.close(); });
  btnCancelEdit.addEventListener('click', () => { playSound('click'); editDialog.close(); });
  editForm.addEventListener('submit', handleEditBookmarkSubmit);
  
  // Search actions
  searchInput.addEventListener('input', handleSearchInput);
  
  // Global '/' shortcut key
  window.addEventListener('keydown', handleGlobalKeydown);
  
  // Search Modal Navigation Keys
  searchInput.addEventListener('keydown', handleSearchNavigation);

  // Add Category Modal toggle listeners
  btnAddCategoryTrigger.addEventListener('click', () => { playSound('click'); openAddCategoryModal(); });
  btnCloseAddCat.addEventListener('click', () => { playSound('click'); addCatDialog.close(); });
  btnCancelAddCat.addEventListener('click', () => { playSound('click'); addCatDialog.close(); });
  addCatForm.addEventListener('submit', handleAddCategorySubmit);


  // Edit Category Modal toggle listeners
  btnCloseEditCat.addEventListener('click', () => { playSound('click'); editCatDialog.close(); });
  btnCancelEditCat.addEventListener('click', () => { playSound('click'); editCatDialog.close(); });
  editCatForm.addEventListener('submit', handleEditCategorySubmit);

  // Close dialog on backdrop click
  [addDialog, searchDialog, editDialog, editCatDialog, addCatDialog].forEach(dialog => {
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
      (b && typeof b.title === 'string' && b.title.toLowerCase() === query) || 
      (b && typeof b.url === 'string' && b.url.toLowerCase().includes(query))
    );
    
    if (match && isSafeUrl(match.url)) {
      isRedirecting = true;
      window.location.replace(match.url);
    }
  }
  
  if (!isRedirecting) {
    if (addParam === 'true' && urlParam) {
      openAddModal();
      const safeUrlParam = sanitizeUrl(urlParam);
      document.getElementById('bookmark-url').value = safeUrlParam !== '#' ? safeUrlParam : '';
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
    const statusText = syncKey ? 'cloud synced' : 'local mode (offline)';
    textEl.textContent = `» jugaad mode: on • ${bookmarks.length} bookmarks loaded • status: ${statusText} • welcome back abhishek «`;
  }
}

// Dynamic Pinned Stickers Rendering
function renderPinnedStickers() {
  if (!pinStrip) return;
  pinStrip.innerHTML = '';
  
  const pinnedList = bookmarks.filter(b => b.pinned).sort((a, b) => a.sortIndex - b.sortIndex);
  
  if (pinnedList.length === 0) {
    pinStrip.innerHTML = `<div style="font-size: 10px; color: var(--muted); padding: 8px;">* No links pinned to top. Star a link chip to pin!</div>`;
    return;
  }
  
  // Starred cards capped at 10
  pinnedList.slice(0, 10).forEach(bookmark => {
    const glyph = getGlyphForDomain(bookmark.url);
    const sticker = document.createElement('a');
    sticker.href = sanitizeUrl(bookmark.url);
    sticker.target = '_blank';
    sticker.rel = 'noopener noreferrer';
    sticker.className = 'sticker';
    sticker.title = `${bookmark.title} (${bookmark.url})`;
    
    let host = '';
    let origin = '';
    try {
      const parsed = new URL(bookmark.url);
      host = parsed.hostname;
      origin = parsed.origin;
    } catch (err) {
      void err;
    }
    
    const { iconUrl, isProjectIcon } = getProjectIcon(host, origin);
    
    sticker.innerHTML = `
      <span class="pin-badge">★</span>
      <div class="glyph">
        ${iconUrl ? `
          <img class="domain-icon" src="${iconUrl}" loading="lazy" decoding="async" data-url="${escapeHTML(sanitizeUrl(bookmark.url))}" data-host="${escapeHTML(host)}" data-origin="${escapeHTML(origin)}" alt=""${isProjectIcon ? '' : ' onerror="window.handleFaviconError(this)"'}>
          <span class="domain-icon-fallback" style="display:none;">${glyph}</span>
        ` : `<span class="domain-icon-fallback" style="display:inline-flex;">${glyph}</span>`}
      </div>
      <div class="name">${escapeHTML(bookmark.title)}</div>
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
    const catBookmarks = bookmarks.filter(b => b.category === catKey).sort((a, b) => a.sortIndex - b.sortIndex);
    const cardColor = getCategoryColor(catKey);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-color', cardColor);
    card.setAttribute('data-cat', catKey);
    
    const titleValue = escapeHTML(catName.endsWith('/') ? catName : `${catName}/`);
    
    card.innerHTML = `
      <div class="tape"></div>
      <div class="card-title-container">
        <input type="text" class="card-title-input" value="${titleValue}" data-key="${catKey}" aria-label="Rename Category" readonly>
        <div class="card-title-actions">
          <button class="btn-card-add" data-cat="${catKey}" title="Add link to ${catName}">[+]</button>
          <button class="btn-card-edit-cat" data-cat="${catKey}" title="Rename category ${catName}">[✎]</button>
          <button class="btn-card-delete" data-cat="${catKey}" title="Delete category ${catName}">[✖]</button>
        </div>
      </div>
      <div class="card-count">${catBookmarks.length} links</div>
      <div class="chip-list" id="chip-list-${catKey}"></div>
    `;
    
    const chipListContainer = card.querySelector(`#chip-list-${catKey}`);
    
    if (catBookmarks.length === 0) {
      chipListContainer.innerHTML = `<div style="font-size: 9px; color: var(--muted); padding: 4px 0; line-height: 1.4;">no bookmarks yet_<br>press [+] to add one</div>`;
    } else {
      catBookmarks.forEach(bookmark => {
        const chipWrap = document.createElement('div');
        chipWrap.className = 'chip-wrapper';
        chipWrap.setAttribute('draggable', 'true');
        
        let host = '';
        let origin = '';
        try {
          const parsed = new URL(bookmark.url);
          host = parsed.hostname;
          origin = parsed.origin;
        } catch (err) {
          void err;
        }
        const { iconUrl, isProjectIcon } = getProjectIcon(host, origin);
        
        const glyph = getGlyphForDomain(bookmark.url);
        chipWrap.innerHTML = `
          <a href="${escapeHTML(sanitizeUrl(bookmark.url))}" target="_blank" rel="noopener noreferrer" class="chip ${bookmark.pinned ? 'starred' : ''}" title="${escapeHTML(bookmark.url)}">
            ${iconUrl ? `
              <img class="chip-icon" src="${iconUrl}" loading="lazy" decoding="async" data-url="${escapeHTML(sanitizeUrl(bookmark.url))}" data-host="${escapeHTML(host)}" data-origin="${escapeHTML(origin)}" alt=""${isProjectIcon ? '' : ' onerror="window.handleFaviconError(this)"'}>
              <span class="domain-icon-fallback" style="display:none; font-size:10px;">${glyph}</span>
            ` : `<span class="domain-icon-fallback" style="display:inline-flex; font-size:10px;">${glyph}</span>`}
            <span>${escapeHTML(bookmark.title)}</span>
          </a>
          <div class="chip-actions">
            <button class="chip-btn btn-star-chip" title="${bookmark.pinned ? 'Unstar link' : 'Star/Pin link'}">★</button>
            <button class="chip-btn btn-edit-chip" title="Edit link">✎</button>
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
        chipWrap.querySelector('.btn-edit-chip').addEventListener('click', (e) => {
          e.preventDefault();
          openEditModal(bookmark.id);
        });
        chipWrap.querySelector('.btn-copy-chip').addEventListener('click', (e) => {
          e.preventDefault();
          copyLink(bookmark.url, chipWrap.querySelector('.btn-copy-chip'), chipWrap.querySelector('.copy-tooltip'));
        });
        chipWrap.querySelector('.btn-delete-chip').addEventListener('click', (e) => {
          e.preventDefault();
          deleteBookmark(bookmark.id);
        });
        // Drag-and-drop source event listeners
        chipWrap.addEventListener('dragstart', (e) => {
          e.stopPropagation(); // Prevent drag events bubbling to card
          chipWrap.classList.add('dragging');
          e.dataTransfer.setData('text/plain', bookmark.id);
          e.dataTransfer.effectAllowed = 'move';
        });

        chipWrap.addEventListener('dragend', () => {
          chipWrap.classList.remove('dragging');
          document.querySelectorAll('.card').forEach(c => {
            c.classList.remove('drag-over');
            c.classList.remove('card-drag-over');
          });
          document.querySelectorAll('.chip-wrapper').forEach(cw => {
            cw.classList.remove('drag-over');
          });
        });

        // Drag-and-drop destination event listeners for Chip
        chipWrap.addEventListener('dragenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const types = e.dataTransfer ? e.dataTransfer.types : null;
          const isCard = types && Array.from(types).includes('text/category-key');
          if (!isCard) {
            chipWrap.classList.add('drag-over');
          }
        });
        
        chipWrap.addEventListener('dragleave', (e) => {
          e.stopPropagation();
          chipWrap.classList.remove('drag-over');
        });
        
        chipWrap.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        
        chipWrap.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          chipWrap.classList.remove('drag-over');
          
          const types = e.dataTransfer ? e.dataTransfer.types : null;
          const isCard = types && Array.from(types).includes('text/category-key');
          if (!isCard) {
            const draggedBookmarkId = e.dataTransfer.getData('text/plain');
            const targetBookmarkId = bookmark.id;
            
            if (draggedBookmarkId && targetBookmarkId && draggedBookmarkId !== targetBookmarkId) {
              const draggedIdx = bookmarks.findIndex(x => x.id === draggedBookmarkId);
              const targetIdx = bookmarks.findIndex(x => x.id === targetBookmarkId);
              
              if (draggedIdx !== -1 && targetIdx !== -1) {
                const draggedBookmark = bookmarks[draggedIdx];
                const oldCat = draggedBookmark.category;
                const newCat = bookmark.category;
                draggedBookmark.category = newCat;
                
                // Remove from old index and insert at target index
                bookmarks.splice(draggedIdx, 1);
                
                const newTargetIdx = bookmarks.findIndex(x => x.id === targetBookmarkId);
                bookmarks.splice(newTargetIdx, 0, draggedBookmark);
                
                saveState();
                renderAll();
                playSound('success');
                
                const newCatName = categories[newCat] || newCat;
                if (oldCat !== newCat) {
                  showToast(`Moved "${draggedBookmark.title}" to "${newCatName}"`);
                } else {
                  showToast(`Reordered "${draggedBookmark.title}"`);
                }
              }
            }
          }
        });
        
        chipListContainer.appendChild(chipWrap);
      });
    }
    
    // Bind Card Quick Add [+]
    card.querySelector('.btn-card-add').addEventListener('click', () => {
      openAddModal(catKey);
    });
    
    // Bind Card Rename [✎]
    card.querySelector('.btn-card-edit-cat').addEventListener('click', () => {
      openEditCategoryModal(catKey);
    });

    // Bind Double-Click on Title to Rename
    const titleInput = card.querySelector('.card-title-input');
    if (titleInput) {
      titleInput.addEventListener('dblclick', () => {
        openEditCategoryModal(catKey);
      });
    }
    
    // Bind Card Delete [✖]
    card.querySelector('.btn-card-delete').addEventListener('click', () => {
      deleteCategory(catKey);
    });

    // Make Card draggable via Tape handle
    const tape = card.querySelector('.tape');
    tape.addEventListener('mousedown', () => {
      card.setAttribute('draggable', 'true');
    });
    
    tape.addEventListener('mouseup', () => {
      card.removeAttribute('draggable');
    });

    card.addEventListener('dragstart', (e) => {
      card.classList.add('card-dragging');
      e.dataTransfer.setData('text/category-key', catKey);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('card-dragging');
      card.removeAttribute('draggable');
      document.querySelectorAll('.card').forEach(c => {
        c.classList.remove('drag-over');
        c.classList.remove('card-drag-over');
      });
    });

    // Drag-and-drop target event listeners for Card
    let dragCounter = 0;
    
    card.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      const types = e.dataTransfer ? e.dataTransfer.types : null;
      const isCard = types && Array.from(types).includes('text/category-key');
      if (isCard) {
        card.classList.add('card-drag-over');
      } else {
        card.classList.add('drag-over');
      }
    });
    
    card.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter === 0) {
        card.classList.remove('drag-over');
        card.classList.remove('card-drag-over');
      }
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      card.classList.remove('drag-over');
      card.classList.remove('card-drag-over');
      
      const types = e.dataTransfer ? e.dataTransfer.types : null;
      const isCard = types && Array.from(types).includes('text/category-key');
      if (isCard) {
        const draggedKey = e.dataTransfer.getData('text/category-key');
        const targetKey = card.getAttribute('data-cat');
        if (draggedKey && targetKey && draggedKey !== targetKey) {
          const keys = Object.keys(categories);
          const draggedIdx = keys.indexOf(draggedKey);
          const targetIdx = keys.indexOf(targetKey);
          if (draggedIdx !== -1 && targetIdx !== -1) {
            // Remove dragged key and insert at target index
            keys.splice(draggedIdx, 1);
            keys.splice(targetIdx, 0, draggedKey);
            
            // Rebuild categories
            const newCategories = {};
            keys.forEach(k => {
              newCategories[k] = categories[k];
            });
            categories = newCategories;
            
            saveState();
            renderAll();
            playSound('success');
            showToast(`REORDERED CATEGORY "${categories[draggedKey].replace(/\/$/, '')}"`);
          }
        }
      } else {
        const draggedBookmarkId = e.dataTransfer.getData('text/plain');
        const targetCat = card.getAttribute('data-cat');
        const draggedIdx = bookmarks.findIndex(x => x.id === draggedBookmarkId);
        if (draggedIdx !== -1) {
          const b = bookmarks[draggedIdx];
          const oldCat = b.category;
          
          // Remove from old position and push to the end of the array
          bookmarks.splice(draggedIdx, 1);
          b.category = targetCat;
          bookmarks.push(b);
          
          saveState();
          renderAll();
          playSound('success');
          
          if (oldCat !== targetCat) {
            const newCatName = categories[targetCat] || targetCat;
            showToast(`Moved "${b.title}" to "${newCatName}"`);
          } else {
            showToast(`Moved "${b.title}" to end`);
          }
        }
      }
    });
    
    categoriesBoard.appendChild(card);
  });
}

function syncCategoryDropdown() {
  const select = document.getElementById('bookmark-category');
  const editSelect = document.getElementById('edit-bookmark-category');
  if (!select) return;
  select.innerHTML = '';
  if (editSelect) editSelect.innerHTML = '';
  
  Object.keys(categories).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = categories[key];
    select.appendChild(opt);
    
    if (editSelect) {
      const optEdit = opt.cloneNode(true);
      editSelect.appendChild(optEdit);
    }
  });
}

// ── Cloud Sync Management & Security ──────────────────────────────────────────
function updateSyncUI() {
  if (syncKey) {
    if (btnSyncTrigger) {
      btnSyncTrigger.textContent = '[☁️ SYNC: ACTIVE]';
      btnSyncTrigger.classList.add('is-synced');
    }
    if (syncStatusBox) {
      syncStatusBox.classList.add('is-synced');
    }
    if (syncStatusLabel) {
      syncStatusLabel.textContent = 'Status: Cloud Synced (Private Key Active)';
    }
    if (syncActiveKey) {
      syncActiveKey.value = syncKey;
    }
    if (btnCopySyncKey) {
      btnCopySyncKey.style.display = 'inline-block';
    }
    if (btnDisconnectSync) {
      btnDisconnectSync.style.display = 'block';
    }
  } else {
    if (btnSyncTrigger) {
      btnSyncTrigger.textContent = '[☁️ SYNC: LOCAL]';
      btnSyncTrigger.classList.remove('is-synced');
    }
    if (syncStatusBox) {
      syncStatusBox.classList.remove('is-synced');
    }
    if (syncStatusLabel) {
      syncStatusLabel.textContent = 'Status: Local Storage Only (Offline / Guest)';
    }
    if (syncActiveKey) {
      syncActiveKey.value = '';
    }
    if (btnCopySyncKey) {
      btnCopySyncKey.style.display = 'none';
    }
    if (btnDisconnectSync) {
      btnDisconnectSync.style.display = 'none';
    }
  }
  renderMarquee();
}

async function handleGenerateNewSyncKey() {
  playSound('success');
  const newKey = generateSecureKey();
  syncKey = newKey;
  localStorage.setItem('zenmark_sync_key', syncKey);
  updateSyncUI();
  
  // Instantly upload current bookmarks to the new cloud vault
  showToast('⚡ Uploading your links to new private vault...', 2500);
  await syncToCloud();
  
  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(newKey);
    showToast('🔑 New Sync Key created & copied to clipboard!', 4000);
  } catch {
    showToast('🔑 New Sync Key created: ' + newKey, 4000);
  }
}

async function handleConnectSyncKey() {
  const enteredKey = syncInputKey ? syncInputKey.value.trim() : '';
  if (!enteredKey) {
    showToast('❌ Please enter a sync key.', 2500);
    return;
  }
  if (!validateSyncKey(enteredKey)) {
    showToast('❌ Invalid format. Key must be 8-64 alphanumeric characters.', 3000);
    return;
  }
  
  playSound('click');
  syncKey = enteredKey;
  localStorage.setItem('zenmark_sync_key', syncKey);
  if (syncInputKey) syncInputKey.value = '';
  updateSyncUI();
  
  showToast('🔄 Connecting and syncing bookmarks from cloud...', 2500);
  await syncFromCloud();
  showToast(' Cloud Sync Connected Successfully!', 3000);
}

async function handleCopySyncKey() {
  if (!syncKey) return;
  try {
    await navigator.clipboard.writeText(syncKey);
    playSound('copy');
    showToast('📋 Sync Key copied to clipboard!', 2500);
  } catch {
    showToast('📋 Key: ' + syncKey, 4000);
  }
}

function handleDisconnectSync() {
  playSound('click');
  syncKey = '';
  localStorage.removeItem('zenmark_sync_key');
  updateSyncUI();
  showToast(' Cloud sync disconnected. Using Local-Only mode.', 3000);
}

// Logic Events
function saveState() {
  // Ensure explicit ordering field is updated before saving
  bookmarks.forEach((b, index) => {
    b.sortIndex = index;
  });
  
  localStorage.setItem('zenmark_bookmarks_v4', JSON.stringify(bookmarks));
  localStorage.setItem('zenmark_categories_v4', JSON.stringify(categories));
  
  syncToCloud();
}

async function syncToCloud() {
  if (!syncKey) {
    // Local-only / Guest mode: bookmarks remain safely in browser localStorage
    return;
  }
  try {
    const payload = { bookmarks, categories };
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-key': syncKey
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync data to cloud database.');
    }
  } catch (err) {
    console.error('[Sync] Error syncing to cloud:', err);
  }
}

async function syncFromCloud() {
  if (!syncKey) {
    document.body.inert = false;
    document.body.classList.remove('is-syncing');
    updateSyncUI();
    return;
  }
  try {
    const res = await fetch('/api/bookmarks', {
      headers: {
        'x-sync-key': syncKey
      }
    });
    if (res.ok) {
      const data = await res.json();
      
      if (data && data.bookmarks && data.categories) {
        const validation = validateSyncPayload(data);
        if (!validation.valid) {
          console.warn('[Sync] Received invalid data schema from cloud:', validation.error);
          return;
        }

        let newBookmarks = (data.bookmarks || [])
          .filter(b => b && typeof b === 'object' && typeof b.url === 'string')
          .map((b, index) => ({
            ...b,
            url: sanitizeUrl(b.url),
            title: typeof b.title === 'string' ? formatBookmarkTitle(b.title) : '',
            sortIndex: typeof b.sortIndex === 'number' ? b.sortIndex : index
          }));
        newBookmarks.sort((a, b) => a.sortIndex - b.sortIndex);
        
        const cleanCategories = {};
        for (const [k, v] of Object.entries(data.categories)) {
          if (!FORBIDDEN_OBJECT_KEYS.includes(k.toLowerCase()) && typeof v === 'string') {
            cleanCategories[k] = stripTags(v).slice(0, 50);
          }
        }

        const currentBookmarksStr = JSON.stringify(bookmarks);
        const newBookmarksStr = JSON.stringify(newBookmarks);
        const currentCategoriesStr = JSON.stringify(categories);
        const newCategoriesStr = JSON.stringify(cleanCategories);

        if (currentBookmarksStr === newBookmarksStr && currentCategoriesStr === newCategoriesStr) {
          console.log('[Sync] Data is identical, skipping re-render.');
          return;
        }

        bookmarks = newBookmarks;
        categories = cleanCategories;
        
        localStorage.setItem('zenmark_bookmarks_v4', JSON.stringify(bookmarks));
        localStorage.setItem('zenmark_categories_v4', JSON.stringify(categories));
        renderAll();
        console.log('[Sync] Successfully synchronized data from cloud database.');
      } else {
        // Cloud is empty for this key. Initialize cloud database with current local data so nothing is lost.
        const hasLocalStorage = localStorage.getItem('zenmark_bookmarks_v4') !== null;
        if (hasLocalStorage) {
          console.log('[Sync] Cloud is empty for this key. Initializing cloud vault with current local data...');
          await syncToCloud();
        } else {
          console.log('[Sync] Cloud is empty for this key, and local storage is empty.');
        }
      }
    } else if (res.status === 401 || res.status === 400) {
      console.warn('[Sync] Unauthorized or invalid sync key.');
    }
  } catch (err) {
    console.error('[Sync] Error syncing from cloud:', err);
  } finally {
    document.body.inert = false;
    document.body.classList.remove('is-syncing');
    updateSyncUI();
  }
}

function openEditCategoryModal(catKey) {
  const catName = categories[catKey];
  if (!catName) return;
  modalOpenTimes.editCat = Date.now();
  document.getElementById('edit-category-key').value = catKey;
  const cleanName = catName.endsWith('/') ? catName.slice(0, -1) : catName;
  document.getElementById('edit-category-name').value = cleanName;
  
  editCatDialog.showModal();
}

function handleEditCategorySubmit(e) {
  e.preventDefault();
  // Honeypot check
  const botcheck = editCatForm.querySelector('[name="botcheck"]')?.checked;
  const gotcha = editCatForm.querySelector('[name="_gotcha"]')?.value;
  if (botcheck || (gotcha && gotcha.trim().length > 0)) {
    editCatDialog.close();
    return;
  }
  // Speed-trap check
  if (Date.now() - modalOpenTimes.editCat < 1800) {
    showToast('⚠️ Too fast! Verification failed.', true);
    return;
  }
  const catKey = document.getElementById('edit-category-key').value;
  let newName = document.getElementById('edit-category-name').value.trim();
  
  if (!newName) return;
  if (FORBIDDEN_OBJECT_KEYS.includes(catKey.toLowerCase()) || FORBIDDEN_OBJECT_KEYS.includes(newName.toLowerCase())) {
    showToast('❌ Forbidden category name.', true);
    return;
  }
  
  newName = formatCategoryName(newName);
  
  if (categories[catKey]) {
    categories[catKey] = newName;
    saveState();
    renderAll();
    playSound('success');
    editCatDialog.close();
    showToast(`Renamed category to "${newName}"`);
  }
}

function openAddCategoryModal() {
  addCatForm.reset();
  modalOpenTimes.addCat = Date.now();
  addCatDialog.showModal();
}

function handleAddCategorySubmit(e) {
  e.preventDefault();
  // Honeypot check
  const botcheck = addCatForm.querySelector('[name="botcheck"]')?.checked;
  const gotcha = addCatForm.querySelector('[name="_gotcha"]')?.value;
  if (botcheck || (gotcha && gotcha.trim().length > 0)) {
    addCatDialog.close();
    return;
  }
  // Speed-trap check
  if (Date.now() - modalOpenTimes.addCat < 1800) {
    showToast('⚠️ Too fast! Verification failed.', true);
    return;
  }
  let name = document.getElementById('add-category-name').value.trim();
  if (!name) return;

  if (FORBIDDEN_OBJECT_KEYS.includes(name.toLowerCase())) {
    showToast('❌ Forbidden category name.', true);
    return;
  }

  name = formatCategoryName(name);

  const newKey = 'custom_' + Date.now();
  categories[newKey] = name;
  
  saveState();
  renderAll();
  playSound('success');
  addCatDialog.close();
  showToast(`Created category "${name}"`);
}

function openAddModal(preSelectedCat = '') {
  addForm.reset();
  modalOpenTimes.add = Date.now();
  if (preSelectedCat) {
    document.getElementById('bookmark-category').value = preSelectedCat;
  }
  addDialog.showModal();
}

function openEditModal(id) {
  const b = bookmarks.find(x => x.id === id);
  if (!b) return;
  modalOpenTimes.edit = Date.now();
  editBookmarkId.value = b.id;
  editBookmarkUrl.value = b.url;
  editBookmarkTitle.value = b.title;
  editBookmarkCategory.value = b.category;
  
  editDialog.showModal();
}

function handleEditBookmarkSubmit(e) {
  e.preventDefault();
  // Honeypot check
  const botcheck = editForm.querySelector('[name="botcheck"]')?.checked;
  const gotcha = editForm.querySelector('[name="_gotcha"]')?.value;
  if (botcheck || (gotcha && gotcha.trim().length > 0)) {
    editDialog.close();
    return;
  }
  // Speed-trap check
  if (Date.now() - modalOpenTimes.edit < 1800) {
    showToast('⚠️ Too fast! Verification failed.', true);
    return;
  }
  const id = editBookmarkId.value;
  let url = editBookmarkUrl.value.trim().slice(0, 2048);
  let title = editBookmarkTitle.value.trim();
  let category = editBookmarkCategory.value;
  
  if (!url) return;
  
  if (/^(javascript|data|vbscript|blob|file):/i.test(url)) {
    showToast('❌ Dangerous URL scheme is not allowed.', 3000);
    return;
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) {
    if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
      url = 'http://' + url;
    } else {
      url = 'https://' + url;
    }
  }

  if (!isSafeUrl(url)) {
    showToast('❌ Invalid URL format.', 3000);
    return;
  }
  
  if (!title) {
    try {
      const hostname = new URL(url).hostname;
      title = hostname.replace('www.', '');
    } catch {
      title = url;
    }
  }
  
  title = formatBookmarkTitle(title);
  
  const b = bookmarks.find(x => x.id === id);
  if (b) {
    b.url = sanitizeUrl(url);
    b.title = title;
    b.category = category;
    
    saveState();
    renderAll();
    playSound('success');
    editDialog.close();
    showToast(`Updated link "${title}"`);
  }
}

function handleAddBookmarkSubmit(e) {
  e.preventDefault();
  // Honeypot check
  const botcheck = addForm.querySelector('[name="botcheck"]')?.checked;
  const gotcha = addForm.querySelector('[name="_gotcha"]')?.value;
  if (botcheck || (gotcha && gotcha.trim().length > 0)) {
    addDialog.close();
    return;
  }
  // Speed-trap check
  if (Date.now() - modalOpenTimes.add < 1800) {
    showToast('⚠️ Too fast! Verification failed.', true);
    return;
  }
  let url = document.getElementById('bookmark-url').value.trim().slice(0, 2048);
  let title = document.getElementById('bookmark-title').value.trim();
  let category = document.getElementById('bookmark-category').value;
  
  if (!url) return;
  
  if (/^(javascript|data|vbscript|blob|file):/i.test(url)) {
    showToast('❌ Dangerous URL scheme is not allowed.', 3000);
    return;
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) {
    if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
      url = 'http://' + url;
    } else {
      url = 'https://' + url;
    }
  }

  if (!isSafeUrl(url)) {
    showToast('❌ Invalid URL format.', 3000);
    return;
  }
  
  if (!title) {
    try {
      const hostname = new URL(url).hostname;
      title = hostname.replace('www.', '');
    } catch {
      title = url;
    }
  }
  
  title = formatBookmarkTitle(title);
  
  const newBookmark = {
    id: Date.now().toString(),
    title,
    url: sanitizeUrl(url),
    category,
    pinned: false,
    sortIndex: bookmarks.length
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

function deleteCategory(catKey) {
  if (Object.keys(categories).length <= 1) {
    showToast('Cannot delete the final category!', true);
    return;
  }
  
  const catName = categories[catKey] || catKey;
  // Remove bookmarks belonging to this category
  bookmarks = bookmarks.filter(b => b.category !== catKey);
  // Remove category from state
  delete categories[catKey];
  
  saveState();
  renderAll();
  playSound('click');
  showToast(`Deleted category "${catName}"`);
}

function togglePin(id) {
  const b = bookmarks.find(x => x.id === id);
  if (!b) return;
  
  if (!b.pinned) {
    const currentPinned = bookmarks.filter(x => x.pinned).length;
    if (currentPinned >= 10) {
      showToast(`Limit of 10 pinned bookmarks reached!`, true);
      return;
    }
  }
  
  b.pinned = !b.pinned;
  saveState();
  renderAll();
  playSound('star');
}

function copyLink(url, btnEl, tooltipEl) {
  if (btnEl.dataset.isCopying) return;
  btnEl.dataset.isCopying = "true";

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
      delete btnEl.dataset.isCopying;
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
  ).sort((a, b) => a.sortIndex - b.sortIndex);
  
  if (filteredSearchResults.length === 0) {
    searchResultsContainer.innerHTML = `<div class="search-no-results">> NO MATCHES FOUND</div>`;
    return;
  }
  
  filteredSearchResults.forEach(result => {
    const safeUrl = sanitizeUrl(result.url);
    const item = document.createElement('a');
    item.href = safeUrl;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.className = 'search-result-item';
    item.setAttribute('data-id', result.id);
    
    item.innerHTML = `
      <div class="search-result-info">
        <span class="search-result-title">${escapeHTML(result.title)}</span>
        <span class="search-result-url">${escapeHTML(result.url)}</span>
      </div>
      <div class="search-result-actions">
        <span class="search-result-category">${escapeHTML(categories[result.category] || result.category || 'General/')}</span>
        <button class="btn-search-copy" title="Copy URL" data-url="${escapeHTML(safeUrl)}">[COPY]</button>
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
    searchSelectedIndex = searchSelectedIndex === -1 ? items.length - 1 : (searchSelectedIndex - 1 + items.length) % items.length;
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

  if (e.key === '/') {
    e.preventDefault();
    openSearchModal();
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
    <span>> ${escapeHTML(stripTags(message).toUpperCase())}</span>
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
  "localstorage database: synced",
  "press '/' key for search hub",
  "scanline display frequency: 60hz",
  "welcome abhishek @localhost"
];
let currentLogIndex = 0;

function rotateMarqueeLogs() {
  const marqueeText = document.getElementById('marquee-text');
  if (!marqueeText) return;
  
  setInterval(() => {
    currentLogIndex = (currentLogIndex + 1) % sysLogs.length;
    const msg = `» ${sysLogs[currentLogIndex].toUpperCase()} • ${bookmarks.length} BOOKMARKS LOADED • STATUS: SYNCED • WELCOME BACK ABHISHEK «`;
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

// Auto-reload PWA on new deployments when running in standalone or browser mode
(function initPwaAutoUpdate() {
  if (typeof window === 'undefined') return;
  let initialETag = null;

  const checkAppVersion = async () => {
    try {
      const res = await fetch(`/?_v=${Date.now()}`, { cache: 'no-store', method: 'HEAD' });
      const etag = res.headers.get('etag') || res.headers.get('last-modified');
      if (etag) {
        if (initialETag && initialETag !== etag) {
          const isDialogOpen = document.querySelector('dialog[open]');
          if (!isDialogOpen) {
            console.log('[PWA Auto-Update] New version detected! Auto-reloading web app...');
            window.location.reload();
          } else {
            console.log('[PWA Auto-Update] New version detected, but user is interacting with a dialog. Deferring reload.');
          }
        } else {
          initialETag = etag;
        }
      }
    } catch (err) {
      void err;
    }
  };

  checkAppVersion();
  setInterval(() => {
    if (!document.hidden) checkAppVersion();
  }, 30000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkAppVersion();
  });
})();

// Kickoff
window.addEventListener('DOMContentLoaded', init);
