class Matrix {
  #rows = 1;
  #cols = 1;
  #matrix = [[1]];

  static #helperCalculateDeterminant(array) {
    if (array.length === 1) {
      return array[0][0];
    }

    if (array.length === 2) {
      return array[0][0] * array[1][1] - array[0][1] * array[1][0];
    }

    let determinant = 0;

    for (let j = 0; j < array.length; ++j) {
      const subArray = array.slice(1).map(row => 
        row.filter((_, colIndex) => colIndex !== j)
      );

      const sign = (j & 1) === 0 ? 1 : -1;

      determinant += sign * array[0][j] * Matrix.#helperCalculateDeterminant(subArray);
    }

    return determinant;    
  }

  static new(rows, cols) {
    return new Matrix(rows, cols);
  }

  static newSquare(size) {
    return Matrix.new(size, size);
  }

  static newIdentity(size) {
    return Matrix.newSquare(size).makeIdentity();
  }

  static newFromArray(array) {
    if (Array.isArray(array) === false) {
      console.error('The array is not a valid array');

      return void 0;
    }

    const rows = array.length;

    if (rows < 1) {
      console.error('The array is empty');

      return void 0;
    }

    const cols = array[0].length;

    if (cols < 1) {
      console.error('The array\'s first row is empty');

      return void 0;
    }

    const newMatrix = Matrix.new(rows, cols);

    for (let i = 0; i < array.length; ++i) {
      const row = array[i];
      const rowCols = row.length;

      if (rowCols !== cols) {
        console.error(`The array has ${cols} cols in first row and has ${rowCols} cols in the ${i} row`);

        return void 0;
      }

      for (let j = 0; j < rowCols; ++j) {
        const elem = row[j];

        if (isValidNumber(elem) === false) {
          console.error(`The array row ${i} column ${j} has an invalid number`);

          return void 0;
        }

        newMatrix.set(i, j, elem);
      }
    }

    return newMatrix;
  }

  static newFromMatrix(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return void 0;
    }

    return matrix.clone();
  }

  static dump(matrix, toString = false) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return;
    }

    matrix.dump(toString);
  }

  static getArray(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return void 0;
    }

    return matrix.getArray();
  }

  static getRow(matrix, row) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return void 0;
    }

    return matrix.getRow(row);
  }

  static getCol(matrix, col) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return void 0;
    }

    return matrix.getCol(col);
  }

  static get(matrix, i, j) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return void 0;
    }

    return matrix.get(i, j);
  }

  static determinant(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return NaN;
    }

    return matrix.determinant();
  }

  static transpose(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return void 0;
    }

    return matrix.clone().transpose();
  }

  static inverse(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('Matrix is invalid');

      return void 0;
    }

    return matrix.clone().inverse();
  }

  static addMatrix(matrixA, matrixB) {
    if (matrixA instanceof Matrix === false) {
      console.error('Matrix A is invalid');

      return void 0;
    }

    if (matrixB instanceof Matrix === false) {
      console.error('Matrix B is invalid');

      return void 0;
    }

    return matrixA.clone().addMatrix(matrixB);
  }

  static addScalar(matrix, scalar) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return void 0;
    }

    return matrix.clone().addScalar(scalar);
  }

  static addScalarIdentity(matrix, scalar) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return void 0;
    }

    return matrix.clone().addScalarIdentity(scalar);
  }

  static subMatrix(matrixA, matrixB) {
    if (matrixA instanceof Matrix === false) {
      console.error('Matrix A is invalid');

      return void 0;
    }

    if (matrixB instanceof Matrix === false) {
      console.error('Matrix B is invalid');

      return void 0;
    }

    return matrixA.clone().subMatrix(matrixB);
  }

  static subScalar(matrix, scalar) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return void 0;
    }

    return matrix.clone().subScalar(scalar);
  }

  static subScalarIdentity(matrix, scalar) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return void 0;
    }

    return matrix.clone().subScalarIdentity(scalar);
  }

  static multiplyScalar(matrix, scalar) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return void 0;
    }

    return matrix.clone().multiplyScalar(scalar);
  }

  static multiplyMatrices(matrixA, matrixB) {
    if (matrixA instanceof Matrix === false) {
      console.error('Matrix A is invalid');

      return void 0;
    }

    if (matrixB instanceof Matrix === false) {
      console.error('Matrix B is invalid');

      return void 0;
    }

    const aCols = matrixA.cols();
    const bRows = matrixB.rows();

    if (aCols !== bRows) {
      console.error(`Matrix A has ${aCols} cols and matrix B has ${bRows} rows`);

      return Matrix.newSquare(1);
    }

    const aRows = matrixA.rows();
    const bCols = matrixB.cols();

    const newMatrix = Matrix.new(aRows, bCols);

    for (let aRow = 0; aRow < aRows; ++aRow) {
      for (let bCol = 0; bCol < bCols; ++bCol) {
        let sum = 0;

        for (let i = 0; i < aCols; ++i) {
          const aElem = matrixA.get(aRow, i);
          const bElem = matrixB.get(i, bCol);
          const elemsProduct = aElem * bElem;

          sum += elemsProduct;
        }

        newMatrix.set(aRow, bCol, sum);
      }
    }

    return newMatrix;
  }

  constructor(rows, cols) {
    if (isValidInteger(rows) === false || rows < 1) {
      rows = 1;
    }

    if (isValidInteger(cols) === false || cols < 1) {
      cols = 1;
    }

    this.#rows = rows;
    this.#cols = cols;
    this.#matrix = [];

    for (let i = 0; i < rows; ++i) {
      const row = [];

      for (let j = 0; j < cols; ++j) {
        row.push(0);
      }

      this.#matrix.push(row);
    }
  }

  rows() {
    return this.#rows;
  }

  cols() {
    return this.#cols;
  }

  dump(toString = false) {
    const lines = [];

    for (let i = 0; i < this.#rows; ++i) {
      const row = this.#matrix[i];
      const elements = [];

      for (const elem of row) {
        elements.push(elem.toFixed(3).padStart(8, ' '));
      }

      let line = '';

      if (i === 0) {
        line += '|¯';
      }
      else if (i === this.#rows - 1) {
        line += '|_';
      }
      else {
        line += '| ';
      }

      line += ' '
      line += elements.join(', ');
      line += ' ';

      if (i === 0) {
        line += '¯|';
      }
      else if (i === this.#rows - 1) {
        line += '_|';
      }
      else {
        line += ' |';
      }

      lines.push(line);
    }

    const dump = lines.join('\n');

    if (toString === true) {
      return dump;
    }

    console.log(dump);

    return this;
  }

  getArray() {
    const newArray = [];

    for (let i = 0; i < this.#rows; ++i) {
      const newRow = [...this.#matrix[i]];

      newArray.push(newRow);
    }

    return newArray;
  }

  getRow(row) {
    if (isValidInteger(row) === false || row < 0 || row >= this.#rows) {
      console.error('The row is invalid');

      return void 0;
    }

    return [...this.#matrix[i]];
  }

  getCol(col) {
    if (isValidInteger(col) === false || col < 0 || col >= this.#cols) {
      console.error('The col is invalid');

      return void 0;
    }

    return this.#matrix[i].map(row => row[col]);
  }

  get(row, col) {
    if (isValidInteger(row) === false || row < 0 || row >= this.#rows) {
      console.error('The row is invalid');

      return void 0;
    }

    if (isValidInteger(col) === false || col < 0 || col >= this.#cols) {
      console.error('The col is invalid');

      return void 0;
    }

    return this.#matrix[row][col];
  }

  set(row, col, elem) {
    if (isValidInteger(row) === false || row < 0 || row >= this.#rows) {
      console.error('The row is invalid');

      return this;
    }

    if (isValidInteger(col) === false || col < 0 || col >= this.#cols) {
      console.error('The col is invalid');

      return this;
    }

    if (isValidNumber(elem) === false) {
      console.error('The elem is invalid');

      return this;
    }

    this.#matrix[row][col] = elem;

    return this;
  }

  clone() {
    const newMatrix = Matrix.new(this.#rows, this.#cols);

    for (let i = 0; i < this.#rows; ++i) {
      for (let j = 0; j < this.#cols; ++j) {
        newMatrix.set(i, j, this.#matrix[i][j]);
      }
    }

    return newMatrix;
  }

  copyFromArray(array) {
    const newMatrix = Matrix.newFromArray(array);

    this.copyFromMatrix(newMatrix);

    return this;
  }

  copyFromMatrix(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return this;
    }

    if (this.#rows !== matrix.rows()) {
      console.error(`This matrix has ${this.#rows} rows and the right-hand matrix has ${matrix.rows()} rows`);

      return this;
    }

    if (this.#cols !== matrix.cols()) {
      console.error(`This matrix has ${this.#cols} cols and the right-hand matrix has ${matrix.cols()} cols`);

      return this;
    }

    for (let i = 0; i < this.#rows; ++i) {
      for (let j = 0; j < this.#cols; ++j) {
        const elem = matrix.get(i, j);

        this.#matrix[i][j] = elem;
      }
    }

    return this;
  }

  makeIdentity() {
    if (this.#rows !== this.#cols) {
      console.error('This matrix is not rectangle');

      return this;
    }

    for (let i = 0; i < this.#rows; ++i) {
      for (let j = 0; j < this.#cols; ++ j) {
        this.#matrix[i][j] = i === j ? 1 : 0;
      }
    }

    return this;
  }

  determinant() {
    if (this.#rows !== this.#cols) {
      console.error('This matrix is not rectangle');

      return 0;
    }

    return Matrix.#helperCalculateDeterminant(this.#matrix);
  }

  transpose() {
    [this.#rows, this.#cols] = [this.#cols, this.#rows];

    this.#matrix = this.#matrix[0].map((_, colIndex) => this.#matrix.map(row => row[colIndex]));

    return this;
  }

  inverse() {
    if (this.#rows !== this.#cols) {
      console.error('This matrix is not rectangle');

      return this;
    }

    const n = this.#rows;

    const aug = this.#matrix.map((row, i) => [
      ...row,
      ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    ]);

    for (let i = 0; i < n; ++i) {
      let pivot = aug[i][i];

      if (Math.abs(pivot) === 0) {
        let swapped = false;

        for (let r = i + 1; r < n; r++) {
          if (Math.abs(aug[r][i]) === 0) {
            continue;
          }

          const temp = aug[i];

          aug[i] = aug[r];
          aug[r] = temp;

          pivot = aug[i][i];

          swapped = true;

          break;
        }

        if (swapped === false) {
          console.error('This matrix is singular and cannot be inverted');

          return this;
        }
      }

      for (let j = 0; j < 2 * n; ++j) {
        aug[i][j] /= pivot;
      }

      for (let r = 0; r < n; ++r) {
        if (r === i) {
          continue;
        }

        const factor = aug[r][i];

        for (let j = 0; j < 2 * n; ++j) {
          aug[r][j] -= factor * aug[i][j];
        }
      }
    }

    this.#matrix = aug.map(row => row.slice(n));

    return this;
  }

  addMatrix(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return this;
    }

    const mRows = matrix.rows();

    if (mRows !== this.#rows) {
      console.error(`This matrix has ${this.#rows} rows and the right-hand matrix has ${mRows} rows`);

      return this;
    }

    const mCols = matrix.cols();

    if (mCols !== this.#cols) {
      console.error(`This matrix has ${this.#cols} cols and the right-hand matrix has ${mCols} cols`);

      return this;
    }
    
    for (let i = 0; i < this.#rows; ++i) {
      for (let j = 0; j < this.#cols; ++j) {
        const mElem = matrix.get(i, j);

        this.#matrix[i][j] += mElem;
      }
    }

    return this;
  }

  addScalar(scalar) {
    if (isValidNumber(scalar) === false) {
      console.error('The scalar is invalid');

      return this;
    }

    for (let i = 0; i < this.#rows; ++i) {
      for (let j = 0; j < this.#cols; ++j) {
        this.#matrix[i][j] += scalar;
      }
    }

    return this;
  }

  addScalarIdentity(scalar) {
    if (isValidNumber(scalar) === false) {
      console.error('The scalar is invalid');

      return this;
    }

    if (this.#rows !== this.#cols) {
      console.error('This matrix is not rectangle');

      return this;
    }

    return this.addMatrix(Matrix.newIdentity(this.#rows).multiplyScalar(scalar));
  }

  subMatrix(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return this;
    }

    return this.addMatrix(matrix.clone().multiplyScalar(-1));
  }

  subScalar(scalar) {
    return this.addScalar(-scalar);
  }

  subScalarIdentity(scalar) {
    return this.addScalarIdentity(-scalar);
  }

  multiplyScalar(scalar) {
    if (isValidNumber(scalar) === false) {
      console.error('The scalar is invalid');

      return this;
    }

    for (let i = 0; i < this.#rows; ++i) {
      for (let j = 0; j < this.#cols; ++j) {
        const elem = this.#matrix[i][j];
        const newElem = elem * scalar;

        this.#matrix[i][j] = newElem;
      }
    }

    return this;
  }

  multiplyMatrix(matrix) {
    if (matrix instanceof Matrix === false) {
      console.error('The matrix is invalid');

      return this;
    }

    const mRows = matrix.rows();

    if (mRows !== this.#rows) {
      console.error(`This matrix has ${this.#rows} rows and the right-hand matrix has ${mRows} rows`);

      return this;
    }

    const mCols = matrix.cols();

    if (mCols !== this.#cols) {
      console.error(`This matrix has ${this.#cols} cols and the right-hand matrix has ${mCols} cols`);

      return this;
    }

    const newMatrix = Matrix.new(this.#rows, this.#cols);

    for (let aRow = 0; aRow < this.#rows; ++aRow) {
      for (let bCol = 0; bCol < this.#cols; ++bCol) {
        let sum = 0;

        for (let aCol = 0; aCol < this.#cols; ++aCol) {
          const aElem = this.#matrix[aRow][aCol];
          const bElem = matrix.get(aCol, bCol);
          const elemsProduct = aElem * bElem;

          sum += elemsProduct;
        }

        newMatrix.set(aRow, bCol, sum);
      }
    }

    this.copyFromMatrix(newMatrix);

    return this;
  }
}
