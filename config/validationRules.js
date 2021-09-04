const models = require("../models/index.js");
const { check, validationResult } = require("express-validator");




// すべてのバリデーションルールを設置
let validationRules = {
  "register.create": [
    // ユーザー名
    check("user_name").isLength({min: 1, max: 64}).withMessage("1文字以上64文字以内で入力して下さい."),
    // ログインID
    check("email").isLength({min:1, max: 64}).isEmail().withMessage("正しいメールアドレスを入力して下さい｡").custom(function (value, obj) {
      return models.user.findAll({
        where: {
          email: value,
        }
      }).then(function (users) {
        if (users.length !== 0) {
          return Promise.reject("そのメールアドレスは既に使われています｡");
        }
      });
    }),
    // 一言
    check("description").isLength({min:1, max: 512}).withMessage("何か一言お願いします｡"),
    // パスワード
    check("password").isLength({min: 10, max: 64}).withMessage("10文字以上64文字以内で入力して下さい"),
    // 確認用パスワード
    check("password_confirmation").isLength({min: 10, max: 64}).withMessage("10文字以上64文字以内で入力して下さい").custom(function (value, obj) {
      if (obj.req.body.password) {
        if (obj.req.body.password === value) {
          return true;
        }
      }
      return Promise.reject(new Error("パスワードが一致しません｡"));
    })
  ]
}



















module.exports = validationRules;