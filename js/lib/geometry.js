const ANCHOR_TOP    = 0b001_000;
const ANCHOR_MIDDLE = 0b010_000;
const ANCHOR_BOTTOM = 0b100_000;
const ANCHOR_LEFT   = 0b000_001;
const ANCHOR_CENTER = 0b000_010;
const ANCHOR_RIGHT  = 0b000_100;

const ANCHORS = Object.freeze({
  TOP_LEFT:      0b001_001,
  TOP_CENTER:    0b001_010,
  TOP_RIGHT:     0b001_100,
  MIDDLE_LEFT:   0b010_001,
  MIDDLE_CENTER: 0b010_010,
  MIDDLE_RIGHT:  0b010_100,
  BOTTOM_LEFT:   0b100_001,
  BOTTOM_CENTER: 0b100_010,
  BOTTOM_RIGHT:  0b100_100
});

class BaseObject {
  #position = {
    x: 0,
    y: 0
  };
  #rotation = 0;
  #scale = {
    x: 1,
    y: 1
  };
  #name = 'Object';
  #visible = true;

  constructor(name, x, y) {
    this.setName(name);
    this.setPosition(x, y);
  }

  position() {
    return {
      ...this.#position
    };
  }

  positionX() {
    return this.#position.x;
  }

  positionY() {
    return this.#position.y;
  }

  setPosition(x, y) {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    this.#position.x = x;
    this.#position.y = y;
  }

  rotation() {
    return this.#rotation;
  }

  setRotation(angle) {
    if (isValidNumber(angle) === false) {
      throw new Error('Invalid angle');
    }

    this.#rotation = angle % 360;
  }

  scale() {
    return {
      ...this.#scale
    };
  }

  scaleX() {
    return this.#scale.x;
  }

  scaleY() {
    return this.#scale.y;
  }

  setScale(x, y) {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    this.#scale.x = x;
    this.#scale.y = y;
  }

  name() {
    return this.#name;
  }

  setName(name) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Invalid name');
    }

    this.#name = name;
  }

  visible() {
    return this.#visible;
  }

  setVisible(visible) {
    if (typeof visible !== 'boolean') {
      throw new Error('Invalid visible');
    }

    this.#visible = visible;
  }
}

class Container extends BaseObject {
  #children = [];

  constructor(name, x, y) {
    super(name, x, y);
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

  draw(ctx) {
    if (ctx instanceof Context === false) {
      throw new Error('Invalid ctx');
    }

    if (this.visible() === false) {
      return;
    }

    ctx.save(this.name());
      ctx.translate(this.positionX(), this.positionY());
      ctx.rotate(this.rotation());
      ctx.scale(this.scaleX(), this.scaleY());

      for (const child of this.#children) {
        child.draw(ctx);
      }
    ctx.restore();
  }
}

class Figure extends BaseObject {
  #anchor = ANCHORS.MIDDLE_CENTER;
  #size = {
    w: 0,
    h: 0
  };
  #strokeColor = '#ffffff';
  #fillColor = '#ff0000';
  #points = [];
  #pointsScratch = [];

  #releasePoints(points) {
    for (const point of points) {
      MatrixPool.release(point);
    }

