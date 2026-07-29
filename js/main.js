const FRAME_TIME = 1000 / 60;
const MAX_FRAME_TIME = 1000 / 30;

const canvas = document.getElementById('canvas');
const animationSpeed = document.getElementById('animation-speed');
const animationSpeedValue = document.getElementById('animation-speed-value');
const transformationOrder = document.getElementById('transformation-order');

const ctx = new Context(canvas, 720, 405);

const vector1 = Matrix.newFromArray([[50], [100], [1]]);

const rectangle1 = new Rectangle(0, 0, 50, 50, '#ffffff', '#ff0000');

ctx.addChild(rectangle1);

const container1 = new Container(0, 0);
const rectangle2 = new Rectangle(100, 100, 50, 50, '#ffffff', '#0000ff');

container1.addChild(rectangle2);
ctx.addChild(container1);

const rectangle3 = new Rectangle(200, 100, 15, 15, '#ffffff', '#ffff00');

ctx.addChild(rectangle3);

const container2 = new Container(200, 100);
const rectangle4 = new Rectangle(35, 35, 10, 10, '#ffffff', '#ff00ff');

container2.addChild(rectangle4);
ctx.addChild(container2);

const star1 = new Star(200, -100, 5, 50, 25);

ctx.addChild(star1);

const rectangle2BasePosition = rectangle2.position().x;
const rectangle4BasePosition = rectangle4.position().x;

const rectangle2Amplitude = rectangle2BasePosition * 0.15;
const rectangle4Amplitude = rectangle4BasePosition / 7;

let speedMultiplier = 1;
let fps = 0;
let fpsCounter = 0;
let fpsTimer = 0;
let lastTime = null;
let angle = 0;

function updateFrame(dt) {
  dt = Math.min(dt, MAX_FRAME_TIME);
  dt *= speedMultiplier;

  rectangle1.setRotation(rectangle1.rotation() + dt * -0.025);
  container1.setRotation(container1.rotation() + dt * 0.035);
  rectangle3.setRotation(rectangle3.rotation() + dt * 0.05);
  container2.setRotation(container2.rotation() + dt * -0.075);

  star1.setRotation(star1.rotation() + dt * -0.175);

  rectangle2.setPosition(
    rectangle2BasePosition + Math.sin(angle) * rectangle2Amplitude,
    rectangle2.position().y
  );

  rectangle4.setPosition(
    rectangle4BasePosition + Math.sin(-angle) * 0.5 * rectangle4Amplitude,
    rectangle4.position().y
  );

  const scale = Math.sin(angle * 0.2);

  star1.setScale(scale, scale);

  angle += dt * (0.1 / FRAME_TIME);
}

function drawFrame(dt) {
  ctx.clearBackground();
  ctx.drawGrid();
  ctx.drawChildren();
  ctx.drawVector(vector1);
  ctx.drawFPS(fps);
}

function animationLoop(time = 0) {
  if (lastTime === null) {
    lastTime = time;
  }

  const dt = time - lastTime;

  lastTime = time;

  ++fpsCounter;
  fpsTimer += dt;

  if (fpsTimer >= 1000) {
    fps = fpsCounter * 1000 / fpsTimer;
    fpsCounter = 0;
    fpsTimer = 0;
  }

  updateFrame(dt);
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

transformationOrder.addEventListener('change', event => {
  const option = Number(transformationOrder.value);

  ctx.setTransformationMatrixOrder(option);
});

// TODO
// Store transformations log to show step by step
