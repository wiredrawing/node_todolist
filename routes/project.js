var express = require('express');
var router = express.Router();

// モデルロード
const models = require('../models/index.js');

// バリデーション用のモジュールを読み込み
const { check, validationResult } = require('express-validator');
const applicationConfig = require('../config/application-config');
const { Op } = require('sequelize');
// 表示フラグのバリデーション用
let displayStatusList = [];
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id);
});
console.log('displayStatusList => ', displayStatusList);

// プロジェクト一覧ページ
router.get('/', function (req, res, next) {
  console.log(req.cookies);
  let keyword = '';
  if (req.query.keyword) {
    keyword = req.query.keyword;
  }

  return models.Project.findAll({
    where: {
      [Op.or]: [
        {
          project_name: {
            [Op.like]: '%' + keyword + '%',
          },
        },
        {
          project_description: {
            [Op.like]: '%' + keyword + '%',
          },
        },
      ],
    },
    include: [{ model: models.task }, { model: models.user }],
    order: [['id', 'desc']],
  })
    .then((projects) => {
      // console.log(projects);
      return res.render('project/index', {
        projects: projects,
      });
    })
    .catch((error) => {
      console.log(error);
      return next(new Error(error));
    });
});

// プロジェクトの新規作成
router.get('/create', (req, res, next) => {
  console.log('==============>', res.locals);
  // バリデーションエラーを取得
  let sessionErrors = {};
  if (req.session.sessionErrors) {
    // バリデーションエラーのヘルパー関数を登録
    console.log(req.session.sessionErrors);
    req.setValidationErrors(req.session.errors);
    sessionErrors = req.session.sessionErrors;
    // セッション内エラーを削除
    req.session.sessionErrors = null;
  }
  console.log('==============>', res.locals);
  // 現在のリクエストURLを変数に保持
  let actionUrl = req.originalUrl;

  // 現在登録中のプロジェクト一覧を取得する
  let projects = models.Project.findAll({
    include: [{ model: models.task }],
    order: [['id', 'desc']],
  });

  // 登録中のユーザー一覧
  let users = models.user.findAll({
    order: [['id', 'desc']],
  });

  // Promiseの解決
  Promise.all([users, projects])
    .then(function (response) {
      console.log(req.old);
      let users = response[0];
      let projects = response[1];
      return res.render('project/create', {
        users: users,
        projects: projects,
        actionUrl: actionUrl,
        sessionErrors: sessionErrors,
        applicationConfig: applicationConfig,
        // old: req.old,
      });
    })
    .catch((error) => {
      console.log(error);
      return next(new Error(error));
    });
});

