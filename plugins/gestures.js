document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("pdf-canvas");
  if (canvas) {
    // your gesture setup here
let startX = 0;
canvas.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

canvas.addEventListener('touchend', e => {
  let endX = e.changedTouches[0].clientX;
  if (endX - startX > 50) document.getElementById('prevPage').click();
  else if (startX - endX > 50) document.getElementById('nextPage').click();
});
} else {
    console.warn("Canvas element not found");
  }
});