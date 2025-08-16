const url = 'assets/sample-1.pdf';
let pdfDoc = null,
    pageNum = 1,
    scale = 1,
    canvas = document.getElementById('pdfCanvas'),
    ctx = canvas.getContext('2d');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';

pdfjsLib.getDocument(url).promise.then(doc => {
  pdfDoc = doc;
  document.getElementById('pageCount').textContent = doc.numPages;
  renderPage(pageNum);
});

function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    page.render({ canvasContext: ctx, viewport });
    document.getElementById('pageNum').textContent = num;
  });
}

document.getElementById('prevPage').onclick = () => {
  if (pageNum <= 1) return;
  pageNum--;
  renderPage(pageNum);
};

document.getElementById('nextPage').onclick = () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  renderPage(pageNum);
};

document.getElementById('zoomSlider').oninput = (e) => {
  scale = parseFloat(e.target.value);
  renderPage(pageNum);
};

document.getElementById('jumpBtn').onclick = () => {
  const target = parseInt(document.getElementById('jumpInput').value);
  if (target >= 1 && target <= pdfDoc.numPages) {
    pageNum = target;
    renderPage(pageNum);
  }
};

document.getElementById('zoomPreset').onchange = (e) => {
  scale = parseFloat(e.target.value);
  renderPage(pageNum);
};
document.getElementById('fitWidth').onclick = () => {
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = canvas.parentElement.offsetWidth;
    scale = containerWidth / viewport.width;
    renderPage(pageNum);
  });
};

let rotation = 0;
document.getElementById('rotatePage').onclick = () => {
  rotation = (rotation + 90) % 360;
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale, rotation });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: ctx, viewport });
  });
};

document.getElementById('themePreset').onchange = (e) => {
  document.body.className = e.target.value;
};
window.addEventListener('beforeunload', () => {
  localStorage.setItem('lastPage', pageNum);
});

window.addEventListener('load', () => {
  const saved = parseInt(localStorage.getItem('lastPage'));
  if (saved && saved <= pdfDoc?.numPages) {
    pageNum = saved;
    renderPage(pageNum);
  }
});

const drawCanvas = document.getElementById('drawCanvas');
drawCanvas.width = canvas.width;
drawCanvas.height = canvas.height;
const drawCtx = drawCanvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => { drawing = true; });
canvas.addEventListener('mouseup', () => { drawing = false; });
canvas.addEventListener('mousemove', e => {
  if (!drawing) return;
  drawCtx.fillStyle = 'red';
  drawCtx.beginPath();
  drawCtx.arc(e.offsetX, e.offsetY, 2, 0, Math.PI * 2);
  drawCtx.fill();
});

window.addEventListener('beforeunload', () => {
  localStorage.setItem('autoBookmark', pageNum);
});

window.addEventListener('load', () => {
  const saved = parseInt(localStorage.getItem('autoBookmark'));
  if (saved && saved <= pdfDoc?.numPages) {
    pageNum = saved;
    renderPage(pageNum);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') document.getElementById('nextPage').click();
  if (e.key === 'ArrowLeft') document.getElementById('prevPage').click();
  if (e.key === '+') scale += 0.1;
  if (e.key === '-') scale -= 0.1;
  renderPage(pageNum);
});

document.getElementById('dropZone').addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = () => {
      const typedArray = new Uint8Array(reader.result);
      pdfjsLib.getDocument(typedArray).promise.then(doc => {
        pdfDoc = doc;
        pageNum = 1;
        renderPage(pageNum);
      });
    };
    reader.readAsArrayBuffer(file);
  }
});

document.getElementById('dropZone').addEventListener('dragover', e => e.preventDefault());

document.getElementById('addNote').onclick = () => {
  const note = prompt("Enter your note for page " + pageNum);
  if (note) {
    const notes = JSON.parse(localStorage.getItem('pdfNotes') || '{}');
    notes[pageNum] = notes[pageNum] || [];
    notes[pageNum].push(note);
    localStorage.setItem('pdfNotes', JSON.stringify(notes));
    updateNotesUI();
  }
};

function updateNotesUI() {
  const notes = JSON.parse(localStorage.getItem('pdfNotes') || '{}');
  const panel = document.getElementById('notesPanel');
  panel.innerHTML = (notes[pageNum] || []).map(n => `<div>📝 ${n}</div>`).join('');
}

updateNotesUI();

function renderDualPage(num) {
  renderPage(num);
  if (num + 1 <= pdfDoc.numPages) {
    pdfDoc.getPage(num + 1).then(page => {
      const viewport = page.getViewport({ scale });
      const canvas2 = document.getElementById('pdfCanvas2');
      canvas2.height = viewport.height;
      canvas2.width = viewport.width;
      page.render({ canvasContext: canvas2.getContext('2d'), viewport });
    });
  }
}

document.getElementById('readPage').onclick = () => {
  pdfDoc.getPage(pageNum).then(page => {
    page.getTextContent().then(text => {
      const content = text.items.map(i => i.str).join(' ');
      const utterance = new SpeechSynthesisUtterance(content);
      speechSynthesis.speak(utterance);
    });
  });
};

const plugins = ['bookmarks', 'darkmode', 'gestures', 'annotations', 'notes'];
plugins.forEach(p => {
  const script = document.createElement('script');
  script.src = `plugins/${p}.js`;
  document.body.appendChild(script);
});

function updateFloatingPageNum() {
  document.getElementById('floatingPageNum').textContent = `Page ${pageNum}`;
}
setInterval(updateFloatingPageNum, 500);

let history = [], future = [];

function renderPageWithHistory(num) {
  history.push(pageNum);
  pageNum = num;
  renderPage(pageNum);
}

document.getElementById('prevPage').onclick = () => {
  if (pageNum <= 1) return;
  renderPageWithHistory(pageNum - 1);
};

document.getElementById('nextPage').onclick = () => {
  if (pageNum >= pdfDoc.numPages) return;
  renderPageWithHistory(pageNum + 1);
};

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z' && history.length) {
    future.push(pageNum);
    pageNum = history.pop();
    renderPage(pageNum);
  }
  if (e.ctrlKey && e.key === 'y' && future.length) {
    history.push(pageNum);
    pageNum = future.pop();
    renderPage(pageNum);
  }
});
function updatePageOverlay() {
  document.getElementById('pageOverlay').textContent = `Viewing page ${pageNum} of ${pdfDoc.numPages}`;
}
setInterval(updatePageOverlay, 1000);

document.getElementById('toggleSettings').onclick = () => {
  document.getElementById('settingsPanel').classList.toggle('hidden');
};

let mouseStartX = 0;
canvas.addEventListener('mousedown', e => mouseStartX = e.clientX);
canvas.addEventListener('mouseup', e => {
  const delta = e.clientX - mouseStartX;
  if (delta > 50) document.getElementById('prevPage').click();
  else if (delta < -50) document.getElementById('nextPage').click();
});

const docKey = `progress_${url}`;
window.addEventListener('beforeunload', () => {
  localStorage.setItem(docKey, pageNum);
});

window.addEventListener('load', () => {
  const saved = parseInt(localStorage.getItem(docKey));
  if (saved && saved <= pdfDoc?.numPages) {
    pageNum = saved;
    renderPage(pageNum);
  }
});

