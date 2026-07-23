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

const retroColorPool = [
  'var(--green)', // #39ff14 Neon Green
  'var(--pink)',  // #ff0080 Neon Pink
  'var(--amber)', // #ffb000 Neon Amber
  'var(--cyan)',  // #23d5e0 Neon Cyan
  '#c084fc',      // Neon Purple
  '#f97316',      // Neon Orange
  '#94a3b8',      // Retro Silver/Slate
  '#3b82f6',      // Classic Tech Blue
  '#f43f5e',      // Cyberpunk Rose Red
  '#84cc16',      // Neon Lime
  '#0d9488',      // Cyberpunk Teal
  '#d946ef'       // Vivid Magenta
];

function getCategoryColor(catKey) {
  const keys = Object.keys(categories);
  const index = keys.indexOf(catKey);
  if (index !== -1) {
    return retroColorPool[index % retroColorPool.length];
  }
  return 'var(--green)';
}

// Application State
let bookmarks = JSON.parse(localStorage.getItem('zenmark_bookmarks_v4')) || defaultBookmarks;
let categories = JSON.parse(localStorage.getItem('zenmark_categories_v4')) || defaultCategories;
categories = { ...defaultCategories, ...categories };
let searchSelectedIndex = -1;
let filteredSearchResults = [];
let isSyncedFromCloud = false;

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

