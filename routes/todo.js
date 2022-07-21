import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../models/index.js'
// const models = require('../models/index.js')
import { check, validationResult } from 'express-validator'
// const { check, validationResult } = require('express-validator')
import applicationConfig from '../config/application-config.js'
// const applicationConfig = require('../config/application-config.js')
import { Op } from 'sequelize'
// const { Op } = require('sequelize')
import makeCodeNumber from '../config/makeCodeNumber.js'
// const makeCodeNumber = require('../config/makeCodeNumber.js')
import validationRules from '../config/validationRules.js'
// const validationRules = require('../config/validationRules.js')

const userIDList = []
models.user
  .findAll()
  .then((users) => {
    return users
  })
  .then((users) => {
    users.forEach((user, index) => {
      userIDList.push(user.id)
    })
    return userIDList
  })

const taskStatusList = []
const taskStatusNameList = []
applicationConfig.statusList.forEach((status, index) => {
  if ( status.id > 0 ) {
    // バリデーション用に1以上を保持
    taskStatusList.push(status.id)
  }
  taskStatusNameList[status.id] = status.value
})

const priorityStatusList = []
const priorityStatusNameList = []
applicationConfig.priorityStatusList.forEach((data, index) => {
  if ( data.id > 0 ) {
    // バリデーション用に1以上を保持
    priorityStatusList.push(data.id)
  }
  priorityStatusNameList[data.id] = data.value
})

const displayStatusList = []
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id)
})

/**
 * 登録中のタスク一覧を表示させる
 */
