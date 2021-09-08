const models = require("../models/index.js");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");



// すべてのバリデーションルールを設置
let validationRules = {
  // --------------------------------------------------
  // ログイン認証用ルール
  // --------------------------------------------------
  "login.index": [
    check("email").isEmail().withMessage("正しいメールアドレスを入力して下さい").custom(function (value, obj) {
      return models.user.findAll({
        where: {
          email: value,
        }
      }).then(function (user) {
        if (user.length === 1) {
          return true;
        }
        return Promise.reject("メールアドレスが不正です");
      }).catch(function (error) {
        throw new Error(error)
      });
    }),
    check("password").isLength({min:10, max: 64}).withMessage("10文字以上64文字以内で入力して下さい").custom(function(value, obj) {
      return models.user.findOne({
        where: {
          email: obj.req.body.email,
        }
      }).then(function (user) {
        if (user === null) {
          return Promise.reject("パスワードが不正です");
        }
        // メールアドレスの存在チェックOK後
        let hashPassword = user.password;

        return new Promise(function (resolve, reject) {
          bcrypt.compare(value, hashPassword, function(err, result) {
            if (err !== null) {
              reject(new Error(err));
            }
            if (result === true) {
              resolve(true);
            }
          });
        });
      }).catch(function (error) {
        throw new Error(error)
      });
    }),
  ],
  // --------------------------------------------------
  // 新規ユーザー用ルール
  // --------------------------------------------------
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