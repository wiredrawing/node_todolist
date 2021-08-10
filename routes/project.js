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
const applicationConfig = require("../config/application-config");
const session = require('express-session');

// 表示フラグのバリデーション用
let displayStatus = [];
applicationConfig.displayStatus.forEach((status, index) => {
  displayStatus.push(status.id);
});

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

  // バリデーションエラーを取得
  let sessionErrors = {};
  if (req.session.sessionErrors) {
    sessionErrors = req.session.sessionErrors;
  }

  // 現在のリクエストURLを変数に保持
  let actionUrl = req.originalUrl;

  // 現在登録中のプロジェクト一覧を取得する
  let projects = models.Project.findAll({
    include: [
      {model: models.task},
    ],
    order: [
      ["id", "desc"]
    ]
  });

  // 登録中のユーザー一覧
  let users = models.user.findAll({
    order: [
      ["id", "desc"],
    ]
  });

  // Promiseの解決
  Promise.all([users, projects]).then(function(response) {
    let users = response[0];
    let projects = response[1];
    return res.render("project/create",{
      users: users,
      projects: projects,
      actionUrl: actionUrl,
      sessionErrors: sessionErrors,
      applicationConfig: applicationConfig,
    });
  }).catch(error => {
    console.log(error);
    return next(new Error(error));
  });
});


router.post("/create", [
  // カスタムバリデーター
  check("user_id").isNumeric().custom(function (value, request) {
    // user_idがDBレコードに存在するかバリデーションする
    return models.user.findByPk(value).then((data) => {
      if (data.id == value){
        return true;
      }
      return Promise.reject("DBレコードに一致しません｡");
    }).catch((error) => {
      throw new Error(error);
    });
  }),
  check("project_name").isLength({min: 1, max: 256}).withMessage("プロジェクト名を入力して下さい"),
  check("project_description").isLength({min: 1, max: 4096}).withMessage("プロジェクトの概要を4000文字以内で入力して下さい｡"),
  check("status").isIn(displayStatus).withMessage("正しい表示設定を選択して下さい"),
], (req, res, next) => {

  // POSTデータを取得
  const postData = req.body;
  // express-validatorを使ったバリデーション結果を取得する
  const errors = validationResult(req);

  if (errors.isEmpty() !== true) {
    let sessionErrors =  {};
    console.log(errors.errors);
    errors.errors.forEach((error, index) => {
      sessionErrors[error.param] = error.msg;
    });
    req.session.sessionErrors = sessionErrors;
    console.log(req.session.sessionErrors);
    return res.redirect("back");
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




/**
 * プロジェクトの編集および更新入力画面
 *
 */
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

  let sessionErrors = {};
  if (req.session.sessionErrors) {
    sessionErrors = req.session.sessionErrors;
    delete(req.session.sessionErrors);
  }

  let users = models.user.findAll();

  let project = models.Project.findByPk(projectID, {
    include: [
      {
        model: models.task,
        include: [
          {model: models.user}
        ],
      },
    ],
    order: [
      [models.task, "id", "desc"]
    ],
  });

  Promise.all([users, project]).then((data) => {
    let users = data[0];
    let project = data[1];
    return res.render("project/detail", {
      users: users,
      project: project,
      sessionErrors: sessionErrors,
    });
  }).catch((error) => {
    // 例外 ※次のイベントキューへ回す
    return next(new Error(error));
  });
});


router.post("/detail/:projectID", [
  // カスタムバリデーター
  check("user_id").isNumeric().custom(function (value, request) {
    // user_idがDBレコードに存在するかバリデーションする
    return models.user.findByPk(value).then((data) => {
      if (data.id == value){
        return true;
      }
      return Promise.reject("DBレコードに一致しません｡");
    }).catch((error) => {
      throw new Error(error);
    });
  }),
  check("project_name").isLength({min: 1, max: 256}).withMessage("プロジェクト名を入力して下さい"),
  check("project_description").isLength({min: 1, max: 4096}).withMessage("プロジェクトの概要を4000文字以内で入力して下さい｡"),
  // check("status").isIn(displayStatus).withMessage("正しい表示設定を選択して下さい"),
  check("project_id").isNumeric().custom((value, {req}) => {
    let projectID = value;
    // DBに存在するproject_idかどうかをチェックする
    return models.Project.findByPk(value).then((project) => {
      // 正しいproject_id
      if (parseInt(project.id) === parseInt(value)) {
        return true;
      }
      return Promise.reject("プロジェクトが見つかりませんでした");
    }).catch((error) => {
      throw new Error(error);
    });
  }).withMessage("正しいフォーマットで入力して下さい")
], (req, res, next) => {
  console.log("req.body => ", req.body);
  const errors = validationResult(req);
  if (errors.isEmpty() !== true) {
    let sessionErrors = {};
    errors.errors.forEach((error, index) => {
      sessionErrors[error.param] = error.msg;
    });
    console.log("errors.errors => ", errors.errors);
    req.session.sessionErrors = sessionErrors;
    return res.redirect("back");
  }

  let postData = req.body;
  let projectID = parseInt(req.params.projectID);
  return models.Project.findByPk(projectID).then(project => {

    // promiseオブジェクトを必ず return する
    return project.update({
      project_name: postData.project_name,
      project_description: postData.project_description,
      user_id: postData.user_id,
    }).then((project) => {
      console.log("project => ", project);
      if (project.id === projectID) {
        // 詳細画面に戻る
        return res.redirect("back");
      }

      return Promise.reject(new Error("原因不明のエラーです｡"));

    }).catch(error => {
      return Promise.reject(error);
    })

  }).catch (error => {
    return next(new Error(error));
  });
});


router.get("/task/:projectID", [
  check("projectID").custom((value, {req}) => {
    value = parseInt(value);
    return models.Project.findByPk(value).then((project) => {

    }).catch( (error) => {
      return Promise.reject(error);
    });
  }).withMessage("指定したプロジェクトが見つかりません｡"),
], function (req, res, next) {

  let projectID = req.params.projectID;

  return models.Project.findByPk(projectID, {
    include: [
      {
        model: models.task,
        include: [
          {model: models.user}
        ]
      }
    ],
    order: [
      [models.task, "id", "desc"]
    ]
  }).then(project => {
    console.log(project);
    // ビューを返却
    return res.render("project/task", {
      project: project
    });
  }).catch(error => {
    console.log(error);
    return next(new Error(error));
  })
});
module.exports = router;
