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

  const star1Scale = Math.sin(angle * 0.2);

  star1.setScale(star1Scale, star1Scale);

  const rectangle5Scale = Math.sin(angle * 0.35);

  rectangle5.setScale(rectangle5Scale * 2, rectangle5Scale);

  angle += dt * (0.1 / FRAME_TIME);
}

function drawFrame() {
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
  drawFrame();

  requestAnimationFrame(animationLoop);
}

animationLoop();

const activePointers = new Map();
let currentGesture = null;
let mouseRotate = null;

canvas.addEventListener('contextmenu', event => {
  event.preventDefault();
});

function getCanvasScale() {
  const bounding = canvas.getBoundingClientRect();

  return {
    bounding,
    scaleX: canvas.width / bounding.width,
    scaleY: canvas.height / bounding.height
  };
}

function getEventSamples(event) {
  if (typeof event.getCoalescedEvents === 'function') {
    const coalesced = event.getCoalescedEvents();

    if (coalesced.length > 0) {
      return coalesced;
    }
  }

  return [event];
}

function computeGesture(pointsMap) {
  const entries = [...pointsMap.entries()].sort((a, b) => a[0] - b[0]);
  const points = entries.map(e => e[1]);
  const n = points.length;

  let cx = 0;
  let cy = 0;

  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }

  cx /= n;
  cy /= n;

  let spread = 0;

  for (const p of points) {
    spread += Math.hypot(p.x - cx, p.y - cy);
  }

  spread /= n;

  let angle = 0;

  if (n >= 2) {
    const [p0, p1] = points;

    angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  }

  return { cx, cy, spread, angle };
}

function normalizeAngleDelta(deltaRad) {
  return Math.atan2(Math.sin(deltaRad), Math.cos(deltaRad));
}

function computeAnchoredOrigin(anchor, oldOrigin, oldZoom, oldRotationDeg, newZoom, newRotationDeg) {
  const oldRad = oldRotationDeg * Math.PI / 180;
  const newRad = newRotationDeg * Math.PI / 180;

  const dx = anchor.x - oldOrigin.x;
  const dy = anchor.y - oldOrigin.y;

  const cosOld = Math.cos(oldRad);
  const sinOld = Math.sin(oldRad);

  const rx = dx * cosOld + dy * sinOld;
  const ry = -dx * sinOld + dy * cosOld;

  const worldX = rx / oldZoom.x;
  const worldY = ry / oldZoom.y;

  const scaledX = worldX * newZoom.x;
  const scaledY = worldY * newZoom.y;

  const cosNew = Math.cos(newRad);
  const sinNew = Math.sin(newRad);

  const finalX = scaledX * cosNew - scaledY * sinNew;
  const finalY = scaledX * sinNew + scaledY * cosNew;

  return {
    x: anchor.x - finalX,
    y: anchor.y - finalY
  };
}

canvas.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button === 2) {
    canvas.setPointerCapture(event.pointerId);

    const { scaleX, scaleY, bounding } = getCanvasScale();

    mouseRotate = {
      pointerId: event.pointerId,
      pivotX: (event.clientX - bounding.left) * scaleX,
      pivotY: (event.clientY - bounding.top) * scaleY,
      lastAngle: null
    };

    return;
  }

  if (event.pointerType === 'mouse' && event.button !== 0) {
    return;
  }

  canvas.setPointerCapture(event.pointerId);

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  currentGesture = computeGesture(activePointers);
});

function handleRotateSample(sample, scaleX, scaleY, bounding) {
  const mouseX = (sample.clientX - bounding.left) * scaleX;
  const mouseY = (sample.clientY - bounding.top) * scaleY;

  const vx = mouseX - mouseRotate.pivotX;
  const vy = mouseY - mouseRotate.pivotY;

  if (Math.hypot(vx, vy) > 1) {
    const angle = Math.atan2(vy, vx);

    if (mouseRotate.lastAngle !== null) {
      const deltaRad = normalizeAngleDelta(angle - mouseRotate.lastAngle);
      const newRotation = ctx.rotation() + deltaRad * 180 / Math.PI;

      const newOrigin = computeAnchoredOrigin(
        { x: mouseRotate.pivotX, y: mouseRotate.pivotY },
        ctx.origin(),
        ctx.zoom(),
        ctx.rotation(),
        ctx.zoom(),
        newRotation
      );

      ctx.setRotation(newRotation);
      ctx.setOrigin(newOrigin.x, newOrigin.y);
    }

    mouseRotate.lastAngle = angle;
  }

  vector1.set(0, 0, mouseX - ctx.origin().x);
  vector1.set(1, 0, mouseY - ctx.origin().y);
}

