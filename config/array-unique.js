/**
 * 引数に指定した配列の重複値を削除して,ユニークな値のみを返却する
 * @param targetArray
 * @returns {*[]}
 */
export default function (targetArray) {
  let uniqueArray = [];
  targetArray.forEach((value, index) => {
    // 返却する配列に対象の値が存在しなければ...
    if (uniqueArray.indexOf(value) === -1) {
      uniqueArray.push(value);
    }
  });
  return uniqueArray;
}
