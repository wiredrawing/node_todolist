
// ランダムな文字列で,タスクコードを作成する
module.exports = function (length = 7) {
  let originalArray = []
  let original = ''
  const numberStrings = '0123456789'
  const lowerAlphabetStrings = 'abcdefghijklnmopqrstuwxz'
  const upperAlphabetStrings = lowerAlphabetStrings.toUpperCase()
  original += numberStrings
  original += lowerAlphabetStrings
  original += upperAlphabetStrings
  originalArray = Array.from(original)

  const maxLength = originalArray.length

  let randomIndex = 0
  let taskCode = ''
  for (let i = 0; i < length; i++) {
    randomIndex = Math.floor(Math.random() * maxLength - 1)
    taskCode += originalArray[randomIndex]
  }
  return taskCode
}
