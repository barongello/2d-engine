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

class Square {
  #anchor = ANCHOR_MIDDLE_CENTER;
  #position = { x: 0, y: 0 };
  #size = { w: 0, h: 0 };
  #offset = { x: 0, y: 0 };
  #rotation = 0;
  #strokeColor = '#ffffff';
  #fillColor = '#ff0000';

  #top() {
    let y = this.#offset.y;

    if ((this.#anchor & ANCHOR_MIDDLE) !== 0) {
      y -= this.#size.h * 0.5;
    }
    else if ((this.#anchor & ANCHOR_BOTTOM) !== 0) {
      y -= this.#size.h;
    }

    return y;
  }

  #bottom() {
    let y = this.#offset.y;

    if ((this.#anchor & ANCHOR_TOP) !== 0) {
      y += this.#size.h;
    }
    else if ((this.#anchor & ANCHOR_MIDDLE) !== 0) {
      y += this.#size.h * 0.5;
    }

    return y;
  }

  #left() {
    let x = this.#offset.x;

    if ((this.#anchor & ANCHOR_CENTER) !== 0) {
      x -= this.#size.w * 0.5;
    }
    else if ((this.#anchor & ANCHOR_RIGHT) !== 0) {
      x -= this.#size.w;
    }

    return x;
  }

  #right() {
    let x = this.#offset.x;

    if ((this.#anchor & ANCHOR_LEFT) !== 0) {
      x += this.#size.w;
    }
    else if ((this.#anchor & ANCHOR_CENTER) !== 0) {
      x += this.#size.w * 0.5;
    }

    return x;
  }

  constructor(x, y, w, h, strokeColor = '#ffffff', fillColor = '#ff0000') {
    if (isValidNumber(x) === false) {
      throw new Error('Invalid x');
    }

    if (isValidNumber(y) === false) {
      throw new Error('Invalid y');
    }

    if (isValidNumber(w) === false || w < 0) {
      throw new Error('Invalid w');
    }

    if (isValidNumber(h) === false || h < 0) {
      throw new Error('Invalid h');
    }

    if (typeof strokeColor !== 'string') {
      throw new Error('Invalid stroke color');
    }

    if (typeof fillColor !== 'string') {
      throw new Error('Invalid fill color');
    }

    this.#position.x = x;
    this.#position.y = y;

    this.#size.w = w;
    this.#size.h = h;

    this.#strokeColor = strokeColor;
    this.#fillColor = fillColor;
  }

  topLeft() {
    const top = this.#top();
    const left = this.#left();

    return Matrix.newFromArray([[left], [top], [1]]);
  }

  topRight() {
    const top = this.#top();
    const right = this.#right();

    return Matrix.newFromArray([[right], [top], [1]]);
  }

  bottomLeft() {
    const bottom = this.#bottom();
    const left = this.#left();

    return Matrix.newFromArray([[left], [bottom], [1]]);
  }

  bottomRight() {
    const bottom = this.#bottom();
    const right = this.#right();

    return Matrix.newFromArray([[right], [bottom], [1]]);
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

  draw(ctx) {
    ctx.save();
      ctx.translate(this.#position.x, this.#position.y);
      ctx.rotate(this.#rotation);
      ctx.drawPolygon(
        [
          this.topLeft(),
          this.bottomLeft(),
          this.bottomRight(),
          this.topRight()
        ],
        this.#strokeColor,
        this.#fillColor
      );
    ctx.restore();
  }
}
