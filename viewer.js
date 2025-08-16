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

