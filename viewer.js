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
