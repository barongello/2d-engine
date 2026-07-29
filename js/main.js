const canvas = document.getElementById('canvas');
const animationSpeed = document.getElementById('animation-speed');
const animationSpeedValue = document.getElementById('animation-speed-value');

const ctx = new Context(canvas, 720, 405);

const vector1 = Matrix.newFromArray([[50], [100], [1]]);

const rectangle1 = new Rectangle(0, 0, 50, 50, '#ffffff', '#ff0000');
const rectangle2 = new Rectangle(0, 0, 50, 50, '#ffffff', '#0000ff');
const rectangle3 = new Rectangle(200, 100, 15, 15, '#ffffff', '#ffff00');
const rectangle4 = new Rectangle(200, 100, 10, 10, '#ffffff', '#ff00ff');

const star1 = new Star(200, -100, 5, 50, 25);

rectangle2.setOffset(100, 100);
rectangle4.setOffset(35, 35);

let speedMultiplier = 1;
let lastTime = 0;
let angle = 0;

function drawFrame(dt = 0) {
  dt *= speedMultiplier;

  ctx.clearBackground();
  ctx.drawGrid();

  rectangle1.draw(ctx);
  rectangle2.draw(ctx);
  rectangle3.draw(ctx);
  rectangle4.draw(ctx);

  star1.draw(ctx);

  ctx.drawVector(vector1);

  rectangle1.setRotation(rectangle1.rotation() + dt * -0.025);
  rectangle2.setRotation(rectangle2.rotation() + dt * 0.035);
  rectangle3.setRotation(rectangle3.rotation() + dt * 0.05);
  rectangle4.setRotation(rectangle4.rotation() + dt * -0.075);

  star1.setRotation(star1.rotation() + dt * -0.175);

  rectangle2.setOffset(
    rectangle2.offset().x + Math.sin(angle),
    rectangle2.offset().y
  );

  rectangle4.setOffset(
    rectangle4.offset().x + Math.sin(-angle) * 0.5,
    rectangle4.offset().y
  );

  const scale = Math.sin(angle * 0.2);

  star1.setScale(scale, scale);

  angle += 0.1;
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
