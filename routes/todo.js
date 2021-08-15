let express = require('express');
let router = express.Router();
let models = require('../models/index.js');
const { check, validationResult } = require('express-validator');
const { route } = require('./index.js');
const applicationConfig = require('../config/application-config.js');
const task = require('../models/task.js');
const moment = require('moment');
const { resolveInclude } = require('ejs');
const session = require('express-session');
const { priorityStatus } = require('../config/application-config.js');
const { Op } = require('sequelize');

let userIDList = [];
models.user
  .findAll()
  .then((users) => {
    return users;
  })
  .then((users) => {
    users.forEach((user, index) => {
      userIDList.push(user.id);
    });
    return userIDList;
  });

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
let priorityNameList = [];
applicationConfig.priorityStatus.forEach((data, index) => {
  if (data.id > 0) {
    // バリデーション用に1以上を保持
    priorityStatusList.push(data.id);
  }
  priorityNameList[data.id] = data.value;
});

console.log(priorityStatusList);

/**
 * 登録中のタスク一覧を表示させる
 */
router.get('/', (req, res, next) => {
  // 検索用キーワード
  let keyword = '';
  if (req.query.keyword) {
    keyword = req.query.keyword;
  }

  let actionUrlToStar = '/todo/star';

  // タスク一覧を取得するプロミス
  return models.task
    .findAll({
      where: {
        [Op.or]: [
          {
            task_name: {
              [Op.like]: '%' + keyword + '%',
            },
          },
          {
            task_description: {
              [Op.like]: '%' + keyword + '%',
            },
          },
        ],
      },
      include: [
        { model: models.Star },
        { model: models.Project },
        { model: models.user },
        { model: models.TaskImage },
      ],
      order: [['id', 'desc']],
    }).then((response) => {
      console.log("response => ", response);
      // ビューを表示
      res.render('./todo/index', {
        tasks: response,
        actionUrlToStar: actionUrlToStar,
        taskStatusNameList: taskStatusNameList,
      });
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

/**
 * 新規Todoリストの作成
 */
router.get('/create', (req, res, next) => {
  // セッションにエラーを持っている場合
  let sessionErrors = {};
  if (req.session.sessionErrors) {
    sessionErrors = req.session.sessionErrors;
    console.log(sessionErrors);
    req.session.sessionErrors = null;
  }

  // プロジェクト情報取得用プロミス
  let projectPromise = models.Project.findAll({
    include: [{ model: models.task }],
  });

  // タスク一覧を取得するプロミス
  let taskPromise = models.task.findAll({
    include: [{ model: models.Star }, { model: models.Project }, { model: models.user }],
    order: [['id', 'desc']],
  });

  // 担当者一覧
  let userPromise = models.user.findAll({
    include: [{ model: models.task }],
  });

  Promise.all([projectPromise, taskPromise, userPromise])
    .then((response) => {
      let actionUrl = req.originalUrl;
      let projects = response[0];
      let tasks = response[1];
      let users = response[2];
      // Promiseが解決されたらレスポンス返却
      return res.render('todo/create', {
        actionUrl: actionUrl,
        projects: projects,
        tasks: tasks,
        users: users,
        taskStatusList: applicationConfig.statusList,
        priorityStatus: applicationConfig.priorityStatus,
        sessionErrors: sessionErrors,
      });
    })
    .catch((error) => {
      // エラー時はnextメソッドを通じて次の処理へ移す
      return next(new Error(error));
    });
});

router.post(
  '/create',
  [
    // postデータのバリデーションチェック
    check('task_name', 'タスク名は必須項目です').not().isEmpty().isLength({ min: 1, max: 256 }),
    check('task_description', '1文字以上2000文字以内で入力して下さい').not().isEmpty().isLength({ min: 1, max: 2048 }),
    check('user_id', '作業者を設定して下さい').isIn(userIDList),
    check('project_id', '対応するプロジェクトを選択して下さい').not().isEmpty().isNumeric().withMessage('プロジェクトIDは数字で指定して下さい'),
    check('status').isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().withMessage('優先度は正しい値で設定して下さい').isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
    check('image_id')
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
      })
      .withMessage('指定した画像がアップロードされていません｡'),
  ],
  (req, res, next) => {
    // バリデーションチェック
    const errors = validationResult(req);
    // バリデーション成功の場合
    if (errors.isEmpty() !== true) {
      // バリデーションエラーが有る場合は､セッションにエラーを保持
      let sessionErrors = {};
      errors.errors.forEach(function (error, index) {
        sessionErrors[error.param] = error.msg;
      });
      req.session.sessionErrors = sessionErrors;
      // Back the previous page.
      return res.redirect('back');
    }

    let task = models.task;
    // モデルを使ってtasksテーブルにタスクレコードを挿入する

    // POSTされたデータを変数化
    let postData = req.body;

    return models.sequelize.transaction().then(tx => {
      return task.create({
        task_name: postData.task_name,
        task_description: postData.task_description,
        user_id: postData.user_id,
        status: postData.status,
        project_id: postData.project_id,
        priority: postData.priority,
      }, {
        transaction: tx,
      }).then((task) => {
        // タスクの登録が完了したあと､画像とタスクを紐付ける
        console.log('task new record => ', task);
        let imageIDList = req.body.image_id;
        let imagePromiseList = [];
        imageIDList.forEach((imageID, index) => {
          let pro = models.TaskImage.create({
            image_id: imageID,
            task_id: task.id,
          }, {
            transaction: tx,
          });
          imagePromiseList.push(pro);
        });

        return Promise.all(imagePromiseList).then((promiseList) => {
          console.log("PromiseList => ", promiseList);
          // トランザクションコミットを実行
          console.log("tx.commit() => ", tx.commit());
          // レコードの新規追加が完了した場合は､リファラーでリダイレクト
          return res.redirect('back');
        })
      }).catch((error) => {
        console.log("tx.rollback() => ", tx.rollback());
        return next(new Error(error));
      });
    })
  }
);

/**
 * 指定したタスクの詳細情報を確認する
 *
 */
router.get('/detail/:taskID', (req, res, index) => {
  let sessionErrors = {};
  if (req.session.sessionErrors) {
    sessionErrors = req.session.sessionErrors;
  }

  // console.log(sessionErrors);
  // console.log('===>', sessionErrors);
  // taskモデルのpromiseを取得
  let taskID = req.params.taskID;
  // userモデルのpromiseを取得
  let users = models.user.findAll({
    order: [['id', 'asc']],
  });
  let task = models.task.findByPk(taskID, {
    include: [{ model: models.user }],
  });

  let projects = models.Project.findAll({
    include: [{ model: models.task }],
  });

  // usersとtaskの両方が完了した段階で実行
  Promise.all([users, task, projects])
    .then((data) => {
      let users = data[0];
      let task = data[1];
      let projects = data[2];
      // console.log(task.created_at);
      // console.log(task.updated_at);
      res.render('todo/detail', {
        task: task,
        users: users,
        projects: projects,
        taskStatusList: applicationConfig.statusList,
        priorityStatus: applicationConfig.priorityStatus,
        sessionErrors: sessionErrors,
      });
    })
    .catch((error) => {
      // console.log(error);
      return next(new Error(error));
    });
});

/**
 * 既存のタスク情報を更新する
 */
router.post(
  '/detail/:taskID',
  [
    // バリデーションチェック
    check('task_name').isLength({ min: 1, max: 256 }).withMessage('タスク名を正しく入力して下さい｡'),
    check('task_description', '1文字以上2000文字以内で入力して下さい｡').isLength({ min: 1, max: 2048 }),
    check('user_id')
      .custom((value, { req }) => {
        return models.user
          .findByPk(value)
          .then((user) => {
            return true;
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .isNumeric()
      .withMessage('Error1')
      .isIn(userIDList)
      .withMessage('Error2'),
    check('status').isNumeric().isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);

    // バリデーションチェック
    if (errors.isEmpty() !== true) {
      // console.log(errors.errors);
      let sessionErrors = {};
      // エラー内容をキーをカラムにして保存
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg;
      });
      req.session.sessionErrors = sessionErrors;
      console.log(sessionErrors);
      return res.redirect(301, '/todo/detail/' + req.params.taskID);
      // return (next(new Error(errors.errors)));
    }
    let postData = req.body;

    // 指定したtaskレコードをアップデートする
    models.task
      .findByPk(req.params.taskID)
      .then((task) => {
        return task
          .update({
            // primaryKeyで取得したレコードを更新する
            task_name: postData.task_name,
            task_description: postData.task_description,
            user_id: postData.user_id,
            status: postData.status,
            project_id: postData.project_id,
            priority: postData.priority,
          })
          .then((result) => {
            return result;
          })
          .catch((error) => {
            // console.log(error);
            return next(new Error(error));
          });
      })
      .then((result) => {
        console.log('result => ', result);
        res.redirect(301, '/todo/detail/' + req.params.taskID);
      })
      .catch((error) => {
        // console.log(error);
        return next(new Error(error));
      });
  }
);

// 指定したタスクにスターを送る
router.post(
  '/star',
  [
    check('task_id')
      .custom(function (value, obj) {
        // カスタムバリデーション
        // この中でDBのtasksテーブルにPOSTされたtask_idとマッチするものがあるかを検証
        return models.task
          .findByPk(value)
          .then((data) => {
            if (Number(data.id) === Number(value)) {
              return true;
            }
            return false;
          })
          .catch((error) => {
            return false;
          });
      })
      .withMessage('指定したタスクIDが存在しませんでした｡'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);

    // バリデーションチェックを実行
    if (errors.isEmpty() !== true) {
      // console.log(errors.errors);
      return next(new Error('バリデーションエラー'));
    }

    let postData = req.body;

    // スターを送られたタスクレコードも更新のみ実行する
    return models.sequelize
      .transaction()
      .then((tx) => {
        return models.Star.create(
          {
            task_id: postData.task_id,
            user_id: 1,
          },
          {
            transaction: tx,
          }
        )
          .then((star) => {
            // スターテーブルの更新完了後tasksレコードも更新させる
            return models.task
              .findByPk(postData.task_id)
              .then((task) => {
                task.updatedAt = new Date();
                task
                  .update(
                    {
                      updated_at: new Date(),
                    },
                    {
                      transaction: tx,
                    }
                  )
                  .then((task) => {
                    // // console.log(task);
                    // 更新成功の場合
                    tx.commit();
                    req.__.e.emit('get_star', postData.task_id);
                    // スター追加後はもとページへリダイレクト
                    return res.redirect(301, '/todo/');
                  });
              })
              .catch((error) => {
                return new Error(error);
              });
          })
          .catch((error) => {
            // // console.log(error);
            return new Error(error);
          });
      })
      .then((data) => {
        tx.rollback();
        return next(new Error(error));
      });
  }
);

module.exports = router;
