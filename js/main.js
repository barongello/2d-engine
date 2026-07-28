const canvas = document.getElementById('canvas');
const animationSpeed = document.getElementById('animation-speed');
const animationSpeedValue = document.getElementById('animation-speed-value');

const ctx = new Context(canvas, 720, 405);

const vector1 = Matrix.newFromArray([[50], [100], [1]]);

const square1 = new Square(0, 0, 50, 50, '#ffffff', '#ff0000');
const square2 = new Square(0, 0, 50, 50, '#ffffff', '#0000ff');
const square3 = new Square(200, 100, 15, 15, '#ffffff', '#ffff00');
const square4 = new Square(200, 100, 10, 10, '#ffffff', '#ff00ff');

square2.setOffset(100, 100);
square4.setOffset(35, 35);

let speedMultiplier = 1;
let lastTime = 0;
let angle = 0;

function drawFrame(dt = 0) {
  dt *= speedMultiplier;

  ctx.clearBackground();
  ctx.drawGrid();

  square1.draw(ctx);
  square2.draw(ctx);
  square3.draw(ctx);
  square4.draw(ctx);

  ctx.drawVector(vector1);

  square1.setRotation(square1.rotation() + dt * -0.025);
  square2.setRotation(square2.rotation() + dt * 0.035);
  square3.setRotation(square3.rotation() + dt * 0.05);
  square4.setRotation(square4.rotation() + dt * -0.075);

  square2.setOffset(
    square2.offset().x + Math.sin(angle),
    square2.offset().y
  );

  square4.setOffset(
    square4.offset().x + Math.sin(-angle) * 0.5,
    square4.offset().y
  );

  angle = (angle + 0.1) % (Math.PI * 2);
}

function animationLoop(time = 0) {
  const dt = time - lastTime;

  lastTime = time;

  drawFrame(dt);

  requestAnimationFrame(animationLoop);
}

animationLoop();

document.addEventListener('pointermove', event => {
  if (event.target !== canvas) {
    return;
  }

  vector1.set(0, 0, event.clientX - canvas.width * 0.5);
  vector1.set(1, 0, event.clientY - canvas.height * 0.5);
});

animationSpeed.addEventListener('input', event => {
  speedMultiplier = Number(animationSpeed.value);

  animationSpeedValue.innerText = animationSpeed.value;
});
