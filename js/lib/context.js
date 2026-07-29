class Context {
  #canvas = null;
  #ctx = null;
  #height = 0;
  #width = 0;
  #origin = { x: 0, y: 0 };
  #zoom = { x: 1, y: 1 };
  #rotation = 0;
  #base = null;
  #R = null;
  #S = null;
  #T = null;
  #transformationMatrixOrder = [];
  #transformationMatrix = null;
  #transformationMatrixHistory = [];
  #children = [];
  #logs = [];
  #logLevel = 0;
  #scope = 'Root';

  #applyMatrices(matrices, vector) {
    let newVector = vector.clone();

    for (let i = matrices.length - 1; i >= 0; --i) {
      const matrix = matrices[i];

      newVector = Matrix.multiplyMatrices(matrix, newVector);
    }

    return newVector;
  }

  #matrixForKey(key) {
    switch (key) {
      case 'T':
        return this.#T;
      case 'R':
        return this.#R;
      case 'S':
        return this.#S;
    }

    return Matrix.newIdentity(3);
  }

  #composeTransformationMatrix(orderKeys) {
    if (orderKeys.length === 0) {
      return Matrix.newIdentity(3);
    }

    const matrices = orderKeys.map(key => this.#matrixForKey(key));

    if (matrices.length === 1) {
      return matrices[0].clone();
    }

    let newMatrix = matrices[matrices.length - 1];

    for (let i = matrices.length - 2; i >= 0; --i) {
      const matrix = matrices[i];

      newMatrix = Matrix.multiplyMatrices(matrix, newMatrix);
    }

    return newMatrix;
  }

  #updateTransformationMatrix(reason = 'Unknown') {
    const before = {
      base: this.#base.dump(true),
      R: this.#R.dump(true),
      S: this.#S.dump(true),
      T: this.#T.dump(true),
      transformationMatrix: this.#transformationMatrix.dump(true)
    };

    const newTransformationMatrix = this.#composeTransformationMatrix(this.#transformationMatrixOrder);

    this.#transformationMatrix.copyFromMatrix(
      Matrix.multiplyMatrices(this.#base, newTransformationMatrix)
    );

    const after = {
      base: this.#base.dump(true),
      R: this.#R.dump(true),
      S: this.#S.dump(true),
      T: this.#T.dump(true),
      transformationMatrix: this.#transformationMatrix.dump(true)
    };

    const logEntry = {
      reason,
      before,
      after,
      scope: this.#scope,
      level: this.#logLevel
    };

    this.#logs.push(logEntry);
  }

  constructor(canvas, width, height) {
    if (canvas instanceof HTMLCanvasElement === false) {
      throw new Error('Invalid canvas');
    }

    this.#canvas = canvas;

    this.setWidth(width);
    this.setHeight(height);
    
    this.#ctx = canvas.getContext('2d');

    this.#ctx.imageSmoothingEnabled = false;

    this.#base = Matrix.newIdentity(3);
    this.#R = Matrix.newIdentity(3);
    this.#S = Matrix.newIdentity(3);
    this.#T = Matrix.newIdentity(3);

    this.#transformationMatrix = Matrix.newSquare(3);

    this.setTransformationMatrixOrder(0);
  }

  width() {
    return this.#width;
  }

  setWidth(width) {
    if (isValidNumber(width) === false) {
      throw new Error('Invalid width');
    }

    this.#canvas.width = width;

    this.#width = width;

    return this;
  }

  height() {
    return this.#height;
  }

  setHeight(height) {
    if (isValidNumber(height) === false) {
      throw new Error('Invalid height');
    }

    this.#canvas.height = height;

    this.#height = height;

    return this;
  }

  origin() {
    return {
      ...this.#origin
    };
  }

  setOrigin(x, y) {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    this.#origin.x = x;
    this.#origin.y = y;

    return this;
  }

  zoom() {
    return {
      ...this.#zoom
    };
  }

  setZoom(x, y) {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    this.#zoom.x = x;
    this.#zoom.y = y;

    return this;
  }

  rotation() {
    return this.#rotation;
  }

  setRotation(angle) {
    if (isValidNumber(angle) === false) {
      throw new Error('Invalid angle');
    }

    this.#rotation = angle % 360;

    return this;
  }

  setTransformationMatrixOrder(option) {
    switch (option) {
      case 1:
        this.#transformationMatrixOrder = ['T', 'S', 'R']; // Correct, but weird
        break;
      case 2:
        this.#transformationMatrixOrder = ['R', 'T', 'S']; // Wrong
        break;
      case 3:
        this.#transformationMatrixOrder = ['R', 'S', 'T']; // Wrong
        break;
      case 4:
        this.#transformationMatrixOrder = ['S', 'T', 'R']; // Correct, but weird
        break;
      case 5:
        this.#transformationMatrixOrder = ['S', 'R', 'T']; // Wrong
        break;
      default:
        this.#transformationMatrixOrder = ['T', 'R', 'S']; // Correct
        break;
    }

    this.#updateTransformationMatrix('Changing transformation matrix order');

    return this;
  }

  save(scope = 'Root') {
    if (typeof scope !== 'string' || scope.length === 0) {
      throw new Error('Invalid scope');
    }

    const historyEntry = {
      scope: this.#scope,
      base: this.#base.clone(),
      R: this.#R.clone(),
      S: this.#S.clone(),
      T: this.#T.clone()
    };

    this.#transformationMatrixHistory.push(historyEntry);

    this.#scope = scope;

    this.#base.copyFromMatrix(this.#transformationMatrix);

    this.#R.makeIdentity();
    this.#S.makeIdentity();
    this.#T.makeIdentity();

    this.#updateTransformationMatrix('Saving');

    ++this.#logLevel;
  }

  restore() {
    if (this.#transformationMatrixHistory.length === 0) {
      return;
    }

    --this.#logLevel;

    const historyEntry = this.#transformationMatrixHistory.pop();

    this.#scope = historyEntry.scope;
    this.#base.copyFromMatrix(historyEntry.base);
    this.#R.copyFromMatrix(historyEntry.R);
    this.#S.copyFromMatrix(historyEntry.S);
    this.#T.copyFromMatrix(historyEntry.T);

    this.#updateTransformationMatrix('Restoring');
  }

  scale(x = 1, y = 1) {
    this.#S.set(0, 0, this.#S.get(0, 0) * x);
    this.#S.set(1, 1, this.#S.get(1, 1) * y);

    this.#updateTransformationMatrix('Scaling');
  }

  rotate(deg = 0) {
    const oldAngleRad = Math.acos(this.#R.get(0, 0));
    const rad = deg * Math.PI / 180;
    const newAngleRad = oldAngleRad + rad;

    const cos = Math.cos(newAngleRad);
    const sin = Math.sin(newAngleRad);

    this.#R.set(0, 0, cos);
    this.#R.set(1, 1, cos);

    this.#R.set(0, 1, -sin);
    this.#R.set(1, 0, sin);

    this.#updateTransformationMatrix('Rotating');
  }

  translate(x = 0, y = 0) {
    this.#T.set(0, 2, this.#T.get(0, 2) + x);
    this.#T.set(1, 2, this.#T.get(1, 2) + y);

    this.#updateTransformationMatrix('Translating');
  }

  children() {
    return [
      ...this.#children
    ];
  }

  addChild(object) {
    if (object instanceof BaseObject === false) {
      throw new Error('Invalid object');
    }

    this.#children.push(object);
  }

  drawBegin() {
    this.#logs = [];
    this.#logLevel = 0;
  }

  drawEnd() {
    const dump = document.getElementById('dump');

    let table = '';

    for (const logEntry of this.#logs) {
      table += '<div class="row">';

        for (let i = 0; i < logEntry.level; ++i) {
          table += '<div class="spacer"></div>'
        }

        table += '<div class="content">'
          table += `<div class="reason">${logEntry.reason} (${logEntry.scope})</div>`;
          table += '<div class="header">Before</div>';
          table += '<div class="content-base content-before">';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">Base</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.before.base}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">R</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.before.R}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">S</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.before.S}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">T</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.before.T}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">Transformation</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.before.transformationMatrix}</pre></div>`;
            table += '</div>';
          table += '</div>';

          table += '<div class="header">After</div>';
          table += '<div class="content-base content-after">';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">Base</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.after.base}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">R</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.after.R}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">S</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.after.S}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">T</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.after.T}</pre></div>`;
            table += '</div>';
            table += '<div class="matrix-dump">';
              table += '<div class="matrix-dump-header">Transformation</div>';
              table += `<div class="matrix-dump-content"><pre>${logEntry.after.transformationMatrix}</pre></div>`;
            table += '</div>';
          table += '</div>';
        table += '</div>'
      table += '</div>';
    }

    dump.innerHTML = table;
  }

  drawBackground() {
    this.#ctx.fillStyle = "#313131";

    this.#ctx.fillRect(0, 0, this.#width, this.#height);
  }

  drawGrid(step) {
    if (isValidNumber(step) === false || step < 1) {
      step = 50;
    }

    let x = this.#origin.x + (this.#origin.x % 1 === 0 ? 0.5 : 0);
    let y = this.#origin.y + (this.#origin.y % 1 === 0 ? 0.5 : 0);

    this.#ctx.lineWidth = 1;
    this.#ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

    while ((x - step) > 0) {
      x -= step;
    }

    while ((y - step) > 0) {
      y -= step;
    }

    while (x <= canvas.width) {
      this.#ctx.beginPath();
        this.#ctx.moveTo(x, 0);
        this.#ctx.lineTo(x, canvas.height - 1);
      this.#ctx.stroke();

      x += step;
    }

    while (y <= canvas.height) {
      this.#ctx.beginPath();
        this.#ctx.moveTo(0, y);
        this.#ctx.lineTo(canvas.width - 1, y);
      this.#ctx.stroke();

      y += step;
    }

    this.#ctx.lineWidth = 2;

    this.#ctx.beginPath();
      this.#ctx.moveTo(this.#origin.x, 0);
      this.#ctx.lineTo(this.#origin.x, canvas.height - 1);
    this.#ctx.stroke();

    this.#ctx.beginPath();
      this.#ctx.moveTo(0, this.#origin.y);
      this.#ctx.lineTo(canvas.width - 1, this.#origin.y);
    this.#ctx.stroke();
  }

  drawVector(vector) {
    this.save('Vector');
      this.translate(this.#origin.x, this.#origin.y);

      const vectorOrigin = Matrix.newFromArray([[0], [0], [1]]);

      const newVectorOrigin = this.#applyMatrices([this.#transformationMatrix], vectorOrigin);
      const newVector = this.#applyMatrices([this.#transformationMatrix], vector);

      this.#ctx.strokeStyle = '#ffffff';

      this.#ctx.beginPath();
        this.#ctx.moveTo(newVectorOrigin.get(0, 0), newVectorOrigin.get(1, 0));
        this.#ctx.lineTo(newVector.get(0, 0), newVector.get(1, 0));
      this.#ctx.stroke();

      const vectorTip = vector.clone();

      vectorTip
        .multiplyScalar(-0.15)
        .set(2, 0, 1);

      this.translate(vector.get(0, 0), vector.get(1, 0));
      this.rotate(45);

      const newVectorTip1 = this.#applyMatrices([this.#transformationMatrix], vectorTip);

      this.rotate(-90);

      const newVectorTip2 = this.#applyMatrices([this.#transformationMatrix], vectorTip);
    this.restore();

    this.#ctx.beginPath();
      this.#ctx.moveTo(newVector.get(0, 0), newVector.get(1, 0));
      this.#ctx.lineTo(newVectorTip1.get(0, 0), newVectorTip1.get(1, 0));
    this.#ctx.stroke();

    this.#ctx.beginPath();
      this.#ctx.moveTo(newVector.get(0, 0), newVector.get(1, 0));
      this.#ctx.lineTo(newVectorTip2.get(0, 0), newVectorTip2.get(1, 0));
    this.#ctx.stroke();
  }

  drawChildren() {
    this.save('Children');
      this.translate(this.#origin.x, this.#origin.y);
      this.rotate(this.#rotation);
      this.scale(this.#zoom.x, this.#zoom.y);

      for (const child of this.#children) {
        child.draw(ctx);
      }
    this.restore();
  }

  drawPolygon(points, stroke = '#ffffff', fill = '#ff0000') {
    this.#ctx.strokeStyle = stroke;
    this.#ctx.fillStyle = fill;

    this.#ctx.beginPath();
      for (let i = 0; i < points.length; ++i) {
        const point = points[i];
        const newPoint = this.#applyMatrices([this.#transformationMatrix], point);

        if (i === 0) {
          this.#ctx.moveTo(newPoint.get(0, 0), newPoint.get(1, 0));
        }
        else {
          this.#ctx.lineTo(newPoint.get(0, 0), newPoint.get(1, 0));
        }
      }
    this.#ctx.closePath();

    this.#ctx.fill();
    this.#ctx.stroke();
  }

  drawFPS(fps) {
    this.#ctx.font = 'bold 16px Arial';
    this.#ctx.fillStyle = '#ffffff';

    this.#ctx.fillText(`FPS: ${fps.toFixed(2)}`, 10, 20);
  }
}