router.get('/', (req, res, next) => {
  // 検索用キーワード
  let keyword = ''
  if ( req.query.keyword ) {
    keyword = req.query.keyword
  }

  const actionUrlToStar = '/todo/star'

  // タスク一覧を取得するプロミス
  return models.Task
    .findAll({
      where: {
        [Op.or]: [
          {
            task_name: {
              [Op.like]: '%' + keyword + '%'
            }
          },
          {
            task_description: {
              [Op.like]: '%' + keyword + '%'
            }
          }
        ]
      },
      include: [
        { model: models.Star },
        { model: models.Project },
        { model: models.user },
        { model: models.TaskImage },
        {
          model: models.user,
          as: 'belongsToUser'
        },
        {
          model: models.user,
          as: 'userCreatedTask'
        }
      ],
      order: [['id', 'desc']]
    })
    .then((response) => {
      // ビューを表示
      response.forEach((data, index) => {
      })
      return res.render('./todo/index', {
        tasks: response,
        actionUrlToStar: actionUrlToStar,
        taskStatusNameList: taskStatusNameList,
        priorityStatusNameList: priorityStatusNameList
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

/**
 * 新規Todoリストの作成
 */
router.get(
  '/create/:project_id',
  [
    // URLパラメータproject_idのバリデーション
    check('project_id', '指定したプロジェクトが見つかりません｡').custom((value, obj) => {
      const projectID = parseInt(value)
      return models.Project.findByPk(projectID)
        .then((project) => {
          if ( parseInt(project.id) === projectID ) {
            return true
          }
          return Promise.reject(new Error('指定したプロジェクトを取得できませんでした'))
        })
        .catch((error) => {
          return Promise.reject(new Error(error))
        })
    })
  ],
  (req, res, next) => {
    // タスク登録時の親テーブルのID
    const projectID = req.params.project_id

    // セッションにエラーを持っている場合
    let sessionErrors = {}

    // バリデーションエラーチェック
    const errors = validationResult(req)
    console.log('errors.errors ===> ', errors.errors)
    if ( errors.isEmpty() !== true ) {
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg
      })
      req.session.sessionErrors = sessionErrors
      return res.redirect('back')
    }

    if ( req.session.sessionErrors ) {
      sessionErrors = req.session.sessionErrors
      req.session.sessionErrors = null
    }
    // タスク一覧を取得するプロミス
    const taskPromise = models.Task.findAll({
      include: [{ model: models.Star }, { model: models.Project }, { model: models.user }],
      order: [['id', 'desc']]
    })

    // 担当者一覧
    const userPromise = models.user.findAll({
      include: [{ model: models.Task }],
      order: [['id', 'desc']]
    })

    return Promise.all([taskPromise, userPromise])
      .then((response) => {
        const actionUrl = req.originalUrl
        const tasks = response[0]
        const users = response[1]
        // Promiseが解決されたらレスポンス返却
        return res.render('todo/create', {
          actionUrl: actionUrl,
          tasks: tasks,
          users: users,
          projectID: projectID,
          taskStatusList: applicationConfig.statusList,
          priorityStatusList: applicationConfig.priorityStatusList,
          sessionErrors: sessionErrors
        })
      })
      .catch((error) => {
        // エラー時はnextメソッドを通じて次の処理へ移す
        return next(new Error(error))
      })
  }
)

router.post('/create', validationRules['task.create'], (req, res, next) => {
  // バリデーションチェック
  if ( req.executeValidationCheck(req) !== true ) {
    return res.redirect('back')
  }
  // ログインユーザー情報を取得
  const user = req.session.user
  const codeNumber = makeCodeNumber(12)
  const task = models.Task
  // モデルを使ってtasksテーブルにタスクレコードを挿入する

  // POSTされたデータを変数化
  const postData = req.body

  return models.sequelize.transaction().then((tx) => {
    const transaction = tx
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
          code_number: codeNumber,
          start_time: postData.start_time,
          end_time: postData.end_time,
          created_by: user.id
        },
        {
          transaction: tx
        }
      )
      .then((task) => {
        // タスクの登録が完了したあと､画像とタスクを紐付ける
        const imageIDList = req.body.image_id
        const imagePromiseList = []
        imageIDList.forEach((imageID, index) => {
          const pro = models.TaskImage.create(
            {
              image_id: imageID,
              task_id: task.id
            },
            {
              transaction: transaction
            }
          )
          imagePromiseList.push(pro)
        })

        return Promise.all(imagePromiseList).then((promiseList) => {
          // トランザクションコミットを実行
          const promiseTransaction = tx.commit()
          return promiseTransaction.then((transaction) => {
            // レコードの新規追加が完了した場合は､リファラーでリダイレクト
            return res.redirect('back')
          })
        })
      })
      .catch((error) => {
        return next(new Error(error))
      })
  })
})

// --------------------------------------------------------
// 閲覧専用のタスク情報を表示および
// 当該のタスクに対してのコメントフォームを表示
// --------------------------------------------------------
router.get('/detail/:task_id', (req, res, next) => {
  let sessionErrors = {}
  if ( req.session.sessionErrors ) {
    sessionErrors = req.session.sessionErrors
  }
  // taskモデルのpromiseを取得
  const taskID = req.params.task_id
  // userモデルのpromiseを取得
  const users = models.user.findAll({
    order: [['id', 'asc']]
  })

  // タスク情報一覧
  const task = models.Task.findByPk(taskID, {
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
              {
                model: models.Image,
                where: {
                  deleted_at: null
                }
              }
            ]
          }
        ]
      },
      {
        model: models.TaskImage,
        include: [{ model: models.Image }]
      }
    ],
    // 結合先のテーブルにたいしてsortさせる
    order: [[models.TaskComment, 'id', 'desc']]
  })
  const projects = models.Project.findAll({
    include: [{ model: models.Task }]
  })

  // usersとtaskの両方が完了した段階で実行
  return Promise.all([users, task, projects])
    .then((data) => {
      const users = data[0]
      const task = data[1]
      const projects = data[2]

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
        // ログイン情報を渡す
        user: req.session.user
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

// --------------------------------------------------------
// 指定したタスクに対してのコメント登録処理を実行
// --------------------------------------------------------
router.post(
  '/comment/:task_id',
  [
    check('comment', 'コメントを必ず入力して下さい'),
    check('image_id', '添付ファイルが不正です')
      .isArray()
      .custom((value, obj) => {
        return models.Image.findAll({
          where: {
            id: value
          }
        })
          .then((images) => {
          })
          .catch((error) => {
          })
      })
  ],
  (req, res, next) => {
    const errors = validationResult(req)

    if ( errors.isEmpty() !== true ) {
      return res.redirect('back')
    }

    // タスクコメントデータを登録するpromiseを生成
    return models.sequelize
      .transaction()
      .then(function (tx) {
        const transaction = tx
        const insertComment = {
          comment: req.body.comment,
          task_id: req.body.task_id,
          user_id: req.body.user_id
        }
        return models.TaskComment.create(insertComment, { transaction: transaction })
          .then((taskComment) => {
            // 確定したcomment_idを取得する
            const commentID = taskComment.id
            const createCommentImages = []
            // postデータに画像IDが含まれているかどうか
            req.body.image_id.forEach((image_id) => {
              if ( image_id.length > 0 ) {
                createCommentImages.push({
                  comment_id: commentID,
                  image_id: image_id
                })
              }
            })

            if ( createCommentImages.length > 0 ) {
              return models.CommentImage.bulkCreate(createCommentImages, {
                transaction: transaction
              })
                .then((images) => {
                  const result = transaction.commit()
                  console.log('transaction.commit() ==> ', result)
                  return res.redirect('back')
                })
                .catch((error) => {
                  return Promise.reject(new Error(error))
                })
            }
            const result = transaction.commit()
            console.log('transaction.commit() ==> ', result)
            // 画像がpostされなかった場合即リダイレクト
            return res.redirect('back')
          })
          .catch((error) => {
            transaction.rollback()
            throw new Error(error)
          })
      })
      .catch((error) => {
        return next(new Error(error))
      })
  }
)

/**
 * 指定したタスクの詳細情報を確認する
 * ※タスク作成者のみ編集可能とする
 */
router.get('/edit/:task_id', (req, res, next) => {
  let sessionErrors = {}
  if ( req.session.sessionErrors ) {
    sessionErrors = req.session.sessionErrors
  }
  // taskモデルのpromiseを取得
  const taskID = req.params.task_id
  // userモデルのpromiseを取得
  const users = models.user.findAll({
    order: [['id', 'asc']]
  })
  const task = models.Task
    .findByPk(taskID, {
      include: [{ model: models.user }]
    })
    .then((task) => {
      if ( task === null ) {
        return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'))
      }
      return task
    })
  const projects = models.Project.findAll({
    include: [{ model: models.Task }]
  })

  // usersとtaskの両方が完了した段階で実行
  return Promise.all([users, task, projects])
    .then((data) => {
      const users = data[0]
      const task = data[1]
      const projects = data[2]
      return res.render('todo/edit', {
        task: task,
        users: users,
        projects: projects,
        taskStatusList: applicationConfig.statusList,
        priorityStatusList: applicationConfig.priorityStatusList,
        displayStatusList: applicationConfig.displayStatusList,
        sessionErrors: sessionErrors
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

/**
 * 既存のタスク情報を更新する
 */
router.post('/edit/:taskId', validationRules['task.update'], (req, res, next) => {
  const errors = validationResult(req)
  if ( req.executeValidationCheck(req) !== true ) {
    return res.redirect('back')
  }
  console.log('errors.errors ===> ', errors.errors)

  const postData = req.body
  // 指定したtaskレコードをアップデートする
  return models.Task
    .findByPk(req.params.taskId)
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
          is_displayed: postData.is_displayed
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          return next(new Error(error))
        })
    })
    .then((result) => {
      res.redirect(301, '/todo/edit/' + req.params.taskId)
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

// 指定したタスクにスターを送る
router.post(
  '/star',
  [
    check('task_id', '指定したタスクIDが存在しませんでした｡').custom(function (value, obj) {
      // カスタムバリデーション
      // この中でDBのtasksテーブルにPOSTされたtask_idとマッチするものがあるかを検証
      return models.Task
        .findByPk(value)
        .then((data) => {
          if ( Number(data.id) === Number(value) ) {
            return true
          }
          return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'))
        })
        .catch((error) => {
          return Promise.reject(new Error(error))
        })
    })
  ],
  (req, res, next) => {
    const errors = validationResult(req)

    const postData = req.body

    // バリデーションチェックを実行
    if ( errors.isEmpty() !== true ) {
      const sessionErrors = {}
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg
      })
      // エラーをsessionに確保
      req.session.sessionErrors = sessionErrors
      return res.redirect('back')
    }

    // スターを送られたタスクレコードも更新のみ実行する
    return models.sequelize
      .transaction()
      .then((tx) => {
        // スコープ内にトランザクション変数を明示
        const transaction = tx

        return models.Star.create(
          {
            task_id: postData.task_id,
            user_id: 1
          },
          {
            transaction: transaction
          }
        )
          .then((star) => {
            // 新規作成レコード
            // スターテーブルの更新完了後tasksレコードも更新させる
            return models.Task
              .findByPk(postData.task_id)
              .then((task) => {
                return task
                  .update(
                    {
                      updated_at: new Date()
                    },
                    {
                      transaction: transaction
                    }
                  )
                  .then((task) => {
                    // 更新成功の場合
                    transaction.commit()
                    // req.__.e.emit('get_star', postData.task_id);
                    // スター追加後はもとページへリダイレクト
                    return res.redirect(301, '/todo/')
                  })
              })
              .catch((error) => {
                return Promise.reject(new Error(error))
              })
          })
          .catch((error) => {
            transaction.rollback()
            return Promise.reject(new Error(error))
          })
      })
      .catch((error) => {
        return next(new Error(error))
      })
  }
)

// 指定したタスクを削除する
router.post(
  '/delete/:task_id',
  [
    check('task_id', '指定したタスク情報が見つかりません')
      .isNumeric()
      .withMessage('タスクIDは数値で入力して下さい')
      .custom((value, obj) => {
        // 指定したtask_idが有効かを検証
        return models.Task.findByPk(parseInt(value)).then((task) => {
          if ( task.id !== value ) {
            throw new Error('指定したタスク情報が見つかりません')
          }
          return true
        })
      })
  ],
  (req, res, next) => {
    const errors = validationResult(req)
    if ( errors.isEmpty() !== true ) {
      const sessionErrors = {}
      errors.errors.forEach((error, index) => {
        sessionErrors[error.param] = error.msg
      })
      req.session.sessionErrors = sessionErrors
      return res.redirect('back')
    }

    // 選択された､タスクを取得し削除する
    return models.Task
      .findByPk(req.body.task_id)
      .then(function (task) {
        return task
          .destroy()
          .then((task) => {
            // 削除成功時
            return res.redirect('back')
          })
          .catch((error) => {
            return Promise.reject(new Error(error))
          })
      })
      .catch(function (error) {
        return next(new Error(error))
      })
  }
)
export default router
// module.exports = router
