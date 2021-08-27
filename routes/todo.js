let express = require('express');
let router = express.Router();
let models = require('../models/index.js');
const { check, validationResult } = require('express-validator');
const applicationConfig = require('../config/application-config.js');
const { Op } = require('sequelize');
const session = require('express-session');

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
let priorityStatusNameList = [];
applicationConfig.priorityStatusList.forEach((data, index) => {
  if (data.id > 0) {
    // バリデーション用に1以上を保持
    priorityStatusList.push(data.id);
  }
  priorityStatusNameList[data.id] = data.value;
});
console.log('priorityStatusNameList => ', priorityStatusNameList);
console.log('priorityStatusList => ', priorityStatusList);

let displayStatusList = [];
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id);
});
console.log('displayStatusList => ', displayStatusList);

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
      include: [{ model: models.Star }, { model: models.Project }, { model: models.user }, { model: models.user, as: 'belongsToUser' }, { model: models.TaskImage }],
      order: [['id', 'desc']],
    })
    .then((response) => {
      console.log('response => ', response);
      // ビューを表示
      response.forEach((data, index) => {
        console.log(data.Project);
      });
      return res.render('./todo/index', {
        tasks: response,
        actionUrlToStar: actionUrlToStar,
        taskStatusNameList: taskStatusNameList,
        priorityStatusNameList: priorityStatusNameList,
      });
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

/**
 * 新規Todoリストの作成
 */
router.get(
  '/create/:project_id',
  [
    // URLパラメータproject_idのバリデーション
    check('project_id', '指定したプロジェクトが見つかりません｡').custom((value, obj) => {
      let projectID = parseInt(value);
      return models.Project.findByPk(projectID)
        .then((project) => {
          if (project.id === projectID) {
            return true;
          }
          return Promise.reject(new Error('指定したプロジェクトを取得できませんでした'));
        })
        .catch((error) => {
          console.log('error ==> ', error);
          return Promise.reject(new Error(error));
        });
    }),
  ],
  (req, res, next) => {
    // タスク登録時の親テーブルのID
    let projectID = req.params.project_id;

    // セッションにエラーを持っている場合
    let sessionErrors = {};

    // バリデーションエラーチェック
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg;
      });
      console.log('errors.errors ===> ', errors);
      req.session.sessionErrors = sessionErrors;
      return res.redirect('back');
    }

    if (req.session.sessionErrors) {
      sessionErrors = req.session.sessionErrors;
      console.log(sessionErrors);
      req.session.sessionErrors = null;
    }
    // タスク一覧を取得するプロミス
    let taskPromise = models.task.findAll({
      include: [{ model: models.Star }, { model: models.Project }, { model: models.user }],
      order: [['id', 'desc']],
    });

    // 担当者一覧
    let userPromise = models.user.findAll({
      include: [{ model: models.task }],
      order: [['id', 'desc']],
    });

    return Promise.all([taskPromise, userPromise])
      .then((response) => {
        let actionUrl = req.originalUrl;
        let tasks = response[0];
        let users = response[1];
        // Promiseが解決されたらレスポンス返却
        return res.render('todo/create', {
          actionUrl: actionUrl,
          tasks: tasks,
          users: users,
          projectID: projectID,
          taskStatusList: applicationConfig.statusList,
          priorityStatusList: applicationConfig.priorityStatusList,
          sessionErrors: sessionErrors,
        });
      })
      .catch((error) => {
        // エラー時はnextメソッドを通じて次の処理へ移す
        return next(new Error(error));
      });
  }
);

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

    return models.sequelize.transaction().then((tx) => {
      console.log("tx ===> ", tx);
      return task
        .create(
          {
            task_name: postData.task_name,
            task_description: postData.task_description,
            user_id: postData.user_id,
            status: postData.status,
            project_id: postData.project_id,
            priority: postData.priority,
            is_displayed: applicationConfig.binaryType.on,
          },
          {
            transaction: tx,
          }
        )
        .then((task) => {
          // タスクの登録が完了したあと､画像とタスクを紐付ける
          console.log('task new record => ', task);
          let imageIDList = req.body.image_id;
          let imagePromiseList = [];
          imageIDList.forEach((imageID, index) => {
            let pro = models.TaskImage.create(
              {
                image_id: imageID,
                task_id: task.id,
              },
              {
                transaction: tx,
              }
            );
            imagePromiseList.push(pro);
          });

          return Promise.all(imagePromiseList).then((promiseList) => {
            console.log('PromiseList => ', promiseList);
            // トランザクションコミットを実行
            let promiseTransaction = tx.commit();
            console.log('tx.commit() => ', promiseTransaction);
            return promiseTransaction.then(transaction => {
              console.log("transaction ====> ", transaction);
              // レコードの新規追加が完了した場合は､リファラーでリダイレクト
              return res.redirect('back');
            });
          });
        })
        .catch((error) => {
          console.log('tx.rollback() => ', tx.rollback());
          return next(new Error(error));
        });
    });
  }
);

