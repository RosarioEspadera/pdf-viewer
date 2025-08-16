const bookmarks = JSON.parse(localStorage.getItem('pdfBookmarks') || '[]');
const panel = document.getElementById('bookmarksPanel');

function updateBookmarksUI() {
  panel.innerHTML = bookmarks.map(p => `<div onclick="goToPage(${p})">🔖 Page ${p}</div>`).join('');
}

function goToPage(p) {
  pageNum = p;
  renderPage(pageNum);
}

document.getElementById('bookmarkPage').onclick = () => {
  if (!bookmarks.includes(pageNum)) {
    bookmarks.push(pageNum);
    localStorage.setItem('pdfBookmarks', JSON.stringify(bookmarks));
    updateBookmarksUI();
    panel.classList.remove('hidden');
  }
};

updateBookmarksUI();
