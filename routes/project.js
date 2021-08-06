var express = require('express');
const { DatabaseError } = require('pg');
var router = express.Router();

// モデルロード
const models = require("../models/index.js");
const { route } = require('./index.js');

// バリデーション用のモジュールを読み込み
const {
  check,
  validationResult
} = require("express-validator");



// プロジェクト一覧ページ
router.get('/', function(req, res, next) {

  models.Project.findAll({
    include: [
      {model: models.task},
      {model: models.user}
    ],
    order: [
      ["id", "desc"]
    ]
  }).then((projects) => {
    // console.log(projects);
    res.render("project/index", {
      projects: projects
    });
  }).catch (error => {
    console.log(error);
  })

});

// プロジェクトの新規作成
router.get("/create", (req, res, next) => {

  // 現在のリクエストURLを変数に保持
  let actionUrl = req.originalUrl;

  // 現在登録中のプロジェクト一覧を取得する
  let projects = models.Project.findAll({
    include: models.task
  });
  // 登録中のユーザー一覧
  let users = models.user.findAll();

  // Promiseの解決
  Promise.all([users, projects]).then(function(response) {
    let users = response[0];
    let projects = response[1];
    res.render("project/create",{
      users: users,
      projects: projects,
      actionUrl: actionUrl,
    });
  }).catch(error => {
    console.log(error);
  });
});


router.post("/create", [
  // カスタムバリデーター
  check("user_id").custom(function (value, request) {
    // user_idがDBレコードに存在するかバリデーションする
    return models.user.findByPk(value).then((data) => {
      if (data.id == value){
        return true;
      }
      reject("DBレコードに一致しません｡");
    }).catch((error) => {
      throw new Error(error);
    });
  }),
  check("project_name").isLength({min: 1, max: 256}),
  check("project_description").isLength({min: 1, max: 4096}),
], (req, res, next) => {

  // POSTデータを取得
  const postData = req.body;
  // express-validatorを使ったバリデーション結果を取得する
  const errors = validationResult(req);

  if (errors.isEmpty() !== true) {
    return next(new Error(errors.errors));
  }
  // バリデーションチェックを通過した場合
  let project = models.Project.create({
    project_name: postData.project_name,
    project_description: postData.project_description,
    // user_idは当該プロジェクトのリーダーになるID
    user_id: postData.user_id,
  }).then((data) => {

    // returnする
    return res.redirect(301, "/project/");
  }).catch((error) => {
    // return
    return next(new Error(error));
  });
});




router.get("/detail/:projectID", [
  check("projectID").custom((value, {req}) => {
    let projectIDList = req.__.projectIDList;
    value = parseInt(value);
    if (projectIDList.includes(value)) {
      return true;
    } else {
      return false;
    }
  }).withMessage("指定したプロジェクトデータが見つかりません｡")
],function (req, res, next) {

  // URLパラメータの取得
  let projectID = req.params.projectID;
  const errors = validationResult(req);
  if (errors.isEmpty() !== true) {
    return next(new Error(errors.errors));
  }

  models.Project.findByPk(projectID, {
    include: [
      {model: models.task},
      {model: models.user},
    ]
  }).then((projectDetail) => {
    return res.render("project/detail", {
      projectDetail: projectDetail,
    });
  });
});
module.exports = router;
