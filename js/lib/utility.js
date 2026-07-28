function isValidNumber(val) {
  if (typeof val !== 'number') {
    return false;
  }

  if (isNaN(val) === true) {
    return false;
  }

  if (Number.isFinite(val) === false) {
    return false;
  }

  return true;
}

function isValidInteger(val) {
  if (isValidNumber(val) === false) {
    return false;
  }

  if (Number.isSafeInteger(val) === false) {
    return false;
  }

  return true;
}
