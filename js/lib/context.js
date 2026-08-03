const ORIGIN = Matrix.newFromArray([[0], [0], [1]]);
const FONT_SIZE = 12;
const LINE_GAP = 2;

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
  #logCurrent = {};
  #scope = 'Root';
  #gridCache = null;

  #addLogEntry(reason) {
    this.#logCurrent.reason = reason;
    this.#logCurrent.scope = this.#scope;
    this.#logCurrent.level = this.#logLevel;

    this.#logs.push(this.#logCurrent);

    this.#logCurrent = {};
  }

  #updateLogEntry(key) {
    const value = {
      base: this.#base.dump(true),
      R: this.#R.dump(true),
      S: this.#S.dump(true),
      T: this.#T.dump(true),
      transformationMatrix: this.#transformationMatrix.dump(true)
    };

    this.#logCurrent[key] = value;
  }

  #applyMatrices(matrices, vector) {
    let current = MatrixPool.acquireVector3();

    current.copyFromMatrix(vector);

    for (let i = matrices.length - 1; i >= 0; --i) {
      const matrix = matrices[i];
      const next = MatrixPool.acquireVector3();

      Matrix.multiplyMatricesInto(next, matrix, current);

      MatrixPool.release(current);

      current = next;
    }

    return current;
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

  #composeTransformationMatrix(orderKeys, out) {
    if (orderKeys.length === 0) {
      out.makeIdentity();

      return out;
    }

    const matrices = orderKeys.map(key => this.#matrixForKey(key));

    if (matrices.length === 1) {
      out.copyFromMatrix(matrices[0]);
      return out;
    }

    let scratchA = MatrixPool.acquire3x3();
    let scratchB = MatrixPool.acquire3x3();

    scratchA.copyFromMatrix(matrices[matrices.length - 1]);

    for (let i = matrices.length - 2; i >= 0; --i) {
      const matrix = matrices[i];

      Matrix.multiplyMatricesInto(scratchB, matrix, scratchA);

      const temp = scratchA;

      scratchA = scratchB;
      scratchB = temp;
    }

    out.copyFromMatrix(scratchA);

    MatrixPool.release(scratchA);
    MatrixPool.release(scratchB);

    return out;
  }

  #updateTransformationMatrix() {
    const localScratch = MatrixPool.acquire3x3();

    this.#composeTransformationMatrix(this.#transformationMatrixOrder, localScratch);

    const combined = MatrixPool.acquire3x3();

    Matrix.multiplyMatricesInto(combined, this.#base, localScratch);

    this.#transformationMatrix.copyFromMatrix(combined);

    MatrixPool.release(localScratch);
    MatrixPool.release(combined);
  }

  #intersectLineRect(ox, oy, dx, dy, minX, minY, maxX, maxY) {
    const EPS = 1e-6;
    const candidates = [];

    if (dx !== 0) {
      for (const boundX of [minX, maxX]) {
        const t = (boundX - ox) / dx;
        const y = oy + t * dy;

        if (y >= minY - EPS && y <= maxY + EPS) {
          candidates.push(t);
        }
      }
    }

    if (dy !== 0) {
      for (const boundY of [minY, maxY]) {
        const t = (boundY - oy) / dy;
        const x = ox + t * dx;

        if (x >= minX - EPS && x <= maxX + EPS) {
          candidates.push(t);
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    const bestT = Math.max(...candidates);

    return { x: ox + bestT * dx, y: oy + bestT * dy };
  }

  #computeGridLines(step) {
    const zoom = this.#zoom;
    const minZoom = Math.max(Math.min(Math.abs(zoom.x), Math.abs(zoom.y)), 0.001);

    const cornerDistances = [
      Math.hypot(this.#origin.x, this.#origin.y),
      Math.hypot(this.#width - this.#origin.x, this.#origin.y),
      Math.hypot(this.#origin.x, this.#height - this.#origin.y),
      Math.hypot(this.#width - this.#origin.x, this.#height - this.#origin.y)
    ];

    const maxScreenDistance = Math.max(...cornerDistances);

    const extent = Math.ceil((maxScreenDistance / minZoom) / step) * step + step;

    this.save('Grid');
      this.translate(this.#origin.x, this.#origin.y);
      this.rotate(this.#rotation);
      this.scale(zoom.x, zoom.y);

      const transform = point => this.#applyMatrices([this.#transformationMatrix], point);

      const verticalLines = [];
      const horizontalLines = [];

      for (let x = -extent; x <= extent; x += step) {
        const p1 = transform(Matrix.newFromArray([[x], [-extent], [1]]));
        const p2 = transform(Matrix.newFromArray([[x], [extent], [1]]));

        verticalLines.push({
          x1: p1.get(0, 0), y1: p1.get(1, 0),
          x2: p2.get(0, 0), y2: p2.get(1, 0)
        });
      }

      for (let y = -extent; y <= extent; y += step) {
        const p1 = transform(Matrix.newFromArray([[-extent], [y], [1]]));
        const p2 = transform(Matrix.newFromArray([[extent], [y], [1]]));

        horizontalLines.push({
          x1: p1.get(0, 0), y1: p1.get(1, 0),
          x2: p2.get(0, 0), y2: p2.get(1, 0)
        });
      }

      const originScreen = transform(Matrix.newFromArray([[0], [0], [1]]));

      const rectBounds = {
        minX: 0,
        minY: 0,
        maxX: this.#width,
        maxY: this.#height
      };

      const rotRad = this.#rotation * Math.PI / 180;

      const signOrDefault = value => {
        const s = Math.sign(value);
        return s === 0 ? 1 : s;
      };

      const signX = Math.sign(zoom.x);
      const signY = Math.sign(zoom.y);

      const baseXDirX = Math.cos(rotRad);
      const baseXDirY = Math.sin(rotRad);
      const baseYDirX = -Math.sin(rotRad);
      const baseYDirY = Math.cos(rotRad);

      const xAxisBase = transform(Matrix.newFromArray([[-extent], [0], [1]]));
      const xAxisFar = transform(Matrix.newFromArray([[extent], [0], [1]]));

      let xArrowTip = null;
      let xDirX = 0;
      let xDirY = 0;

      if (signX !== 0) {
        xDirX = baseXDirX * signX;
        xDirY = baseXDirY * signX;

        xArrowTip = this.#intersectLineRect(
          originScreen.get(0, 0), originScreen.get(1, 0),
          xDirX, xDirY,
          rectBounds.minX, rectBounds.minY, rectBounds.maxX, rectBounds.maxY
        );
      }

      this.#ctx.font = `bold ${FONT_SIZE}px monospace`;

      const xTextMetrics = this.#ctx.measureText('X');
      const xSignYForLabel = signOrDefault(zoom.y);

      const xAxis = {
        x1: xAxisBase.get(0, 0), y1: xAxisBase.get(1, 0),
        x2: xAxisFar.get(0, 0), y2: xAxisFar.get(1, 0),
        arrowTip: xArrowTip,
        dirX: xDirX, dirY: xDirY,
        labelPerpX: -baseYDirX * xSignYForLabel,
        labelPerpY: -baseYDirY * xSignYForLabel,
        textHalfWidth: xTextMetrics.width * 0.5,
        color: '#ff5555',
        label: 'X'
      };

      const yAxisBase = transform(Matrix.newFromArray([[0], [-extent], [1]]));
      const yAxisFar = transform(Matrix.newFromArray([[0], [extent], [1]]));

      let yArrowTip = null;
      let yDirX = 0;
      let yDirY = 0;

      if (signY !== 0) {
        yDirX = baseYDirX * signY;
        yDirY = baseYDirY * signY;

        yArrowTip = this.#intersectLineRect(
          originScreen.get(0, 0), originScreen.get(1, 0),
          yDirX, yDirY,
          rectBounds.minX, rectBounds.minY, rectBounds.maxX, rectBounds.maxY
        );
      }

      const yTextMetrics = this.#ctx.measureText('Y');
      const ySignXForLabel = signOrDefault(zoom.x);

      const yAxis = {
        x1: yAxisBase.get(0, 0), y1: yAxisBase.get(1, 0),
        x2: yAxisFar.get(0, 0), y2: yAxisFar.get(1, 0),
        arrowTip: yArrowTip,
        dirX: yDirX, dirY: yDirY,
        labelPerpX: -baseXDirX * ySignXForLabel,
        labelPerpY: -baseXDirY * ySignXForLabel,
        textHalfWidth: yTextMetrics.width * 0.5,
        color: '#55ff55',
        label: 'Y'
      };
    this.restore();

    return { verticalLines, horizontalLines, xAxis, yAxis };
  }

  #drawAxis(axis, wing) {
    this.#ctx.strokeStyle = axis.color;

    this.#ctx.beginPath();
      this.#ctx.moveTo(axis.x1, axis.y1);
      this.#ctx.lineTo(axis.x2, axis.y2);
    this.#ctx.stroke();

    if (axis.arrowTip === null) {
      return;
    }

    const wingAngle = wing * Math.PI / 180;
    const arrowSize = 12;
    const tipAngle = Math.atan2(axis.dirY, axis.dirX);

    const tipX = axis.arrowTip.x;
    const tipY = axis.arrowTip.y;

    const leftX = tipX - arrowSize * Math.cos(tipAngle - wingAngle);
    const leftY = tipY - arrowSize * Math.sin(tipAngle - wingAngle);

    const rightX = tipX - arrowSize * Math.cos(tipAngle + wingAngle);
    const rightY = tipY - arrowSize * Math.sin(tipAngle + wingAngle);

    this.#ctx.beginPath();
      this.#ctx.moveTo(tipX, tipY);
      this.#ctx.lineTo(leftX, leftY);
    this.#ctx.stroke();

    this.#ctx.beginPath();
      this.#ctx.moveTo(tipX, tipY);
      this.#ctx.lineTo(rightX, rightY);
    this.#ctx.stroke();

    this.#ctx.font = `bold ${FONT_SIZE}px monospace`;
    this.#ctx.fillStyle = axis.color;

    const halfW = axis.textHalfWidth;
    const halfH = FONT_SIZE * 0.5;
    const padding = FONT_SIZE * 0.25;

    const labelOffset = FONT_SIZE;

    let labelX = tipX + axis.labelPerpX * labelOffset;
    let labelY = tipY + axis.labelPerpY * labelOffset;

    labelX = Math.min(Math.max(labelX, halfW + padding), this.#width - halfW - padding);
    labelY = Math.min(Math.max(labelY, halfH + padding), this.#height - halfH - padding);

    this.#ctx.textAlign = 'center';
    this.#ctx.textBaseline = 'middle';

    this.#ctx.fillText(axis.label, labelX, labelY);

    this.#ctx.textAlign = 'start';
    this.#ctx.textBaseline = 'alphabetic';
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

  originX() {
    return this.#origin.x;
  }

  originY() {
    return this.#origin.y;
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
        this.#transformationMatrixOrder = ['T', 'S', 'R']; // Wrong: shape defect
        break;
      case 2:
        this.#transformationMatrixOrder = ['R', 'T', 'S']; // Wrong: position defect
        break;
      case 3:
        this.#transformationMatrixOrder = ['R', 'S', 'T']; // Wrong: position defect, more severe
        break;
      case 4:
        this.#transformationMatrixOrder = ['S', 'T', 'R']; // Wrong: shape and position defects
        break;
      case 5:
        this.#transformationMatrixOrder = ['S', 'R', 'T']; // Wrong: shape and position defects, more severe
        break;
      default:
        this.#transformationMatrixOrder = ['T', 'R', 'S']; // Correct
        break;
    }

    this.#updateLogEntry('before');

    this.#updateTransformationMatrix();

    this.#updateLogEntry('after');

    this.#addLogEntry('Changing transformation matrix order');

    return this;
  }

  save(scope = 'Unknown') {
    const historyEntry = {
      scope: this.#scope,
      base: this.#base.clone(),
      R: this.#R.clone(),
      S: this.#S.clone(),
      T: this.#T.clone()
    };

    this.#transformationMatrixHistory.push(historyEntry);

    this.#scope = `${this.#scope} → ${scope}`;

    this.#updateLogEntry('before');

    this.#base.copyFromMatrix(this.#transformationMatrix);

    this.#R.makeIdentity();
    this.#S.makeIdentity();
    this.#T.makeIdentity();

    this.#updateTransformationMatrix();

    this.#updateLogEntry('after');

    this.#addLogEntry('Saving');

    this.#scope = scope;

    ++this.#logLevel;
  }

  restore() {
    if (this.#transformationMatrixHistory.length === 0) {
      return;
    }

    const historyEntry = this.#transformationMatrixHistory.pop();

    this.#scope = `${this.#scope} → ${historyEntry.scope}`;

    this.#updateLogEntry('before');

    this.#base.copyFromMatrix(historyEntry.base);
    this.#R.copyFromMatrix(historyEntry.R);
    this.#S.copyFromMatrix(historyEntry.S);
    this.#T.copyFromMatrix(historyEntry.T);

    this.#updateTransformationMatrix();

    this.#updateLogEntry('after');

    this.#addLogEntry('Restoring');

    --this.#logLevel;

    this.#scope = historyEntry.scope;
  }

  scale(x = 1, y = 1) {
    if (x === 1 && y === 1) {
      return;
    }

    this.#updateLogEntry('before');

    this.#S.set(0, 0, this.#S.get(0, 0) * x);
    this.#S.set(1, 1, this.#S.get(1, 1) * y);

    this.#updateTransformationMatrix();

    this.#updateLogEntry('after');

    this.#addLogEntry('Scaling');
  }

  rotate(deg = 0) {
    if ((deg % 360) === 0) {
      return;
    }

    const oldAngleRad = Math.acos(this.#R.get(0, 0));
    const rad = deg * Math.PI / 180;
    const newAngleRad = oldAngleRad + rad;

    const cos = Math.cos(newAngleRad);
    const sin = Math.sin(newAngleRad);

    this.#updateLogEntry('before');

    this.#R.set(0, 0, cos);
    this.#R.set(1, 1, cos);

    this.#R.set(0, 1, -sin);
    this.#R.set(1, 0, sin);

    this.#updateTransformationMatrix();

    this.#updateLogEntry('after');

    this.#addLogEntry('Rotating');
  }

  translate(x = 0, y = 0) {
    if (x === 0 && y === 0) {
      return;
    }

    this.#updateLogEntry('before');

    this.#T.set(0, 2, this.#T.get(0, 2) + x);
    this.#T.set(1, 2, this.#T.get(1, 2) + y);

    this.#updateTransformationMatrix();

    this.#updateLogEntry('after');

    this.#addLogEntry('Translating');
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

    if (dump.childElementCount < this.#logs.length) {
      let rows = '';

      for (let i = dump.childElementCount; i < this.#logs.length; ++i) {
        rows += `<div class="row"">`;
          rows += `<div class="spacer" id="dump-spacer-${i}"></div>`;
          rows += `<div class="content">`;
            rows += `<div class="reason" id="dump-reason-${i}"></div>`;
            rows += '<div class="header">Before</div>';
            rows += '<div class="content-base content-before">';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">Base</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-before-base-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">R</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-before-r-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">S</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-before-s-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">T</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-before-t-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">Transformation</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-before-transformation-${i}"></pre></div>`;
              rows += '</div>';
            rows += '</div>';
            rows += '<div class="header">After</div>';
            rows += '<div class="content-base content-after">';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">Base</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-after-base-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">R</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-after-r-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">S</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-after-s-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">T</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-after-t-${i}"></pre></div>`;
              rows += '</div>';
              rows += '<div class="matrix-dump">';
                rows += '<div class="matrix-dump-header">Transformation</div>';
                rows += `<div class="matrix-dump-content"><pre id="dump-after-transformation-${i}"></pre></div>`;
              rows += '</div>';
            rows += '</div>';
          rows += '</div>'
        rows += '</div>';
      }

      dump.innerHTML += rows;
    }
    else if (dump.childElementCount > this.#logs.length) {
      while (dump.childElementCount > this.#logs.length) {
        dump.removeChild(dump.children[dump.childElementCount - 1]);
      }
    }

    for (let i = 0; i < this.#logs.length; ++i) {
      const logEntry = this.#logs[i];

      const spacer = document.getElementById(`dump-spacer-${i}`);
      const reason = document.getElementById(`dump-reason-${i}`);
      const beforeBase = document.getElementById(`dump-before-base-${i}`);
      const beforeR = document.getElementById(`dump-before-r-${i}`);
      const beforeS = document.getElementById(`dump-before-s-${i}`);
      const beforeT = document.getElementById(`dump-before-t-${i}`);
      const beforeTransformation = document.getElementById(`dump-before-transformation-${i}`);
      const afterBase = document.getElementById(`dump-after-base-${i}`);
      const afterR = document.getElementById(`dump-after-r-${i}`);
      const afterS = document.getElementById(`dump-after-s-${i}`);
      const afterT = document.getElementById(`dump-after-t-${i}`);
      const afterTransformation = document.getElementById(`dump-after-transformation-${i}`);

      let spacerContent = '';

      for (let j = 0; j < logEntry.level; ++j) {
        spacerContent += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      }

      spacer.innerHTML = spacerContent;

      reason.innerHTML = `${logEntry.reason} (${logEntry.scope})`;

      beforeBase.innerHTML = logEntry.before.base;
      beforeR.innerHTML = logEntry.before.R;
      beforeS.innerHTML = logEntry.before.S;
      beforeT.innerHTML = logEntry.before.T;
      beforeTransformation.innerHTML = logEntry.before.transformationMatrix;

      afterBase.innerHTML = logEntry.after.base;
      afterR.innerHTML = logEntry.after.R;
      afterS.innerHTML = logEntry.after.S;
      afterT.innerHTML = logEntry.after.T;
      afterTransformation.innerHTML = logEntry.after.transformationMatrix;
    }
  }

  drawBackground() {
    this.#ctx.fillStyle = "#313131";

    this.#ctx.fillRect(0, 0, this.#width, this.#height);
  }

  drawGrid(step = 0, wing = 25, grid = true, axes = true) {
    if (isValidNumber(step) === false || step < 1) {
      step = 50;
    }

    if (isValidNumber(wing) === false) {
      wing = 25;
    }

    if (typeof grid !== 'boolean') {
      grid = true;
    }

    if (typeof axes !== 'boolean') {
      axes = true;
    }

    if (grid === false && axes === false) {
      return;
    }

    const zoom = this.#zoom;
    const rotation = this.#rotation;
    const origin = this.#origin;

    const cacheKey = `${origin.x}|${origin.y}|${zoom.x}|${zoom.y}|${rotation}|${step}|${wing}|${this.#width}|${this.#height}`;

    if (this.#gridCache === null || this.#gridCache.key !== cacheKey) {
      this.#gridCache = {
        key: cacheKey,
        lines: this.#computeGridLines(step)
      };
    }

    const { verticalLines, horizontalLines, xAxis, yAxis } = this.#gridCache.lines;

    if (grid === true) {
      this.#ctx.lineWidth = 1;
      this.#ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";

      this.#ctx.beginPath();
        for (const line of verticalLines) {
          this.#ctx.moveTo(line.x1, line.y1);
          this.#ctx.lineTo(line.x2, line.y2);
        }

        for (const line of horizontalLines) {
          this.#ctx.moveTo(line.x1, line.y1);
          this.#ctx.lineTo(line.x2, line.y2);
        }
      this.#ctx.stroke();
    }

    if (axes === true) {
      this.#ctx.lineWidth = 2;

      this.#drawAxis(xAxis, wing);
      this.#drawAxis(yAxis, wing);
    }
  }

  drawVector(vector, wing = 45) {
    let newVectorOrigin;
    let newVector;
    let newVectorTip1;
    let newVectorTip2;

    this.save('Vector');
      this.translate(this.#origin.x, this.#origin.y);

      newVectorOrigin = this.#applyMatrices([this.#transformationMatrix], ORIGIN);
      newVector = this.#applyMatrices([this.#transformationMatrix], vector);

      this.#ctx.lineWidth = 2 * Math.min(Math.abs(this.#zoom.x), Math.abs(this.#zoom.y));
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
      this.rotate(wing);

      newVectorTip1 = this.#applyMatrices([this.#transformationMatrix], vectorTip);

      this.rotate(-wing * 2);

      newVectorTip2 = this.#applyMatrices([this.#transformationMatrix], vectorTip);
    this.restore();

    this.#ctx.beginPath();
      this.#ctx.moveTo(newVector.get(0, 0), newVector.get(1, 0));
      this.#ctx.lineTo(newVectorTip1.get(0, 0), newVectorTip1.get(1, 0));
    this.#ctx.stroke();

    this.#ctx.beginPath();
      this.#ctx.moveTo(newVector.get(0, 0), newVector.get(1, 0));
      this.#ctx.lineTo(newVectorTip2.get(0, 0), newVectorTip2.get(1, 0));
    this.#ctx.stroke();

    MatrixPool.release(newVectorOrigin);
    MatrixPool.release(newVector);
    MatrixPool.release(newVectorTip1);
    MatrixPool.release(newVectorTip2);
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
    this.#ctx.lineWidth = Math.min(Math.abs(this.#zoom.x), Math.abs(this.#zoom.y));
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

        MatrixPool.release(newPoint);
      }
    this.#ctx.closePath();

    this.#ctx.fill();
    this.#ctx.stroke();
  }

  drawInfo(speed, fps) {
    this.#ctx.font = `${FONT_SIZE}px monospace`;
    this.#ctx.fillStyle = '#ffffff';

    this.#ctx.fillText(`FPS: ${fps.toFixed(2)}`, 10, 20);
    this.#ctx.fillText(`Speed: ${speed.toFixed(2)}`, 10, 20 + FONT_SIZE + LINE_GAP);
    this.#ctx.fillText(`Origin: (${this.#origin.x.toFixed(2)}, ${this.#origin.y.toFixed(2)})`, 10, 20 + (FONT_SIZE + LINE_GAP) * 2);
    this.#ctx.fillText(`Rotation: ${this.#rotation.toFixed(2)}`, 10, 20 + (FONT_SIZE + LINE_GAP) * 3);
    this.#ctx.fillText(`Zoom: (${this.#zoom.x.toFixed(2)}, ${this.#zoom.y.toFixed(2)})`, 10, 20 + (FONT_SIZE + LINE_GAP) * 4);
  }
}
