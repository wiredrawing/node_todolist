const express = require('express')
const router = express.Router()

// ログアウト処理 (※必ずPOSTリクエストで実行する)
router.post('/', function (req, res, next) {
  // セッション内のログインフラグをoffにする
  req.session.isLoggedIn = false
  req.session.user = null
  return res.redirect('/login/')
})

module.exports = router
