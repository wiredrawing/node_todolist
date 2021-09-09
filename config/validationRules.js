const models = require("../models/index.js");
const { check, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const applicationConfig = require("../config/application-config.js");


let taskStatusList = [];
let taskStatusNameList = [];
applicationConfig.statusList.forEach((status, index) => {
  if (status.id > 0) {
    // バリデーション用に1以上を保持
    taskStatusList.push(status.id);
  }
  taskStatusNameList[status.id] = status.value;
});

let priorityStatusList = [];
let priorityStatusNameList = [];
applicationConfig.priorityStatusList.forEach((data, index) => {
  if (data.id > 0) {
    // バリデーション用に1以上を保持
    priorityStatusList.push(data.id);
  }
  priorityStatusNameList[data.id] = data.value;
});

let displayStatusList = [];
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id);
});

// すべてのバリデーションルールを設置
let validationRules = {
  // --------------------------------------------------
  // ログイン認証用ルール
  // --------------------------------------------------
  "login.index": [
    check("email")
      .isEmail()
      .withMessage("正しいメールアドレスを入力して下さい")
      .custom(function (value, obj) {
        return models.user
          .findAll({
            where: {
              email: value,
            },
          })
          .then(function (user) {
            if (user.length === 1) {
              return true;
            }
            return Promise.reject("メールアドレスが不正です");
          })
          .catch(function (error) {
            throw new Error(error);
          });
      }),
    check("password")
      .isLength({ min: 10, max: 64 })
      .withMessage("10文字以上64文字以内で入力して下さい")
      .custom(function (value, obj) {
        return models.user
          .findOne({
            where: {
              email: obj.req.body.email,
            },
          })
          .then(function (user) {
            if (user === null) {
              return Promise.reject(new Error("パスワードが不正です"));
            }
            // メールアドレスの存在チェックOK後
            let hashPassword = user.password;

            return new Promise(function (resolve, reject) {
              bcrypt.compare(value, hashPassword, function (err, result) {
                if (err !== null) {
                  console.log("error ----> ", err);
                  reject(new Error(err));
                }
                if (result === true) {
                  resolve(true);
                }
              });
            })
              .then(function (result) {
                return true;
              })
              .catch(function (error) {
                throw new Error(error);
              });
          })
          .catch(function (error) {
            console.log("55行明のerror ==>", error);
            throw new Error("パスワードが不正です");
            throw new Error(error);
          });
      }),
  ],
  // --------------------------------------------------
  // 新規ユーザー用ルール
  // --------------------------------------------------
  "register.create": [
    // ユーザー名
    check("user_name").isLength({ min: 1, max: 64 }).withMessage("1文字以上64文字以内で入力して下さい."),
    // ログインID
    check("email")
      .isLength({ min: 1, max: 64 })
      .isEmail()
      .withMessage("正しいメールアドレスを入力して下さい｡")
      .custom(function (value, obj) {
        return models.user
          .findAll({
            where: {
              email: value,
            },
          })
          .then(function (users) {
            if (users.length !== 0) {
              return Promise.reject("そのメールアドレスは既に使われています｡");
            }
          });
      }),
    // 一言
    check("description").isLength({ min: 1, max: 512 }).withMessage("何か一言お願いします｡"),
    // パスワード
    check("password").isLength({ min: 10, max: 64 }).withMessage("10文字以上64文字以内で入力して下さい"),
    // 確認用パスワード
    check("password_confirmation")
      .isLength({ min: 10, max: 64 })
      .withMessage("10文字以上64文字以内で入力して下さい")
      .custom(function (value, obj) {
        if (obj.req.body.password) {
          if (obj.req.body.password === value) {
            return true;
          }
        }
        return Promise.reject(new Error("パスワードが一致しません｡"));
      }),
  ],
  // --------------------------------------------------
  // 新規プロジェクト作成ルール
  // --------------------------------------------------
  "project.create": [
    // カスタムバリデーター
    check("user_id")
      .isNumeric()
      .custom(function (value, request) {
        // user_idがDBレコードに存在するかバリデーションする
        return models.user
          .findByPk(value)
          .then((data) => {
            if (data.id == value) {
              return true;
            }
            return Promise.reject("DBレコードに一致しません｡");
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
    check("project_name").isLength({ min: 1, max: 256 }).withMessage("プロジェクト名を入力して下さい"),
    check("project_description").isLength({ min: 1, max: 4096 }).withMessage("プロジェクトの概要を4000文字以内で入力して下さい｡"),
    check("image_id", "指定した画像がアップロードされていません｡")
      .isArray()
      .custom(function (value) {
        return models.Image.findAll({
          where: {
            id: {
              [Op.in]: value,
            },
          },
        })
          .then((images) => {
            // console.log("images => ", images);
            if (images.length !== value.length) {
              return Promise.reject(new Error("指定した画像がアップロードされていません｡"));
            }
            return true;
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
    check("is_displayed").isIn(displayStatusList).withMessage("規定の選択肢から設定して下さい"),
  ],
  // --------------------------------------------------
  // 新規タスクの作成ルール
  // --------------------------------------------------//
  "create.task": [
    // postデータのバリデーションチェック
    check("task_name", "タスク名は必須項目です").not().isEmpty().isLength({ min: 1, max: 256 }),
    check("task_description", "1文字以上2000文字以内で入力して下さい").not().isEmpty().isLength({ min: 1, max: 2048 }),
    check("user_id", "作業者を設定して下さい").isNumeric().withMessage("ユーザーIDは数値で入力して下さい").custom(function (value, obj) {
      let userId = parseInt(value);
      return models.user.findByPk(userId).then(function (user) {
        if (user !== null && parseInt(user.id) === userId) {
          return true;
        }
        console.log(user);
        return Promise.reject("正しい作業者を設定して下さい");
      }).catch(function (error) {
        throw new Error(error);
      });
    }),
    check("project_id", "対応するプロジェクトを選択して下さい").not().isEmpty().isNumeric().withMessage("プロジェクトIDは数字で指定して下さい"),
    check("status").isIn(taskStatusList).withMessage("タスクステータスは有効な値を設定して下さい｡"),
    check("priority").isNumeric().withMessage("優先度は正しい値で設定して下さい").isIn(priorityStatusList).withMessage("優先度は正しい値で設定して下さい"),
    check("image_id")
      .isArray()
      .custom(function (value) {
        return models.Image.findAll({
          where: {
            id: {
              [Op.in]: value,
            },
          },
        })
          .then((images) => {
            console.log("images => ", images);
            if (images.length !== value.length) {
              return Promise.reject(new Error("指定した画像がアップロードされていません｡"));
            }
            return true;
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .withMessage("指定した画像がアップロードされていません｡"),
  ],
};

module.exports = validationRules;
