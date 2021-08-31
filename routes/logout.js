const express = require("express");
const router = express.Router();




// ログアウト処理 (※必ずPOSTリクエストで実行する)
router.post("/", function (req, res, next) {
  console.log("req.session.isLoggedIn ===> ", req.session.isLoggedIn);
  res.session.isLoggedIn = false;

  return res.redirect("/login");
});

module.exports = router;
