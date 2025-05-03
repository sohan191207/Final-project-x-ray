const img = document.getElementById('xrayImage');
const container = document.getElementById('imageContainer');

let scale = 1;
let originX = 0;
let originY = 0;
let isDragging = false;
let startX, startY;

container.addEventListener('wheel', function (e) {
  e.preventDefault();
  const scaleAmount = 0.1;
  scale += e.deltaY < 0 ? scaleAmount : -scaleAmount;
  scale = Math.min(Math.max(1, scale), 3);
  updateTransform();
});

container.addEventListener('mousedown', function (e) {
  if (scale <= 1) return;
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  container.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', function () {
  isDragging = false;
  container.style.cursor = 'grab';
});

window.addEventListener('mousemove', function (e) {
  if (!isDragging) return;
  const dx = (e.clientX - startX) / scale;
  const dy = (e.clientY - startY) / scale;
  originX += dx;
  originY += dy;
  startX = e.clientX;
  startY = e.clientY;
  updateTransform();
});

function updateTransform() {
  img.style.transform = `translate(-50%, -50%) scale(${scale}) translate(${originX}px, ${originY}px)`;
}



