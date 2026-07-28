const canvas = document.getElementById('canvas');
const ctx = new Context(canvas, 720, 405);

const vector1 = Matrix.newFromArray([[50], [100], [1]]);

const square1 = new Square(0, 0, 50, 50, '#ffffff', '#ff0000');
const square2 = new Square(0, 0, 50, 50, '#ffffff', '#0000ff');
const square3 = new Square(200, 100, 15, 15, '#ffffff', '#ffff00');
const square4 = new Square(200, 100, 10, 10, '#ffffff', '#ff00ff');

square2.setOffset(100, 100);
square4.setOffset(35, 35);

let lastTime = 0;

function animationLoop(time = 0) {
  const dt = time - lastTime;

  lastTime = time;

  ctx.clearBackground();
  ctx.drawGrid();

  square1.draw(ctx);
  square2.draw(ctx);
  square3.draw(ctx);
  square4.draw(ctx);

  ctx.drawVector(vector1);

  square1.setRotation(square1.rotation() + dt * 0.025);
  square2.setRotation(square2.rotation() + dt * 0.035);
  square3.setRotation(square3.rotation() + dt * 0.05);
  square4.setRotation(square4.rotation() + dt * 0.075);

  requestAnimationFrame(animationLoop);
}

animationLoop();

document.addEventListener('mousemove', event => {
  vector1.set(0, 0, event.clientX - canvas.width * 0.5);
  vector1.set(1, 0, event.clientY - canvas.height * 0.5);
});
