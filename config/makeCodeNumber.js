


// ランダムな文字列で,タスクコードを作成する
module.exports = function (length = 7) {

  originalArray = [];
  original = "";
  numberStrings = "0123456789";
  lowerAlphabetStrings = "abcdefghijklnmopqrstuwxz";
  upperAlphabetStrings = lowerAlphabetStrings.toUpperCase();
  original += numberStrings;
  original += lowerAlphabetStrings;
  original += upperAlphabetStrings;
  originalArray = Array.from(original);

  let maxLength = originalArray.length;

  let randomIndex = 0;
  let taskCode = "";
  for (let i = 0 ; i < length ; i++) {

    randomIndex = Math.floor(Math.random() * maxLength -1);
    taskCode += originalArray[randomIndex];
  }
  return taskCode;
}