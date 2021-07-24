let express = require("express");
let router = express.Router();
let models = require("../models/index.js");
const {check, validationResult } = require("express-validator");
const { route } = require("./index.js");


/**
 * 登録中のタスク一覧を表示させる
 */
router.get("/", (req, res, next) => {
  // ビューを表示
  res.render("./todo/index", {
    tasks: req.__.tasks,
  })
});


/**
 * 新規Todoリストの作成
 */
router.get("/create", (req, res, next) => {
  let userModel = models.user;
  let actionUrl = req.originalUrl;
  userModel.findAll({
    include: models.task
  }).then((data) => {
    console.log(data);
    res.render("todo/create", {
      actionUrl: actionUrl,
      tasks: req.__.tasks,
      users: req.__.users,
    });
  }).catch((error) => {
    // エラー時はnextメソッドを通じて次の処理へ移す
    return (next(new Error(error)));
  })
});

let userIDList = [];
models.user.findAll().then((users) => {
  return users;
}).then(users => {
  users.forEach((user, index) => {
    userIDList.push(user.id);
  })
  console.log(userIDList);
  return userIDList;
}).then(userIDList => {

  router.post("/create",[
    // postデータのバリデーションチェック
    check("task_name").not().isEmpty().isLength({min:1, max:256}),
    check("task_description").not().isEmpty().isLength({min:1, max:2048}),
    check("user_id").isIn(userIDList),
  ], (req, res, next) => {
    // バリデーションチェック
    const errors = validationResult(req);
    // バリデーション成功の場合
    if (errors.isEmpty() !==true) {
      // nextミドルウェアに､Errorオブジェクトを渡す
      return(next(new Error("バリデーションに失敗しました｡")));
    }

    let task = models.task;
    // モデルを使ってtasksテーブルにタスクレコードを挿入する

    // POSTされたデータを変数化
    let postData = req.body;
    task.create({
      task_name: postData.task_name,
      task_description: postData.task_description,
      user_id: postData.user_id
    }).then((data) => {
      // 挿入結果を取得する
      console.log(data);
      res.redirect(301, "/todo/create");
    }).catch((error) => {
      next(new Error(error));
    });
  })
});


module.exports = router;