class Context {
  #canvas = null;
  #ctx = null;
  #height = 0;
  #width = 0;
  #origin = { x: 0, y: 0 };
  #R = null;
  #S = null;
  #T = null;
  #transformMatrix = null;
  #transformMatrixHistory = [];

  #applyMatrices(matrices, vector) {
    let newVector = vector.clone();

    for (let i = matrices.length - 1; i >= 0; --i) {
      const matrix = matrices[i];

      newVector = Matrix.multiplyMatrices(matrix, newVector);
    }

    return newVector;
  }

  #composeTransformMatrix(matrices) {
    if (matrices.length === 0) {
      return Matrix.newIdentity(3);
    }

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

  #applyTRS(vector) {
    return this.#applyMatrices([this.#T, this.#R, this.#S], vector);
  }

  #applyTSR(vector) {
    return this.#applyMatrices([this.#T, this.#S, this.#R], vector);
  }

  #applyRTS(vector) {
    return this.#applyMatrices([this.#R, this.#T, this.#S], vector);
  }

  #applyRST(vector) {
    return this.#applyMatrices([this.#R, this.#S, this.#T], vector);
  }

  #applySTR(vector) {
    return this.#applyMatrices([this.#S, this.#T, this.#R], vector);
  }

  #applySRT(vector) {
    return this.#applyMatrices([this.#S, this.#R, this.#T], vector);
  }

  constructor(canvas, width, height) {
    if (canvas instanceof HTMLCanvasElement === false) {
      throw new Error('Invalid canvas');
    }

    if (isValidNumber(width) === false || width < 1) {
      throw new Error('Invalid width');
    }

    if (isValidNumber(height) === false || height < 1) {
      throw new Error('Invalid height');
    }

    canvas.width = width;
    canvas.height = height;

    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d');

    this.#ctx.imageSmoothingEnabled = false;

    this.#height = height;
    this.#width = width;

    this.#origin.x = width * 0.5;
    this.#origin.y = height * 0.5;

    this.#R = Matrix.newIdentity(3);
    this.#S = Matrix.newIdentity(3);
    this.#T = Matrix.newIdentity(3);

    this.#transformMatrix = this.#composeTransformMatrix([this.#T, this.#R, this.#S]);

    this.translate(this.#origin.x, this.#origin.y);
  }

  save() {
    const historyEntry = {
      R: this.#R.clone(),
      S: this.#S.clone(),
      T: this.#T.clone(),
      transformMatrix: this.#transformMatrix.clone()
    };

    this.#transformMatrixHistory.push(historyEntry);
  }

  restore() {
    if (this.#transformMatrixHistory.length === 0) {
      return;
    }

    const historyEntry = this.#transformMatrixHistory.pop();

    this.#R = historyEntry.R;
    this.#S = historyEntry.S;
    this.#T = historyEntry.T;
    this.#transformMatrix = historyEntry.transformMatrix;
  }

  scale(x = 1, y = 1) {
    this.#S.set(0, 0, this.#S.get(0, 0) * x);
    this.#S.set(1, 1, this.#S.get(1, 1) * y);

    this.#transformMatrix = this.#composeTransformMatrix([this.#T, this.#R, this.#S]);
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

    this.#transformMatrix = this.#composeTransformMatrix([this.#T, this.#R, this.#S]);
  }

  translate(x = 0, y = 0) {
    this.#T.set(0, 2, this.#T.get(0, 2) + x);
    this.#T.set(1, 2, this.#T.get(1, 2) + y);

    this.#transformMatrix = this.#composeTransformMatrix([this.#T, this.#R, this.#S]);
  }

  clearBackground() {
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
    const vectorOrigin = Matrix.newFromArray([[0], [0], [1]]);

    const newVectorOrigin = this.#applyMatrices([this.#transformMatrix], vectorOrigin);
    const newVector = this.#applyMatrices([this.#transformMatrix], vector);

    this.#ctx.strokeStyle = '#ffffff';

    this.#ctx.beginPath();
      this.#ctx.moveTo(newVectorOrigin.get(0, 0), newVectorOrigin.get(1, 0));
      this.#ctx.lineTo(newVector.get(0, 0), newVector.get(1, 0));
    this.#ctx.stroke();

    const vectorTip = vector.clone();

    vectorTip
      .multiplyScalar(-0.15)
      .set(2, 0, 1);

    this.save();
      this.translate(vector.get(0, 0), vector.get(1, 0));
      this.rotate(45);

      const newVectorTip1 = this.#applyMatrices([this.#transformMatrix], vectorTip);

      this.rotate(-90);

      const newVectorTip2 = this.#applyMatrices([this.#transformMatrix], vectorTip);
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

  drawPolygon(points, stroke = '#ffffff', fill = '#ff0000') {
    let transformMatrix = null;

    // Uncomment to test
    // transformMatrix = this.#composeTransformMatrix([this.#T, this.#R, this.#S]); // Correct
    // transformMatrix = this.#composeTransformMatrix([this.#T, this.#S, this.#R]); // Correct, but weird
    // transformMatrix = this.#composeTransformMatrix([this.#R, this.#T, this.#S]); // Wrong
    // transformMatrix = this.#composeTransformMatrix([this.#R, this.#S, this.#T]); // Wrong
    // transformMatrix = this.#composeTransformMatrix([this.#S, this.#T, this.#R]); // Correct, but weird
    // transformMatrix = this.#composeTransformMatrix([this.#S, this.#R, this.#T]); // Wrong

    this.#ctx.strokeStyle = stroke;
    this.#ctx.fillStyle = fill;

    this.#ctx.beginPath();
      for (let i = 0; i < points.length; ++i) {
        const point = points[i];
        const newPoint = this.#applyMatrices([transformMatrix !== null ? transformMatrix : this.#transformMatrix], point);

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

  drawSquare(square) {
    if (square instanceof Square === false) {
      return;
    }

    const topLeft = square.topLeft();
    const topRight = square.topRight();
    const bottomLeft = square.bottomLeft();
    const bottomRight = square.bottomRight();

    this.drawPolygon([topLeft, bottomLeft, bottomRight, topRight]);
  }
}
