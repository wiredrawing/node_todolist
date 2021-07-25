let express = require("express");
let router = express.Router();
let models = require("../models/index.js");
const {check, validationResult } = require("express-validator");
const { route } = require("./index.js");
const applicationConfig = require("../config/application-config.js");

let userIDList = [];
models.user.findAll().then((users) => {
  return users;
}).then(users => {
  users.forEach((user, index) => {
    userIDList.push(user.id);
  });
  console.log(userIDList);
  return userIDList;
});

let taskStatusList = [];
applicationConfig.statusList.forEach((status, index) => {
  taskStatusList.push(status.id);
});

console.log(applicationConfig);

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
      taskStatusList: applicationConfig.statusList,
    });
  }).catch((error) => {
    // エラー時はnextメソッドを通じて次の処理へ移す
    return (next(new Error(error)));
  })
});


router.post("/create",[
  // postデータのバリデーションチェック
  check("task_name").not().isEmpty().isLength({min:1, max:256}),
  check("task_description").not().isEmpty().isLength({min:1, max:2048}),
  check("user_id").isIn(userIDList),
  check("status").isIn(taskStatusList),
], (req, res, next) => {
  // バリデーションチェック
  const errors = validationResult(req);
  // バリデーション成功の場合
  if (errors.isEmpty() !==true) {
    // nextミドルウェアに､Errorオブジェクトを渡す
    return(next(new Error("バリデーションに失敗しました｡")));
  }

  console.log(req.body);
  let task = models.task;
  // モデルを使ってtasksテーブルにタスクレコードを挿入する

  // POSTされたデータを変数化
  let postData = req.body;
  task.create({
    task_name: postData.task_name,
    task_description: postData.task_description,
    user_id: postData.user_id,
    status: postData.status,
  }).then((data) => {
    // 挿入結果を取得する
    console.log(data);
    res.redirect(301, "/todo/create");
  }).catch((error) => {
    next(new Error(error));
  });
})


/**
 * 指定したタスクの詳細情報を確認する
 */
router.get("/detail/:taskID", (req, res, index) => {

  // taskモデルのpromiseを取得
  let taskID = req.params.taskID;
  // userモデルのpromiseを取得
  let users = models.user.findAll({
    order: [
      ["id", "asc"],
    ]
  });
  let task = models.task.findByPk(taskID, {
    include: [
      {model: models.user}
    ]
  });

  // usersとtaskの両方が完了した段階で実行
  Promise.all([users, task]).then((data) => {
    let users = data[0];
    let task = data[1];
    res.render("todo/detail", {
      task: task,
      users: users,
      taskStatusList: applicationConfig.statusList,
    })
  }).catch(error => {
    console.log(error);
    return (next(new Error(error)));
  });
});

/**
 * 既存のタスク情報を更新する
 */
router.post("/detail/:taskID", [
  // バリデーションチェック
  check("task_name").isLength({min: 1, max: 256}),
  check("task_description").isLength({min: 1, max: 2048}),
  check("user_id").isIn(userIDList),
  check("status").isIn(taskStatusList),
], (req, res, next) => {
  const errors = validationResult(req);

  // バリデーションチェック
  if (errors.isEmpty() !== true) {
    console.log(errors);
    return (next(new Error(errors.errors)));
  }
  let postData = req.body

  // 指定したtaskレコードをアップデートする
  models.task.findByPk(req.params.taskID).then((task) => {
    // primaryKeyで取得したレコードを更新する
    task.task_name = postData.task_name;
    task.task_description = postData.task_description;
    task.user_id = postData.user_id;
    task.status = postData.status;
    task.save().then((result) => {
      res.redirect(301, "/todo/detail/" + req.params.taskID);
    }).catch(error => {
      console.log(error);
      return next(new Error(error))
    });
  }).catch((error) => {
    console.log(error);
    return next(new Error(error))
  });
});

module.exports = router;