    points.length = 0;
  }

  constructor(name, x, y, strokeColor, fillColor) {
    super(name, x, y);

    if (typeof strokeColor !== 'string') {
      throw new Error('Invalid stroke color');
    }

    if (typeof fillColor !== 'string') {
      throw new Error('Invalid fill color');
    }

    this.#strokeColor = strokeColor;
    this.#fillColor = fillColor;
  }

  destroy() {
    this.#releasePoints(this.#points);
  }

  anchor() {
    return this.#anchor;
  }

  setAnchor(anchor) {
    if (Object.values(ANCHORS).includes(anchor) === false) {
      return;
    }

    this.#anchor = anchor;
  }

  size() {
    return {
      ...this.#size
    };
  }

  setSize(w, h) {
    if (isValidNumber(w) === false || w < 0) {
      throw new Error('Invalid w');
    }

    if (isValidNumber(h) === false || h < 0) {
      throw new Error('Invalid h');
    }

    this.#size.w = w;
    this.#size.h = h;
  }

  strokeColor() {
    return this.#strokeColor;
  }

  setStrokeColor(color) {
    if (typeof color !== 'string') {
      throw new Error('Invalid color');
    }

    this.#strokeColor = color;
  }

  fillColor() {
    return this.#fillColor;
  }

  setFillColor(color) {
    if (typeof color !== 'string') {
      throw new Error('Invalid color');
    }

    this.#fillColor = color;
  }

  rawPoints() {
    return this.#points;
  }

  points(out = []) {
    let translateX = 0;
    let translateY = 0;

    if ((this.#anchor & ANCHOR_TOP) !== 0) {
      translateY += this.#size.h * 0.5;
    }
    else if ((this.#anchor & ANCHOR_BOTTOM) !== 0) {
      translateY -= this.#size.h * 0.5;
    }

    if ((this.#anchor & ANCHOR_LEFT) !== 0) {
      translateX += this.#size.w * 0.5;
    }
    else if ((this.#anchor & ANCHOR_RIGHT) !== 0) {
      translateX -= this.#size.w * 0.5;
    }

    const points = out;

    points.length = 0;

    for (const point of this.#points) {
      const newPoint = MatrixPool.acquireVector3();

      newPoint.set(0, 0, point.get(0, 0) + translateX);
      newPoint.set(1, 0, point.get(1, 0) + translateY);
      newPoint.set(2, 0, point.get(2, 0));

      points.push(newPoint);
    }

    return points;
  }

  addPoint(point) {
    if (point instanceof Matrix === false) {
      throw new Error('Invalid point');
    }

    this.#points.push(point);
  }

  draw(ctx) {
    if (ctx instanceof Context === false) {
      throw new Error('Invalid ctx');
    }

    if (this.visible() === false) {
      return;
    }

    ctx.save(this.name());
      ctx.translate(this.positionX(), this.positionY());
      ctx.rotate(this.rotation());
      ctx.scale(this.scaleX(), this.scaleY());

      const points = this.points(this.#pointsScratch);

      ctx.drawPolygon(points, this.strokeColor(), this.fillColor());

      this.#releasePoints(points);
    ctx.restore();
  }
}

class Vector extends Figure {
  #pointsScratch = [];
  #lineWidth = 2;
  #wingSize = 0.15;
  #wingAngle = 45;

  constructor(name, x, y, w, h, strokeColor = '#ffffff') {
    super(name, x, y, strokeColor, 'transparent');

    super.setSize(Math.abs(w), Math.abs(h));

    const origin = MatrixPool.acquireVector3();

    origin.set(0, 0, 0);
    origin.set(1, 0, 0);
    origin.set(2, 0, 1);

    this.addPoint(origin);

    const tip = MatrixPool.acquireVector3();

    tip.set(0, 0, w);
    tip.set(1, 0, h);
    tip.set(2, 0, 1);

    this.addPoint(tip);
  }

  setAnchor(anchor) {
    throw new Error('Vector does not support anchors; it is always anchored at its origin point');
  }

  setSize(w, h) {
    super.setSize(Math.abs(w), Math.abs(h));

    const points = this.rawPoints();
    const tip = points[1];

    tip.set(0, 0, w);
    tip.set(1, 0, h);
    tip.set(2, 0, 1);
  }

  lineWidth() {
    return this.#lineWidth;
  }

  setLineWidth(width) {
    if (isValidNumber(width) === false) {
      throw new Error('Invalid width');
    }

    this.#lineWidth = width;
  }

  wingSize() {
    return this.#wingSize;
  }

  setWingSize(size) {
    if (isValidNumber(size) === false) {
      throw new Error('Invalid size');
    }

    this.#wingSize = size;
  }

  wingAngle() {
    return this.#wingAngle;
  }

  setWingAngle(angle) {
    if (isValidNumber(angle) === false) {
      throw new Error('Invalid angle');
    }

    this.#wingAngle = angle;
  }

  draw(ctx) {
    if (ctx instanceof Context === false) {
      throw new Error('Invalid ctx');
    }

    if (this.visible() === false) {
      return;
    }

    const wingAngle = this.#wingAngle * Math.PI / 180;

    const points = this.points(this.#pointsScratch);

    const origin = points[0];
    const tip = points[1];
    const arrowSize = Math.hypot(tip.get(0, 0), tip.get(1, 0)) * this.#wingSize;
    const tipAngle = Math.atan2(tip.get(1, 0), tip.get(0, 0));

    const leftX = tip.get(0, 0) - arrowSize * Math.cos(tipAngle - wingAngle);
    const leftY = tip.get(1, 0) - arrowSize * Math.sin(tipAngle - wingAngle);

    const rightX = tip.get(0, 0) - arrowSize * Math.cos(tipAngle + wingAngle);
    const rightY = tip.get(1, 0) - arrowSize * Math.sin(tipAngle + wingAngle);

    const tipVector1 = MatrixPool.acquireVector3();

    tipVector1.set(0, 0, leftX);
    tipVector1.set(1, 0, leftY);
    tipVector1.set(2, 0, 1);

    const tipVector2 = MatrixPool.acquireVector3();

    tipVector2.set(0, 0, rightX);
    tipVector2.set(1, 0, rightY);
    tipVector2.set(2, 0, 1);

    ctx.save(this.name());
      ctx.translate(this.positionX(), this.positionY());
      ctx.rotate(this.rotation());
      ctx.scale(this.scaleX(), this.scaleY());

      ctx.drawLine(origin, tip, this.#lineWidth, this.strokeColor());
      ctx.drawLine(tip, tipVector1, this.#lineWidth, this.strokeColor());
      ctx.drawLine(tip, tipVector2, this.#lineWidth, this.strokeColor());
    ctx.restore();

    MatrixPool.release(tipVector1);
    MatrixPool.release(tipVector2);

    for (const point of points) {
      MatrixPool.release(point);
    }
  }
}

class Rectangle extends Figure {
  constructor(name, x, y, w, h, strokeColor = '#ffffff', fillColor = '#ff0000') {
    super(name, x, y, strokeColor, fillColor);

    this.setSize(w, h);

    const topLeft = MatrixPool.acquireVector3();

    topLeft.set(0, 0, -w * 0.5);
    topLeft.set(1, 0, -h * 0.5);
    topLeft.set(2, 0, 1);

    const topRight = MatrixPool.acquireVector3();

    topRight.set(0, 0, w * 0.5);
    topRight.set(1, 0, -h * 0.5);
    topRight.set(2, 0, 1);

    const bottomLeft = MatrixPool.acquireVector3();

    bottomLeft.set(0, 0, -w * 0.5);
    bottomLeft.set(1, 0, h * 0.5);
    bottomLeft.set(2, 0, 1);

    const bottomRight = MatrixPool.acquireVector3();

    bottomRight.set(0, 0, w * 0.5);
    bottomRight.set(1, 0, h * 0.5);
    bottomRight.set(2, 0, 1);

    // Add points clockwise
    this.addPoint(topLeft);
    this.addPoint(topRight);
    this.addPoint(bottomRight);
    this.addPoint(bottomLeft);
  }
}

class Star extends Figure {
  constructor(name, x, y, n, or, ir, strokeColor = '#00ffff', fillColor = '#ffff00') {
    super(name, x, y, strokeColor, fillColor);

    if (isValidInteger(n) === false || n <= 0) {
      throw new Error('Invalid n');
    }

    if (isValidNumber(or) === false || or < 0) {
      throw new Error('Invalid or');
    }

    if (isValidNumber(ir) === false || ir < 0) {
      throw new Error('Invalid ir');
    }

    let top = Infinity;
    let left = Infinity;
    let bottom = -Infinity;
    let right = -Infinity;

    // Add points clockwise
    for (let i = 0; i < 2 * n; ++i) {
      const angle = -Math.PI * 0.5 + i * Math.PI / n;
      const r = (i & 1) === 0 ? or : ir;

      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);

      if (x < left) {
        left = x;
      }

      if (x > right) {
        right = x;
      }

      if (y < top) {
        top = y;
      }

      if (y > bottom) {
        bottom = y;
      }

      const point = MatrixPool.acquireVector3();

      point.set(0, 0, x);
      point.set(1, 0, y);
      point.set(2, 0, 1);

      this.addPoint(point);
    }

    const w = right - left;
    const h = bottom - top;

    this.setSize(w, h);
  }
}