// --------------------------------------------------------
// 閲覧専用のタスク情報を表示および
// 当該のタスクに対してのコメントフォームを表示
// --------------------------------------------------------
router.get('/detail/:task_id', (req, res, next) => {
  let sessionErrors = {};
  if (req.session.sessionErrors) {
    sessionErrors = req.session.sessionErrors;
  }
  // taskモデルのpromiseを取得
  let taskID = req.params.task_id;
  // userモデルのpromiseを取得
  let users = models.user.findAll({
    order: [['id', 'asc']],
  });

  // タスク情報一覧
  let task = models.task.findByPk(taskID, {
      include: [
        { model: models.user },
        { model: models.Project },
        {
          model: models.TaskComment,
          include: [
            { model: models.user },
            {
              model: models.CommentImage,
              include: [
                { model: models.Image },
              ]
            },
          ],
        },
        {
          model: models.TaskImage,
          include: [
            { model: models.Image },
          ]
        },
      ],
      // 結合先のテーブルにたいしてsortさせる
      order: [[models.TaskComment, 'id', 'desc']],
    });
    // .then((task) => {
    //   console.log(task);
    //   if (task === null) {
    //     return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'));
    //   }
    //   return task;
    // });
  let projects = models.Project.findAll({
    include: [{ model: models.task }],
  });

  // usersとtaskの両方が完了した段階で実行
  return Promise.all([users, task, projects])
    .then((data) => {
      let users = data[0];
      let task = data[1];
      let projects = data[2];

      task.TaskComments.forEach((comment, index) => {
        comment.CommentImages.forEach((commentImage) => {
          console.log("image ===> ", commentImage.Image.getShowImageUrl());
        });
      });
      // console.log("task.TaskImages ====> ", task.TaskImages);
      // console.log('task ===> ', task);
      return res.render('todo/detail', {
        task: task,
        users: users,
        projects: projects,
        priorityStatusNameList: priorityStatusNameList,
        taskStatusNameList: taskStatusNameList,
        taskStatusList: applicationConfig.statusList,
        priorityStatusList: applicationConfig.priorityStatusList,
        displayStatusList: applicationConfig.displayStatusList,
        sessionErrors: sessionErrors,
      });
    })
    .catch((error) => {
      // console.log(error);
      return next(new Error(error));
    });
});

// --------------------------------------------------------
// 指定したタスクに対してのコメント登録処理を実行
// --------------------------------------------------------
router.post('/comment/:task_id', [
    check('comment', 'コメントを必ず入力して下さい'),
    check('image_id', '添付ファイルが不正です')
      .isArray()
      .custom((value, obj) => {
        console.log('value ==> ', value);
        return models.Image.findAll({
          where: {
            id: value,
          },
        })
          .then((images) => {
            console.log('image.length ==> ', images.length);
            console.log('images ==> ', images);
          })
          .catch((error) => {
            console.log(error);
          });
      }),
], (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty() !== true) {
      console.log('validation errors => ', errors);
      return res.redirect('back');
    }

    // タスクコメントデータを登録するpromiseを生成
    let taskComment = models.TaskComment.create( {
      comment: req.body.comment,
      task_id: req.body.task_id,
      user_id: req.body.user_id,
    }).then((taskComment) => {
      // 確定したcomment_idを取得する
      let commentID = taskComment.id;
      let createCommentImages = [];
      req.body.image_id.forEach((image_id) => {
        createCommentImages.push({
          comment_id: commentID,
          image_id: image_id,
        });
      })

      console.log("commentID ===> ", commentID);
      console.log('taskComment ==> ', taskComment);
      console.log("image_id[] ===> ", req.body.image_id);

      return models.CommentImage.bulkCreate(createCommentImages).then((images) => {
        console.log("images ===> ", images);
        return res.redirect('back');
      }).catch((error) => {
        return Promise.reject(new Error(error));
      });
    }).catch((error) => {
      console.log(error);
      return next(new Error(error));
    });

    return taskComment;
  }
);

/**
 * 指定したタスクの詳細情報を確認する
 *
 */
