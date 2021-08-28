const models = require("../models/index.js");
const bcrypt = require("bcrypt");
let express = require("express");
let router = express.Router();

// ログインページの表示
router.get("/", function (req, res, next) {
  return res.render("./login/index");
});


// 認証処理
router.post("/authenticate", function(req, res, next) {

  let body = req.body;
  let email = req.body.email;
  let password = req.body.password;
  console.log(email);

  return models.user.findOne({
    where: {
      email: email,
    },
  }).then(function (user) {
    if (user === null) {
      return Promise.reject("ユーザー認証に失敗しました｡");
    }
    // emailからユーザーの存在確認後,パスワードの認証をする
    console.log(user);
    bcrypt.compare(password, user.password).then(function (authenticate) {
      console.log(authenticate);
      if (authenticate !== true) {
        return Promise.reject("ユーザー認証に失敗しました｡");
      }

    });
  }).catch(function(error) {
    return next(new Error(error));
  });
});


module.exports = router;
