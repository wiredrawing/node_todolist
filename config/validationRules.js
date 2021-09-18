const models = require('../models/index.js')
const { check } = require('express-validator')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const applicationConfig = require('../config/application-config.js')
const moment = require('moment')

const taskStatusList = []
const taskStatusNameList = []
applicationConfig.statusList.forEach((status, index) => {
  if (status.id > 0) {
    // バリデーション用に1以上を保持
    taskStatusList.push(status.id)
  }
  taskStatusNameList[status.id] = status.value
})

const priorityStatusList = []
const priorityStatusNameList = []
applicationConfig.priorityStatusList.forEach((data, index) => {
  if (data.id > 0) {
    // バリデーション用に1以上を保持
    priorityStatusList.push(data.id)
  }
  priorityStatusNameList[data.id] = data.value
})

const displayStatusList = []
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id)
})

// すべてのバリデーションルールを設置
const validationRules = {
  // --------------------------------------------------
  // ログイン認証用ルール
  // --------------------------------------------------
  'login.index': [
    check('email')
      .isEmail()
      .withMessage('正しいメールアドレスを入力して下さい')
      .custom(function (value, obj) {
        return models.user
          .findAll({
            where: {
              email: value
            }
          })
          .then(function (user) {
            if (user.length === 1) {
              return true
            }
            throw new Error('メールアドレスが不正です')
          })
          .catch(function (error) {
            throw new Error(error)
          })
      }),
    check('password')
      .isLength({ min: 10, max: 64 })
      .withMessage('10文字以上64文字以内で入力して下さい')
      .custom(function (value, obj) {
        return models.user
          .findOne({
            where: {
              email: obj.req.body.email
            }
          })
          .then(function (user) {
            if (user === null) {
              return Promise.reject(new Error('パスワードが不正です'))
            }
            // メールアドレスの存在チェックOK後
            const hashPassword = user.password

            return new Promise(function (resolve, reject) {
              bcrypt.compare(value, hashPassword, function (err, result) {
                if (err !== null) {
                  console.log('error ----> ', err)
                  reject(new Error(err))
                }
                if (result === true) {
                  resolve(true)
                }
              })
            })
              .then(function (result) {
                return true
              })
              .catch(function (error) {
                throw new Error(error)
              })
          })
          .catch(function (error) {
            console.log('55行明のerror ==>', error)
            throw new Error('パスワードが不正です')
          })
      })
  ],
  // --------------------------------------------------
  // 新規ユーザー用ルール
  // --------------------------------------------------
  'register.create': [
    // ユーザー名
    check('user_name').isLength({ min: 1, max: 64 }).withMessage('1文字以上64文字以内で入力して下さい.'),
    // ログインID
    check('email')
      .isLength({ min: 1, max: 64 })
      .isEmail()
      .withMessage('正しいメールアドレスを入力して下さい｡')
      .custom(function (value, obj) {
        return models.user
          .findAll({
            where: {
              email: value
            }
          })
          .then(function (users) {
            if (users.length !== 0) {
              throw new Error('そのメールアドレスは既に使われています｡')
            }
          })
      }),
    // 一言
    check('description').isLength({ min: 1, max: 512 }).withMessage('何か一言お願いします｡'),
    // パスワード
    check('password').isLength({ min: 10, max: 64 }).withMessage('10文字以上64文字以内で入力して下さい'),
    // 確認用パスワード
    check('password_confirmation')
      .isLength({ min: 10, max: 64 })
      .withMessage('10文字以上64文字以内で入力して下さい')
      .custom(function (value, obj) {
        if (obj.req.body.password) {
          if (obj.req.body.password === value) {
            return true
          }
        }
        return Promise.reject(new Error('パスワードが一致しません｡'))
      })
  ],
  // --------------------------------------------------
  // 新規プロジェクト作成ルール
  // --------------------------------------------------
  'project.create': [
    // カスタムバリデーター
    check('user_id')
      .isNumeric()
      .custom(function (value, request) {
        // user_idがDBレコードに存在するかバリデーションする
        return models.user
          .findByPk(value)
          .then((data) => {
            if (data.id === value) {
              return true
            }
            throw new Error('DBレコードに一致しません｡')
          })
          .catch((error) => {
            throw new Error(error)
          })
      }),
    check('project_name').isLength({ min: 1, max: 256 }).withMessage('プロジェクト名を入力して下さい'),
    check('project_description').isLength({ min: 1, max: 4096 }).withMessage('プロジェクトの概要を4000文字以内で入力して下さい｡'),
    check('image_id', '指定した画像がアップロードされていません｡')
      .isArray()
      .custom(function (value) {
        return models.Image.findAll({
          where: {
            id: {
              [Op.in]: value
            }
          }
        })
          .then((images) => {
            // console.log("images => ", images);
            if (images.length !== value.length) {
              return Promise.reject(new Error('指定した画像がアップロードされていません｡'))
            }
            return true
          })
          .catch((error) => {
            throw new Error(error)
          })
      }),
    check('is_displayed').isIn(displayStatusList).withMessage('規定の選択肢から設定して下さい'),
    check('start_time')
      .not()
      .isEmpty()
      .withMessage('開始時間は必須項目です')
      .custom(function (value, obj) {
        if (value === null || value === undefined) {
          throw new Error('開始時間は正しく入力して下さい')
        }
        const date = moment(value).format('YYYY-MM-DD')
        if (date === value) {
          return true
        }
        throw new Error('不正な開始時間です')
      }),
    check('end_time')
      .not()
      .isEmpty()
      .withMessage('終了時間は必須項目です')
      .custom(function (value, obj) {
        if (value === null || value === undefined) {
          throw new Error('終了時間は正しく入力して下さい')
        }
        const startTime = moment(obj.req.body.start_time)
        const endTime = moment(value)
        const endTimeFormat = endTime.format('YYYY-MM-DD')
        if (endTimeFormat === value) {
          if (startTime < endTime) {
            return true
          }
        }
        throw new Error('不正な終了時間です')
      })
  ],
  // --------------------------------------------------
  // 既存プロジェクトのアップデート
  // --------------------------------------------------
  'project.update':
  [
    // カスタムバリデーター
    check('user_id')
      .isNumeric()
      .withMessage('正しいフォーマットで指定して下さい')
      .custom(function (value, request) {
        if (isNaN(value) === true) {
          throw new Error('正しいフォーマットで指定して下さい')
        }
        // user_idがDBレコードに存在するかバリデーションする
        return models.user
          .findByPk(value)
          .then((data) => {
            if (data.id === value) {
              return true
            }
            throw new Error('DBレコードに一致しません｡')
          })
          .catch((error) => {
            throw new Error(error)
          })
      }),
    check('project_name').isLength({ min: 1, max: 256 }).withMessage('プロジェクト名を入力して下さい'),
    check('project_description').isLength({ min: 1, max: 4096 }).withMessage('プロジェクトの概要を4000文字以内で入力して下さい｡'),
    check('project_id')
      .isNumeric()
      .custom((value, { req }) => {
        // DBに存在するproject_idかどうかをチェックする
        return models.Project.findByPk(parseInt(value))
          .then((project) => {
            // 正しいproject_id
            if (parseInt(project.id) === parseInt(value)) {
              return true
            }
            throw new Error('プロジェクトが見つかりませんでした')
          })
          .catch((error) => {
            throw new Error(error)
          })
      })
      .withMessage('正しいフォーマットで入力して下さい'),
    check('is_displayed', '表示状態を正しく選択して下さい').isIn(displayStatusList),
    check('by_user_id').custom(function (value, obj) {
      // ログインユーザー
      const userId = parseInt(obj.req.session.user.id)
      // プロジェクトID
      const projectId = parseInt(obj.req.body.project_id)
      return models.Project.findByPk(projectId).then(function (project) {
        if (!project) {
          throw new Error('プロジェクトが見つかりませんでした')
        }
        const byUserId = parseInt(project.by_user_id)
        if (userId === byUserId) {
          console.log('プロジェクト更新者と作成者が一致しました')
          return true
        }
        throw new Error('プロジェクト作成者のみ更新できます')
      })
    })
  ],
  // --------------------------------------------------
  // 新規タスクの作成ルール
  // --------------------------------------------------//
  'task.create': [
    // postデータのバリデーションチェック
    check('task_name', 'タスク名は必須項目です').not().isEmpty().isLength({ min: 1, max: 256 }),
    check('task_description', '1文字以上2000文字以内で入力して下さい').not().isEmpty().isLength({ min: 1, max: 2048 }),
    check('user_id', '作業者を設定して下さい')
      .isNumeric()
      .withMessage('ユーザーIDは数値で入力して下さい')
      .custom(function (value, obj) {
        const userId = parseInt(value)
        return models.user
          .findByPk(userId)
          .then(function (user) {
            if (user !== null && parseInt(user.id) === userId) {
              return true
            }
            console.log(user)
            throw new Error('正しい作業者を設定して下さい')
            // return Promise.reject()
          })
          .catch(function (error) {
            throw new Error(error)
          })
      }),
    check('project_id', '対応するプロジェクトを選択して下さい').not().isEmpty().isNumeric().withMessage('プロジェクトIDは数字で指定して下さい'),
    check('status').isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().withMessage('優先度は正しい値で設定して下さい').isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
    check('image_id')
      .isArray()
      .custom(function (value) {
        return models.Image.findAll({
          where: {
            id: {
              [Op.in]: value
            }
          }
        })
          .then((images) => {
            console.log('images => ', images)
            if (images.length !== value.length) {
              return Promise.reject(new Error('指定した画像がアップロードされていません｡'))
            }
            return true
          })
          .catch((error) => {
            throw new Error(error)
          })
      })
      .withMessage('指定した画像がアップロードされていません｡'),
    check('start_time')
      .not()
      .isEmpty()
      .withMessage('開始日時は必須項目です')
      .custom(function (value, obj) {
        if (value === null || value === undefined) {
          throw new Error('開始時間は正しく入力して下さい')
        }
        const date = moment(value).format('YYYY-MM-DD')
        if (date === value) {
          return true
        }
        throw new Error('不正な開始時間です')
      }),
    check('end_time')
      .not()
      .isEmpty()
      .withMessage('開始日時は必須項目です')
      .custom(function (value, obj) {
        if (value === null || value === undefined) {
          throw new Error('終了時間は正しく入力して下さい')
        }
        const startTime = moment(obj.req.body.start_time)
        const endTime = moment(value)
        const endTimeFormat = endTime.format('YYYY-MM-DD')
        if (endTimeFormat === value) {
          if (startTime < endTime) {
            return true
          }
        }
        throw new Error('不正な終了時間です')
      })
  ],
  'task.update': [
    // バリデーションチェック
    check('task_name').isLength({ min: 1, max: 256 }).withMessage('タスク名を正しく入力して下さい｡'),
    check('task_description').isLength({ min: 1, max: 2048 }).withMessage('1文字以上2000文字以内で入力して下さい｡'),
    check('user_id').custom((value, { req }) => {
      return models.user
        .findByPk(value)
        .then((user) => {
          if (user !== null) {
            if (parseInt(user.id) === parseInt(value)) {
              return true
            }
          }
          throw new Error('ユーザー情報が不正です')
        })
        .catch((error) => {
          throw new Error(error)
        })
    }),
    check('project_id', '正しいプロジェクトIDを選択して下さい')
      .isNumeric()
      .custom((value, { req }) => {
        return models.Project.findAll({
          where: {
            id: value
          }
        })
          .then((project) => {
            // console.log("validation in project => ", project);
          })
          .catch((error) => {
            throw new Error(error)
          })
      }),
    check('status').isNumeric().isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
    check('is_displayed', '正しい表示状態を選択して下さい').isIn(displayStatusList),
    check('by_user_id').custom(function (value, obj) {
      const user = obj.req.session.user
      const taskId = obj.req.body.task_id
      return models.task
        .findByPk(taskId)
        .then(function (task) {
          if (task === null) {
            throw new Error('タスク情報がみつかりません')
          }
          // タスク作成者とタスク編集者が同一ユーザーの場合のみ編集可能
          if (parseInt(task.by_user_id) === parseInt(user.id)) {
            return true
          }
          throw new Error('タスク作成者のみ編集可能です')
        })
        .catch(function (error) {
          return Promise.reject(new Error(error))
        })
    })
  ],
  // ---------------------------------
  // タスクに対してスターを送る
  // ---------------------------------
  'star.create': [
    check('task_id').custom(function (value, obj) {
      const taskId = parseInt(value)
      return models.task.findByPk(taskId).then(function (task) {
        if (task !== null && parseInt(task.id) === taskId) {
          return true
        }
        throw new Error('タスクIDが不正です')
      }).catch(function (error) {
        return Promise.reject(new Error(error))
      })
    }),
    check('user_id').custom(function (value, obj) {
      const userId = parseInt(value)
      return models.user.findByPk(userId).then(function (user) {
        if (user !== null && parseInt(user.id) === userId) {
          // user_idとtask_idの組み合わせはユニークであること
          return models.Star.findAll({
            where: {
              user_id: userId,
              task_id: obj.req.body.task_id
            }
          }).then(function (star) {
            if (star !== null) {
              throw new Error('既にスターリング済みです')
            }
            return true
          })
        }
        throw new Error('ユーザーIDが不正です')
      }).catch(function (error) {
        return Promise.reject(new Error(error))
      })
    })
  ]
}

module.exports = validationRules
