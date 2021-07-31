let express = require("express");
let router = express.Router();
let models = require("../models/index.js");
const {check, validationResult } = require("express-validator");
const { route } = require("./index.js");
const applicationConfig = require("../config/application-config.js");
const task = require("../models/task.js");

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
let taskStatusNameList = [];
applicationConfig.statusList.forEach((status, index) => {
  taskStatusList.push(status.id);
  taskStatusNameList[status.id] = status.value;
});

console.log(taskStatusNameList);
console.log(applicationConfig);



/**
 * 登録中のタスク一覧を表示させる
 */
router.get("/", (req, res, next) => {
  let actionUrlToStar = "/todo/star";

  // プロジェクト情報取得用プロミス
  let projectPromise = models.Project.findAll({
    include : [
      {model: models.task}
    ]
  });

  // タスク一覧を取得するプロミス
  let taskPromise = models.task.findAll({
    include : [
      {model: models.Star},
      {model: models.Project},
      {model: models.user}
    ],
    order: [
      ["id", "desc"],
    ]
  });

  // プロミスの解決
  Promise.all([projectPromise, taskPromise]).then((response) => {
    let projects = response[0];
    let tasks = response[1];
    // ビューを表示
    res.render("./todo/index", {
      projects: projects,
      tasks: tasks,
      actionUrlToStar: actionUrlToStar,
      taskStatusNameList: taskStatusNameList,
    });
  }).catch((error) => {
    return next(new Error(error))
  });
});


/**
 * 新規Todoリストの作成
 */
router.get("/create", (req, res, next) => {

  // プロジェクト情報取得用プロミス
  let projectPromise = models.Project.findAll({
    include : [
      {model: models.task}
    ]
  });

  // タスク一覧を取得するプロミス
  let taskPromise = models.task.findAll({
    include : [
      {model: models.Star},
      {model: models.Project},
      {model: models.user}
    ],
    order: [
      ["id", "desc"],
    ]
  });

  // 担当者一覧
  let userPromise = models.user.findAll({
    include: [
      {model: models.task},
    ]
  });

  Promise.all([
    projectPromise,
    taskPromise,
    userPromise
  ]).then((response) => {
    let actionUrl = req.originalUrl;
    let projects = response[0];
    let tasks = response[1];
    let users = response[2];
    // Promiseが解決されたらレスポンス返却
    return res.render("todo/create", {
      actionUrl: actionUrl,
      projects: projects,
      tasks: tasks,
      users: users,
      taskStatusList: applicationConfig.statusList,
    });
  }).catch((error) => {
    // エラー時はnextメソッドを通じて次の処理へ移す
    return (next(new Error(error)));
  });
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


// 指定したタスクにスターを送る
router.post("/star", [
  check("task_id").custom(function (value, obj) {
    // カスタムバリデーション
    // この中でDBのtasksテーブルにPOSTされたtask_idとマッチするものがあるかを検証
    return models.task.findByPk(value).then(data => {
      if (Number(data.id) === Number(value)) {
        return true;
      }
      console.log(data);
      console.log(value);
      console.log("=================================>");
      console.log(obj);
      console.log("<=================================");
      return false;
    }).catch(error => {
      return false
    });
  }).withMessage("指定したタスクIDが存在しませんでした｡")
], (req, res, next) => {
  const errors = validationResult(req);

  // バリデーションチェックを実行
  if (errors.isEmpty() !== true) {
    console.log(errors.errors);
    return next(new Error("バリデーションエラー"));
  }

  let postData = req.body;

  models.Star.create({
    task_id: postData.task_id,
    user_id: 1,
  }).then((data) => {
    console.log(data);
    // スター追加後はもとページへリダイレクト
    res.redirect(301, "/todo/");
  }).catch((error) => {
    console.log(error);
    return next(new Error(error));
  });
});

module.exports = router;