function handleGestureSample(sample, scaleX, scaleY, bounding) {
  let referenceX = sample.clientX;
  let referenceY = sample.clientY;

  if (activePointers.has(sample.pointerId) === true) {
    activePointers.set(sample.pointerId, { x: sample.clientX, y: sample.clientY });
  }

  const isMouseDrag = sample.pointerType === 'mouse' && activePointers.has(sample.pointerId);
  const isMultiTouch = activePointers.size >= 2;

  if (isMouseDrag === true || isMultiTouch === true) {
    const current = computeGesture(activePointers);

    if (currentGesture !== null) {
      const dx = (current.cx - currentGesture.cx) * scaleX;
      const dy = (current.cy - currentGesture.cy) * scaleY;

      ctx.setOrigin(
        ctx.origin().x + dx,
        ctx.origin().y + dy
      );

      if (isMultiTouch === true) {
        const oldZoom = ctx.zoom();

        let newZoomX = oldZoom.x;
        let newZoomY = oldZoom.y;

        if (currentGesture.spread > 0 && current.spread > 0) {
          const zoomRatio = current.spread / currentGesture.spread;

          newZoomX = Math.max(oldZoom.x * zoomRatio, 2 * ZOOM_STEP);
          newZoomY = Math.max(oldZoom.y * zoomRatio, 2 * ZOOM_STEP);
        }

        const angleDeltaRad = normalizeAngleDelta(current.angle - currentGesture.angle);
        const newRotation = ctx.rotation() + angleDeltaRad * 180 / Math.PI;

        const anchorX = (current.cx - bounding.left) * scaleX;
        const anchorY = (current.cy - bounding.top) * scaleY;

        const newOrigin = computeAnchoredOrigin(
          { x: anchorX, y: anchorY },
          ctx.origin(),
          oldZoom,
          ctx.rotation(),
          { x: newZoomX, y: newZoomY },
          newRotation
        );

        ctx.setZoom(newZoomX, newZoomY);
        ctx.setRotation(newRotation);
        ctx.setOrigin(newOrigin.x, newOrigin.y);
      }
    }

    currentGesture = current;

    referenceX = current.cx;
    referenceY = current.cy;
  }

  vector1.set(0, 0, (referenceX - bounding.left) * scaleX - ctx.origin().x);
  vector1.set(1, 0, (referenceY - bounding.top) * scaleY - ctx.origin().y);
}

canvas.addEventListener('pointermove', event => {
  const { scaleX, scaleY, bounding } = getCanvasScale();
  const samples = getEventSamples(event);

  const isRightMouseDrag = event.pointerType === 'mouse'
    && mouseRotate !== null
    && event.pointerId === mouseRotate.pointerId
    && (event.buttons & 2) !== 0;

  for (const sample of samples) {
    if (isRightMouseDrag === true) {
      handleRotateSample(sample, scaleX, scaleY, bounding);
    }
    else {
      handleGestureSample(sample, scaleX, scaleY, bounding);
    }
  }
});

function releasePointer(event) {
  if (mouseRotate !== null && event.pointerId === mouseRotate.pointerId) {
    mouseRotate = null;
  }

  if (activePointers.has(event.pointerId) === false) {
    return;
  }

  activePointers.delete(event.pointerId);

  currentGesture = activePointers.size > 0
    ? computeGesture(activePointers)
    : null;
}

canvas.addEventListener('pointerup', releasePointer);

canvas.addEventListener('pointercancel', releasePointer);

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

  const { scaleX, scaleY, bounding } = getCanvasScale();

  const mouseX = (event.clientX - bounding.left) * scaleX;
  const mouseY = (event.clientY - bounding.top) * scaleY;

  const oldZoom = ctx.zoom();
  const newZoomX = oldZoom.x + amount;
  const newZoomY = oldZoom.y + amount;

  const rotation = ctx.rotation();

  const newOrigin = computeAnchoredOrigin(
    { x: mouseX, y: mouseY },
    ctx.origin(),
    oldZoom,
    rotation,
    { x: newZoomX, y: newZoomY },
    rotation
  );

  ctx.setZoom(newZoomX, newZoomY);
  ctx.setOrigin(newOrigin.x, newOrigin.y);

  vector1.set(0, 0, mouseX - ctx.origin().x);
  vector1.set(1, 0, mouseY - ctx.origin().y);
});

animationSpeed.addEventListener('input', event => {
  speedMultiplier = Number(animationSpeed.value);

  animationSpeedValue.innerText = animationSpeed.value;
});

transformationOrder.addEventListener('change', event => {
  const option = Number(transformationOrder.value);

  ctx.setTransformationMatrixOrder(option);
});
