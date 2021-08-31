const express = require("express");
const router = express.Router();




// ログアウト処理 (※必ずPOSTリクエストで実行する)
router.post("/", function (req, res, next) {
  // セッション内のログインフラグをoffにする
  console.log("req.session.isLoggedIn ===> ", req.session.isLoggedIn);
  req.session.isLoggedIn = false;
  console.log("req.session.isLoggedIn ===> ", req.session.isLoggedIn);
  return res.redirect("/login/");
});

module.exports = router;
