const ANCHOR_TOP =    0b001000;
const ANCHOR_MIDDLE = 0b010000;
const ANCHOR_BOTTOM = 0b100000;
const ANCHOR_LEFT =   0b000001;
const ANCHOR_CENTER = 0b000010;
const ANCHOR_RIGHT  = 0b000100;
const ANCHOR_TOP_LEFT = ANCHOR_TOP | ANCHOR_LEFT;
const ANCHOR_TOP_CENTER = ANCHOR_TOP | ANCHOR_CENTER;
const ANCHOR_TOP_RIGHT = ANCHOR_TOP | ANCHOR_RIGHT;
const ANCHOR_MIDDLE_LEFT = ANCHOR_MIDDLE | ANCHOR_LEFT;
const ANCHOR_MIDDLE_CENTER = ANCHOR_MIDDLE | ANCHOR_CENTER;
const ANCHOR_MIDDLE_RIGHT = ANCHOR_MIDDLE | ANCHOR_RIGHT;
const ANCHOR_BOTTOM_LEFT = ANCHOR_BOTTOM | ANCHOR_LEFT;
const ANCHOR_BOTTOM_CENTER = ANCHOR_BOTTOM | ANCHOR_CENTER;
const ANCHOR_BOTTOM_RIGHT = ANCHOR_BOTTOM | ANCHOR_RIGHT;
const ANCHORS = [
  ANCHOR_TOP_LEFT,    ANCHOR_TOP_CENTER,    ANCHOR_TOP_RIGHT,
  ANCHOR_MIDDLE_LEFT, ANCHOR_MIDDLE_CENTER, ANCHOR_MIDDLE_RIGHT,
  ANCHOR_BOTTOM_LEFT, ANCHOR_BOTTOM_CENTER, ANCHOR_BOTTOM_RIGHT
];

class Figure {
  #anchor = ANCHOR_MIDDLE_CENTER;
  #position = { x: 0, y: 0 };
  #size = { w: 0, h: 0 };
  #offset = { x: 0, y: 0 };
  #rotation = 0;
  #strokeColor = '#ffffff';
  #fillColor = '#ff0000';
  #points = [];

  constructor(x, y, strokeColor, fillColor) {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    if (typeof strokeColor !== 'string') {
      throw new Error('Invalid stroke color');
    }

    if (typeof fillColor !== 'string') {
      throw new Error('Invalid fill color');
    }

    this.#position.x = x;
    this.#position.y = y;

    this.#strokeColor = strokeColor;
    this.#fillColor = fillColor;
  }

  anchor() {
    return this.#anchor;
  }

  setAnchor(anchor) {
    if (ANCHORS.includes(anchor) === false) {
      return;
    }

    this.#anchor = anchor;
  }

  position() {
    return {
      ...this.#position
    };
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

  size() {
    return {
      ...this.#size
    };
  }

  setSize(w, h) {
    if (isValidNumber(w) === false || w <= 0) {
      throw new Error('Invalid w');
    }

    if (isValidNumber(h) === false || h <= 0) {
      throw new Error('Invalid h');
    }

    this.#size.w = w;
    this.#size.h = h;
  }

  offset() {
    return {
      ...this.#offset
    };
  }

  setOffset(x, y) {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    this.#offset.x = x;
    this.#offset.y = y;
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

  points() {
    let translateX = this.#offset.x;
    let translateY = this.#offset.y;

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

    const translateMatrix = Matrix.newFromArray([[translateX], [translateY], [0]]);

    const points = [];

    for (const point of this.#points) {
      const newPoint = point.clone();
      
      newPoint.addMatrix(translateMatrix);

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
}

class Rectangle extends Figure {
  constructor(x, y, w, h, strokeColor = '#ffffff', fillColor = '#ff0000') {
    super(x, y, strokeColor, fillColor);

    this.setSize(w, h);

    const topLeft = Matrix.newFromArray([[-w * 0.5], [-h * 0.5], [1]]);
    const topRight = Matrix.newFromArray([[w * 0.5], [-h * 0.5], [1]]);
    const bottomLeft = Matrix.newFromArray([[-w * 0.5], [h * 0.5], [1]]);
    const bottomRight = Matrix.newFromArray([[w * 0.5], [h * 0.5], [1]]);

    // Add points clockwise
    this.addPoint(topLeft);
    this.addPoint(topRight);
    this.addPoint(bottomRight);
    this.addPoint(bottomLeft);
  }

  draw(ctx) {
    ctx.save();
      ctx.translate(this.position().x, this.position().y);
      ctx.rotate(this.rotation());
      ctx.drawPolygon(
        this.points(),
        this.strokeColor(),
        this.fillColor()
      );
    ctx.restore();
  }
}

class Star extends Figure {
  constructor(x, y, n, or, ir, strokeColor = '#00ffff', fillColor = '#ffff00') {
    super(x, y, strokeColor, fillColor);

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

      const point = Matrix.newFromArray([[x], [y], [1]]);

      this.addPoint(point);
    }

    const w = right - left;
    const h = bottom - top;

    this.setSize(w, h);
  }

  draw(ctx) {
    ctx.save();
      ctx.translate(this.position().x, this.position().y);
      ctx.rotate(this.rotation());
      ctx.drawPolygon(
        this.points(),
        this.strokeColor(),
        this.fillColor()
      );
    ctx.restore();
  }
}