// Event Listeners Initialization
// Event Listeners Initialization
function init() {
  renderAll();
  rotateMarqueeLogs();
  
  // Sync bookmarks and categories with Upstash Redis
  syncFromCloud();

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
    textEl.textContent = `» jugaad mode: on • ${bookmarks.length} bookmarks loaded • status: synced • welcome back abhishek «`;
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
  
  // Starred cards capped at 10
  pinnedList.slice(0, 10).forEach(bookmark => {
    const glyph = getGlyphForDomain(bookmark.url);
    const sticker = document.createElement('a');
    sticker.href = bookmark.url;
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
    } catch (e) {}
    
    const iconUrl = host ? `https://www.google.com/s2/favicons?sz=64&domain=${host}` : '';
    
    sticker.innerHTML = `
      <span class="pin-badge">★</span>
      <div class="glyph">
        ${iconUrl ? `
          <img class="domain-icon" src="${iconUrl}" alt="" onerror="window.handleFaviconError(this, '${host}', '${origin}')">
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
    const cardColor = getCategoryColor(catKey);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-color', cardColor);
    card.setAttribute('data-cat', catKey);
    
    const titleValue = catName.endsWith('/') ? catName : `${catName}/`;
    
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
        } catch (e) {}
        const iconUrl = host ? `https://www.google.com/s2/favicons?sz=64&domain=${host}` : '';
        
        const glyph = getGlyphForDomain(bookmark.url);
        chipWrap.innerHTML = `
          <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="chip ${bookmark.pinned ? 'starred' : ''}" title="${bookmark.url}">
            ${iconUrl ? `
              <img class="chip-icon" src="${iconUrl}" alt="" onerror="window.handleFaviconError(this, '${host}', '${origin}')">
              <span class="domain-icon-fallback" style="display:none; font-size:10px;">${glyph}</span>
            ` : `<span style="font-size:10px;">${glyph}</span>`}
            <span>${bookmark.title}</span>
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
                
                const oldCatName = categories[oldCat] || oldCat;
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
    card.querySelector('.btn-card-add').addEventListener('click', (e) => {
      openAddModal(catKey);
    });
    
    // Bind Card Rename [✎]
    card.querySelector('.btn-card-edit-cat').addEventListener('click', (e) => {
      openEditCategoryModal(catKey);
    });
    
    // Bind Card Delete [✖]
    card.querySelector('.btn-card-delete').addEventListener('click', (e) => {
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

// Logic Events
function saveState() {
  isSyncedFromCloud = true; // Protect local modifications from being overwritten by startup load
  localStorage.setItem('zenmark_bookmarks_v4', JSON.stringify(bookmarks));
  localStorage.setItem('zenmark_categories_v4', JSON.stringify(categories));
  syncToCloud();
}

async function syncToCloud() {
  try {
    const payload = { bookmarks, categories };
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn('[Sync] Failed to sync data to Vercel KV database.');
    }
  } catch (err) {
    console.error('[Sync] Error syncing to cloud:', err);
  }
}

async function syncFromCloud() {
  try {
    const res = await fetch('/api/bookmarks');
    if (res.ok) {
      const data = await res.json();
      
      // If user has already made local modifications, skip overwriting
      if (isSyncedFromCloud) {
        console.log('[Sync] Cloud sync returned but local modifications already occurred. Skipping overwrite.');
        return;
      }
      
      if (data && data.bookmarks && data.categories) {
        bookmarks = data.bookmarks;
        categories = data.categories;
        localStorage.setItem('zenmark_bookmarks_v4', JSON.stringify(bookmarks));
        localStorage.setItem('zenmark_categories_v4', JSON.stringify(categories));
        renderAll();
        isSyncedFromCloud = true;
        console.log('[Sync] Successfully synchronized data from Vercel KV database.');
      } else {
        // Cloud is empty. Only initialize/upload if this client actually has existing local storage data.
        const hasLocalStorage = localStorage.getItem('zenmark_bookmarks_v4') !== null;
        if (hasLocalStorage) {
          console.log('[Sync] Cloud is empty. Initializing cloud database with local data...');
          await syncToCloud();
        } else {
          console.log('[Sync] Cloud is empty, and local storage is empty. Waiting for data.');
        }
        isSyncedFromCloud = true;
      }
    }
  } catch (err) {
    console.error('[Sync] Error syncing from cloud:', err);
  }
}

function openEditCategoryModal(catKey) {
  const catName = categories[catKey];
  if (!catName) return;
  
  document.getElementById('edit-category-key').value = catKey;
  const cleanName = catName.endsWith('/') ? catName.slice(0, -1) : catName;
  document.getElementById('edit-category-name').value = cleanName;
  
  editCatDialog.showModal();
}

function formatCategoryName(name) {
  if (!name) return '';
  // Trim and remove trailing slashes/whitespace
  let cleanName = name.trim().replace(/\/+$/, '').trim();
  
  // Capitalize first letter of each word (word boundaries separated by spaces, dashes, etc.)
  cleanName = cleanName.replace(/\b\w+\b/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return cleanName + '/';
}

function handleEditCategorySubmit(e) {
  e.preventDefault();
  const catKey = document.getElementById('edit-category-key').value;
  let newName = document.getElementById('edit-category-name').value.trim();
  
  if (!newName) return;
  
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
  addCatDialog.showModal();
}

function handleAddCategorySubmit(e) {
  e.preventDefault();
  let name = document.getElementById('add-category-name').value.trim();
  if (!name) return;

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
  if (preSelectedCat) {
    document.getElementById('bookmark-category').value = preSelectedCat;
  }
  addDialog.showModal();
}

function openEditModal(id) {
  const b = bookmarks.find(x => x.id === id);
  if (!b) return;
  
  editBookmarkId.value = b.id;
  editBookmarkUrl.value = b.url;
  editBookmarkTitle.value = b.title;
  editBookmarkCategory.value = b.category;
  
  editDialog.showModal();
}

function formatBookmarkTitle(title) {
  if (!title) return '';
  return title.trim().replace(/\b\w+\b/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function handleEditBookmarkSubmit(e) {
  e.preventDefault();
  const id = editBookmarkId.value;
  let url = editBookmarkUrl.value.trim();
  let title = editBookmarkTitle.value.trim();
  let category = editBookmarkCategory.value;
  
  if (!url) return;
  
  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
      url = 'http://' + url;
    } else {
      url = 'https://' + url;
    }
  }
  
  if (!title) {
    try {
      const hostname = new URL(url).hostname;
      title = hostname.replace('www.', '');
    } catch (e) {
      title = url;
    }
  }
  
  title = formatBookmarkTitle(title);
  
  const b = bookmarks.find(x => x.id === id);
  if (b) {
    b.url = url;
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
  let url = document.getElementById('bookmark-url').value.trim();
  let title = document.getElementById('bookmark-title').value.trim();
  let category = document.getElementById('bookmark-category').value;
  
  if (!url) return;
  
  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
      url = 'http://' + url;
    } else {
      url = 'https://' + url;
    }
  }
  
  if (!title) {
    try {
      const hostname = new URL(url).hostname;
      title = hostname.replace('www.', '');
    } catch (e) {
      title = url;
    }
  }
  
  title = formatBookmarkTitle(title);
  
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

function deleteCategory(catKey) {
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
    if (host.includes('my-portfolio') || host.includes('portfolio')) return '>_';
    if (host.includes('study-os') || host.includes('studyos') || host.includes('mystudy')) return '>_';
    if (host.includes('skillsdirectory') || host.includes('skills')) return '⌘';
    if (host.includes('free-for')) return '🆓';
    if (host.includes('book-vault') || host.includes('bookvault')) return '🔒';
    if (host.includes('fitarena')) return '⚡';
    if (host.includes('college')) return '🎓';
    if (host.includes('traffic')) return '🚥';
    if (host.includes('ev-route') || host.includes('evroute')) return '⚡';
    if (host.includes('cursor')) return '⌖';
    if (host.includes('sudoku')) return '🧩';
    if (host.includes('ice') || host.includes('water')) return '🧊';
    if (host.includes('windows')) return '❖';
    
    // Extract first letter of domain clean name
    const parts = host.replace(/^www\./, '').split('.');
    const mainName = parts[0] || '';
    return mainName ? mainName.charAt(0).toUpperCase() : '✦';
  } catch (e) {
    return '✦';
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

// Kickoff
window.addEventListener('DOMContentLoaded', init);
