/**
 * 指定した文字列が正しい整数値に変換できるかどうかをチェックする
 * @param targetNumber
 * @returns {boolean|number}
 */
export default function (targetNumber) {
  let currentNumber = parseInt(targetNumber);
  // If converted value is Not a Number, return the false.
  if (Number.isNaN(currentNumber)) {
    return false;
  }
  return currentNumber;
}