router.post(
  '/create',
  [
    // カスタムバリデーター
    check('user_id')
      .isNumeric()
      .custom(function (value, request) {
        // user_idがDBレコードに存在するかバリデーションする
        return models.user
          .findByPk(value)
          .then((data) => {
            if (data.id == value) {
              return true;
            }
            return Promise.reject('DBレコードに一致しません｡');
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
    check('project_name').isLength({ min: 1, max: 256 }).withMessage('プロジェクト名を入力して下さい'),
    check('project_description').isLength({ min: 1, max: 4096 }).withMessage('プロジェクトの概要を4000文字以内で入力して下さい｡'),
    check('image_id', '指定した画像がアップロードされていません｡')
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
            console.log('images => ', images);
            if (images.length !== value.length) {
              return Promise.reject(new Error('指定した画像がアップロードされていません｡'));
            }
            return true;
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
  ],
  (req, res, next) => {
    // POSTデータを取得
    const postData = req.body;
    // express-validatorを使ったバリデーション結果を取得する
    const errors = validationResult(req);

    if (errors.isEmpty() !== true) {
      let sessionErrors = {};
      console.log(errors.errors);
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg;
      });
      req.session.errors = errors.errors;
      req.session.sessionErrors = sessionErrors;
      console.log(req.session.sessionErrors);
      return res.redirect('back');
    }

    // バリデーションチェックを通過した場合
    return models.Project.create({
      project_name: postData.project_name,
      project_description: postData.project_description,
      // user_idは当該プロジェクトのリーダーになるID
      user_id: postData.user_id,
    })
      .then((data) => {
        // returnする
        return res.redirect(301, '/project/');
      })
      .catch((error) => {
        // return
        return next(new Error(error));
      });
  }
);

/**
 * プロジェクトの編集および更新入力画面
 *
 */
router.get(
  '/detail/:projectID',
  [
    check('projectID')
      .custom((value, { req }) => {
        let projectIDList = req.__.projectIDList;
        value = parseInt(value);
        if (projectIDList.includes(value)) {
          return true;
        } else {
          return false;
        }
      })
      .withMessage('指定したプロジェクトデータが見つかりません｡'),
  ],
  function (req, res, next) {
    // URLパラメータの取得
    let projectID = req.params.projectID;
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      return next(new Error(errors.errors));
    }

    let sessionErrors = {};
    if (req.session.sessionErrors) {
      sessionErrors = req.session.sessionErrors;
      delete req.session.sessionErrors;
    }

    let users = models.user.findAll();

    let project = models.Project.findByPk(projectID, {
      include: [
        {
          model: models.task,
          include: [{ model: models.user }],
        },
      ],
      order: [[models.task, 'id', 'desc']],
    });

    Promise.all([users, project])
      .then((data) => {
        let users = data[0];
        let project = data[1];
        console.log('===> project.is_displayed => ', project.is_displayed);
        return res.render('project/detail', {
          users: users,
          project: project,
          sessionErrors: sessionErrors,
          displayStatusList: applicationConfig.displayStatusList,
        });
      })
      .catch((error) => {
        // 例外 ※次のイベントキューへ回す
        return next(new Error(error));
      });
  }
);

router.post(
  '/detail/:projectID',
  [
    // カスタムバリデーター
    check('user_id')
      .isNumeric()
      .custom(function (value, request) {
        // user_idがDBレコードに存在するかバリデーションする
        return models.user
          .findByPk(value)
          .then((data) => {
            if (data.id == value) {
              return true;
            }
            return Promise.reject('DBレコードに一致しません｡');
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
    check('project_name').isLength({ min: 1, max: 256 }).withMessage('プロジェクト名を入力して下さい'),
    check('project_description').isLength({ min: 1, max: 4096 }).withMessage('プロジェクトの概要を4000文字以内で入力して下さい｡'),
    check('project_id')
      .isNumeric()
      .custom((value, { req }) => {
        let projectID = value;
        // DBに存在するproject_idかどうかをチェックする
        return models.Project.findByPk(value)
          .then((project) => {
            // 正しいproject_id
            if (parseInt(project.id) === parseInt(value)) {
              return true;
            }
            return Promise.reject('プロジェクトが見つかりませんでした');
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .withMessage('正しいフォーマットで入力して下さい'),
    check('is_displayed', '表示状態を正しく選択して下さい').isIn(displayStatusList),
  ],
  (req, res, next) => {
    console.log('req.body => ', req.body);
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      let sessionErrors = {};
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg;
      });
      console.log('errors.errors => ', errors.errors);
      req.session.sessionErrors = sessionErrors;
      return res.redirect('back');
    }

    let postData = req.body;
    let projectID = parseInt(req.params.projectID);
    return models.Project.findByPk(projectID)
      .then((project) => {
        // promiseオブジェクトを必ず return する
        return project
          .update({
            project_name: postData.project_name,
            project_description: postData.project_description,
            user_id: postData.user_id,
            is_displayed: postData.is_displayed,
          })
          .then((project) => {
            console.log('project => ', project);
            if (project.id === projectID) {
              // 詳細画面に戻る
              return res.redirect('back');
            }

            return Promise.reject(new Error('原因不明のエラーです｡'));
          })
          .catch((error) => {
            return Promise.reject(error);
          });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }
);

// --------------------------------------------------
// 指定したプロジェクトに紐づくタスク一覧を取得する
// --------------------------------------------------
router.get(
  '/task/:projectID',
  [
    check('projectID')
      .custom((value, { req }) => {
        value = parseInt(value);
        return models.Project.findByPk(value)
          .then((project) => {})
          .catch((error) => {
            return Promise.reject(error);
          });
      })
      .withMessage('指定したプロジェクトが見つかりません｡'),
  ],
  function (req, res, next) {
    let projectID = req.params.projectID;

    return models.Project.findByPk(projectID, {
      include: [
        {
          model: models.task,
          include: [{ model: models.user }, { model: models.Star }],
        },
      ],
      order: [[models.task, 'id', 'desc']],
    })
      .then((project) => {
        console.log('task/:projectID project => ', project);
        // ビューを返却
        return res.render('project/task', {
          project: project,
        });
      })
      .catch((error) => {
        console.log(error);
        return next(new Error(error));
      });
  }
);

router.post(
  '/delete/:project_id',
  [
    check('project_id')
      .isNumeric()
      .custom(function (value, obj) {
        let projectID = parseInt(value);
        return models.Project.findByPk(projectID).then(function (project) {
          console.log('project ===> ', project);
        });
      }),
  ],
  function (req, res, next) {
    console.log('req ===> ', req);
    console.log('req.res === res ===> ', req.res === res);
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      return req.res.redirect('back');
    }
    let body = req.body;

    return models.Project.findByPk(body.project_id)
      .then((project) => {
        console.log('project ==> ', project);
        return project
          .destroy()
          .then((project) => {
            console.log('project ==> ', project);
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }
);
module.exports = router;
