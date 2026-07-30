const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 405;
const FRAME_TIME = 1000 / 60;
const MAX_FRAME_TIME = 1000 / 30;
const ZOOM_STEP = 0.1;

const mainContainer = document.getElementById('main-container');
const canvas = document.getElementById('canvas');
const animationSpeed = document.getElementById('animation-speed');
const animationSpeedValue = document.getElementById('animation-speed-value');
const transformationOrder = document.getElementById('transformation-order');

mainContainer.style.width = `${CANVAS_WIDTH}px`;

const ctx = new Context(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

ctx.setOrigin(ctx.width() * 0.5, ctx.height() * 0.5);

const vector1 = Matrix.newFromArray([[50], [100], [1]]);

const rectangle1 = new Rectangle('Rectangle 1', 0, 0, 50, 50, '#ffffff', '#ff0000');

ctx.addChild(rectangle1);

const container1 = new Container('Container 1', 0, 0);
const rectangle2 = new Rectangle('Rectangle 2', 100, 100, 50, 50, '#ffffff', '#0000ff');

container1.addChild(rectangle2);
ctx.addChild(container1);

const rectangle3 = new Rectangle('Rectangle 3', 200, 100, 15, 15, '#ffffff', '#ffff00');

ctx.addChild(rectangle3);

const container2 = new Container('Container 2', 200, 100);
const rectangle4 = new Rectangle('Rectangle 4', 35, 35, 10, 10, '#ffffff', '#ff00ff');

container2.addChild(rectangle4);
ctx.addChild(container2);

const star1 = new Star('Star 1', 200, -100, 5, 50, 25, '#ffffff', '#00ff00');

ctx.addChild(star1);

const rectangle5 = new Rectangle('Rectangle 5', -200, 100, 50, 50, '#ffffff', '#000000');
rectangle5.setScale(2, 1);
ctx.addChild(rectangle5);

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

  rectangle5.setRotation(rectangle5.rotation() + dt * 0.2);

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
  rectangle5.setScale(scale * 2, scale);

  angle += dt * (0.1 / FRAME_TIME);
}

function drawFrame(dt) {
  ctx.drawBegin();
    ctx.drawBackground();
    ctx.drawGrid();
    ctx.drawChildren();
    ctx.drawVector(vector1);
    ctx.drawFPS(fps);
  ctx.drawEnd();
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

let pointerDown = null;

canvas.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse') {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  pointerDown = {
    x: event.layerX,
    y: event.layerY
  };
});

canvas.addEventListener('pointermove', event => {
  if (pointerDown !== null) {
    const dx = event.layerX - pointerDown.x;
    const dy = event.layerY - pointerDown.y;

    ctx.setOrigin(
      ctx.origin().x + dx,
      ctx.origin().y + dy
    );

    pointerDown.x = event.layerX;
    pointerDown.y = event.layerY;
  }

  const canvasBounding = canvas.getBoundingClientRect()

  vector1.set(0, 0, event.clientX - canvasBounding.left - ctx.origin().x);
  vector1.set(1, 0, event.clientY - canvasBounding.top - ctx.origin().y);
});

canvas.addEventListener('pointerup', event => {
  if (event.pointerType !== 'mouse') {
    return;
  }

  pointerDown = null;
});

canvas.addEventListener('wheel', event => {
  event.preventDefault();

  let amount = 0;

  if (event.deltaY < 0) {
    amount = ZOOM_STEP;
  }
  else if (event.deltaY > 0 && ctx.zoom().x > 2 * ZOOM_STEP && ctx.zoom().y > 2 * ZOOM_STEP) {
    amount = -ZOOM_STEP;
  }

  if (amount === 0) {
    return;
  }

  const oldZoom = ctx.zoom();
  const newZoomX = oldZoom.x + amount;
  const newZoomY = oldZoom.y + amount;

  const mouseX = event.layerX;
  const mouseY = event.layerY;

  const oldOrigin = ctx.origin();

  const newOriginX = mouseX - (mouseX - oldOrigin.x) * (newZoomX / oldZoom.x);
  const newOriginY = mouseY - (mouseY - oldOrigin.y) * (newZoomY / oldZoom.y);

  ctx.setZoom(newZoomX, newZoomY);
  ctx.setOrigin(newOriginX, newOriginY);

  const canvasBounding = canvas.getBoundingClientRect();

  vector1.set(0, 0, event.clientX - canvasBounding.left - ctx.origin().x);
  vector1.set(1, 0, event.clientY - canvasBounding.top - ctx.origin().y);
});

animationSpeed.addEventListener('input', event => {
  speedMultiplier = Number(animationSpeed.value);

  animationSpeedValue.innerText = animationSpeed.value;
});

transformationOrder.addEventListener('change', event => {
  const option = Number(transformationOrder.value);

  ctx.setTransformationMatrixOrder(option);
});