router.get('/edit/:task_id', (req, res, next) => {
  let sessionErrors = {};
  if (req.session.sessionErrors) {
    sessionErrors = req.session.sessionErrors;
  }
  // taskモデルのpromiseを取得
  let taskID = req.params.task_id;
  // userモデルのpromiseを取得
  let users = models.user.findAll({
    order: [['id', 'asc']],
  });
  let task = models.task
    .findByPk(taskID, {
      include: [{ model: models.user }],
    })
    .then((task) => {
      if (task === null) {
        return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'));
      }
      return task;
    });
  let projects = models.Project.findAll({
    include: [{ model: models.task }],
  });

  // usersとtaskの両方が完了した段階で実行
  return Promise.all([users, task, projects])
    .then((data) => {
      let users = data[0];
      let task = data[1];
      let projects = data[2];
      // console.log(task.created_at);
      // console.log(task.updated_at);
      return res.render('todo/edit', {
        task: task,
        users: users,
        projects: projects,
        taskStatusList: applicationConfig.statusList,
        priorityStatusList: applicationConfig.priorityStatusList,
        displayStatusList: applicationConfig.displayStatusList,
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
  '/edit/:taskID',
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
    check('project_id', '正しいプロジェクトIDを選択して下さい')
      .isNumeric()
      .custom((value, { req }) => {
        return models.Project.findAll({
          where: {
            id: value,
          },
        })
          .then((project) => {
            console.log('validation in project => ', project);
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
    check('status').isNumeric().isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
    check('is_displayed', '正しい表示状態を選択して下さい').isIn(displayStatusList),
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
      return res.redirect(301, '/todo/edit/' + req.params.taskID);
      // return (next(new Error(errors.errors)));
    }
    let postData = req.body;

    // 指定したtaskレコードをアップデートする
    return models.task
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
            is_displayed: postData.is_displayed,
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
        res.redirect(301, '/todo/edit/' + req.params.taskID);
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
    check('task_id', '指定したタスクIDが存在しませんでした｡').custom(function (value, obj) {
      // カスタムバリデーション
      // この中でDBのtasksテーブルにPOSTされたtask_idとマッチするものがあるかを検証
      return models.task
        .findByPk(value)
        .then((data) => {
          if (Number(data.id) === Number(value)) {
            return true;
          }
          return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'));
        })
        .catch((error) => {
          console.log('error => ', error);
          return Promise.reject(new Error(error));
        });
    }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);

    let postData = req.body;

    // バリデーションチェックを実行
    if (errors.isEmpty() !== true) {
      let sessionErrors = {};
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg;
      });
      // エラーをsessionに確保
      req.session.sessionErrors = sessionErrors;
      return res.redirect('back');
    }

    // スターを送られたタスクレコードも更新のみ実行する
    return models.sequelize
      .transaction()
      .then((tx) => {
        // スコープ内にトランザクション変数を明示
        let transaction = tx;

        return models.Star.create(
          {
            task_id: postData.task_id,
            user_id: 1,
          },
          {
            transaction: transaction,
          }
        )
          .then((star) => {
            // 新規作成レコード
            console.log('created star object => ', star);
            // スターテーブルの更新完了後tasksレコードも更新させる
            return models.task
              .findByPk(postData.task_id)
              .then((task) => {
                return task
                  .update(
                    {
                      updated_at: new Date(),
                    },
                    {
                      transaction: transaction,
                    }
                  )
                  .then((task) => {
                    console.log('task ==> ', task);
                    // 更新成功の場合
                    transaction.commit();
                    // req.__.e.emit('get_star', postData.task_id);
                    // スター追加後はもとページへリダイレクト
                    return res.redirect(301, '/todo/');
                  });
              })
              .catch((error) => {
                console.log('error => ', error);
                return Promise.reject(new Error(error));
              });
          })
          .catch((error) => {
            transaction.rollback();
            return Promise.reject(new Error(error));
          });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }
);

// 指定したタスクを削除する
router.post(
  '/delete/:task_id',
  [
    check('task_id', '指定したタスク情報が見つかりません')
      .isNumeric()
      .withMessage('タスクIDは数値で入力して下さい')
      .custom((value, obj) => {
        // 指定したtask_idが有効かを検証
        return models.task.findByPk(parseInt(value)).then((task) => {
          console.log('task ===> ', task);
          if (task.id !== value) {
            throw new Error('指定したタスク情報が見つかりません');
          }
          return true;
        });
      }),
  ],
  (req, res, next) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      let sessionErrors = {};
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg;
      });
      req.session.sessionErrors = sessionErrors;
      return res.redirect("back");
    }

    // 選択された､タスクを取得し削除する
    return models.task.findByPk(req.body.task_id).then(function (task) {
      console.log("task ===> ", task);
      return task.destroy().then(task => {
        // 削除成功時
        console.log("task ===> ", task);
        return res.redirect("back");
      }).catch(error => {
        console.log("error ===> ", error);
        return Promise.reject(new Error(error));
      });
    }).catch(function (error) {
      console.log("error ===> ", error);
      return next(new Error(error));
    });
  }
);
module.exports = router;
