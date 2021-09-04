const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const models = require("../models/index.js");
const validationRules = require("../config/validationRules.js");
const { check, validationResult } = require("express-validator");



// ------------------------------------------------
// 新規アカウント作成フォーム
// ------------------------------------------------
router.get("/create", function (req, res, next) {

  // セッションにユーザー情報が入っていたらログイン後ページへ
  console.log(req.session.user);
  if (req.session.user !== null) {
    // return res.redirect("/project");
  }
  return res.render("register/create", [

  ]);
});

// ------------------------------------------
// バリデーションエラーの内容をテンプレートで出力できるようにカスタム
// ------------------------------------------
router.post("/create", validationRules["register.create"], function (req, res, next) {
  let validationErrors = {};
  const errors = validationResult(req);
  req.session.validationErrors = null;
  if (errors.isEmpty() !== true) {
    errors.errors.forEach((error, index) => {
      validationErrors[error.param] = error.msg;
    });
    req.session.validationErrors = validationErrors;
    return res.redirect("back");
  }

  return next();
});

// ------------------------------------------------
// 新規アカウント作成処理の実行
// ------------------------------------------------
router.post("/create", function (req, res, next) {

  if (req.session.validationErrors !== null) {
    console.log(req.session.validationErrors);
    return res.redirect("back");
  }

  return bcrypt.genSalt(12, function (err, salt) {

    if (err) {
      return next(new Error(err));
    }

    // passwordをハッシュ化する
    bcrypt.hash(req.body.password, salt, function (err, hash) {

      // パスワードのハッシュ化失敗
      if (err) {
        return next(new Error(err));
      }

      // hash化成功の場合
      return models.user.create({
        user_name: req.body.user_name,
        email: req.body.email,
        description: req.body.description,
        password: hash,
      }).then(function (user) {
        console.log(user);
        return res.redirect("/login");
      }).catch(function (error) {
        return next(new Error(error));
      });
    })
  });
});



module.exports = router;