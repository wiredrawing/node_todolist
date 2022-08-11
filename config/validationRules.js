import models from '../models/index.js'
import { check } from 'express-validator'
import { Op } from 'sequelize'
import bcrypt from 'bcrypt'
import applicationConfig from '../config/application-config.js'
import moment from 'moment'
import isNumber from './is-number.js'

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
        return models.User
          .findAll({
            where: {
              email: value
            }
          })
          .then(function (user) {
            if ( user.length === 1 ) {
              return true
            }
            throw new Error('メールアドレスが不正です')
          })
          .catch(function (error) {
            throw new Error(error)
          })
      }),
    check('password')
      .isLength({
        min: 10,
        max: 64
      })
      .withMessage('10文字以上64文字以内で入力して下さい')
      .custom(function (value, obj) {
        return models.User
          .findOne({
            where: {
              email: obj.req.body.email
            }
          })
          .then(function (user) {
            if ( user === null ) {
              return Promise.reject(new Error('パスワードが不正です'))
            }
            // メールアドレスの存在チェックOK後
            const hashPassword = user.password

            return new Promise(function (resolve, reject) {
              bcrypt.compare(value, hashPassword, function (err, result) {
                if ( err !== null ) {
                  console.log('error ----> ', err)
                  reject(new Error(err))
                }
                if ( result === true ) {
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
    check('user_name').isLength({
      min: 1,
      max: 64
    }).withMessage('1文字以上64文字以内で入力して下さい.'),
    // ログインID
    check('email')
      .isLength({
        min: 1,
        max: 64
      })
      .isEmail()
      .withMessage('正しいメールアドレスを入力して下さい｡')
      .custom(function (value, obj) {
        return models.User
          .findAll({
            where: {
              email: value
            }
          })
          .then(function (users) {
            if ( users.length !== 0 ) {
              throw new Error('そのメールアドレスは既に使われています｡')
            }
          })
      }),
    // 一言
    check('description').isLength({
      min: 1,
      max: 512
    }).withMessage('何か一言お願いします｡'),
    // パスワード
    check('password').isLength({
      min: 10,
      max: 64
    }).withMessage('10文字以上64文字以内で入力して下さい'),
    // 確認用パスワード
    check('password_confirmation')
      .isLength({
        min: 10,
        max: 64
      })
      .withMessage('10文字以上64文字以内で入力して下さい')
      .custom(function (value, obj) {
        if ( obj.req.body.password ) {
          if ( obj.req.body.password === value ) {
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
    check('user_id', '登録者IDは必須項目です').isNumeric().custom(async (value, request) => {
      let user = await models.User.findByPk(value)
      if ( user !== null ) {
        return true
      }
      return Promise.reject(new Error('DBレコードに一致しません｡'))
    }),
    // プロジェクト名
    check('project_name', 'プロジェクト名を入力して下さい').isLength({
      min: 1,
      max: 256
    }).custom(async (value) => {
      // Deny registering project having same name.
      if ( !value ) {
        return Promise.reject('プロジェクト名を必ず入力して下さい')
      }
      let project = await models.Project.findOne({
        where: {
          project_name: value,
        }
      })
      if ( project !== null ) {
        return Promise.reject('既に同名のプロジェクトが存在します')
      }
      return true
    }),
    // プロジェクト概要
    check('project_description').isLength({
      min: 1,
      max: 4096
    }).withMessage('プロジェクトの概要を4000文字以内で入力して下さい｡'),
    // 画像ID
    check('image_id', '指定した画像がアップロードされていません｡').custom(async function (value) {
      if ( Array.isArray(value) !== true ) {
        return Promise.reject(new Error('アップロード画像パラメータが配列ではありません.'))
      }
      let images = await models.Image.findAll({
        where: {
          id: {
            [Op.in]: value,
          }
        }
      })
      if ( images.length === value.length ) {
        return true
      }
      return Promise.reject(new Error('指定した画像がアップロードされていません｡'))
    }),
    check('is_displayed').isIn(displayStatusList).withMessage('規定の選択肢から設定して下さい'),
    // タスク開始時間
    check('start_date')
      .not()
      .isEmpty()
      .withMessage('開始時間は必須項目です')
      .custom(function (value, obj) {
        if ( value === null || value === undefined ) {
          throw new Error('開始時間は正しく入力して下さい')
        }
        const date = moment(value).format('YYYY-MM-DD')
        if ( date === value ) {
          return true
        }
        throw new Error('不正な開始時間です')
      }),
    // タスク終了時間
    check('end_date')
      .not()
      .isEmpty()
      .withMessage('終了時間は必須項目です')
      .custom(function (value, obj) {
        if ( value === null || value === undefined ) {
          throw new Error('終了時間は正しく入力して下さい')
        }
        const startTime = moment(obj.req.body.start_date)
        const endTime = moment(value)
        const endTimeFormat = endTime.format('YYYY-MM-DD')
        if ( endTimeFormat === value ) {
          if ( startTime < endTime ) {
            return true
          }
        }
        throw new Error('不正な終了時間です')
      }),
    check('users').custom(function (value, obj) {
      console.log('users value --->', value)
      return true
    })
  ],
  // --------------------------------------------------
  // 既存プロジェクトのアップデート
  // --------------------------------------------------
  'project.update':
    [
      // カスタムバリデーター
      check('user_id').isNumeric()
        .custom(async (value, request) => {
          try {
            const userId = isNumber(value)
            if ( userId === false ) {
              throw new Error('正しいフォーマットで指定して下さい')
            }
            // user_idがDBレコードに存在するかバリデーションする
            let user = await models.User.findByPk(value)
            if ( user === null ) {
              throw new Error('DBレコードに一致しません｡')
            }
            return true
          } catch ( error ) {
            return Promise.reject(error)
          }
        }),
      check('project_name').isLength({
        min: 1,
        max: 256
      }).withMessage('プロジェクト名を入力して下さい'),
      check('project_description').isLength({
        min: 1,
        max: 4096
      }).withMessage('プロジェクトの概要を4000文字以内で入力して下さい｡'),
      check('project_id').isNumeric().custom(async (value, { req }) => {
        // DBに存在するproject_idかどうかをチェックする
        const projectId = isNumber(value)
        if ( projectId === false ) {
          return Promise.reject('正しいフォーマットで入力して下さい')
        }
        let project = await models.Project.findByPk(parseInt(value))
        if ( project !== null ) {
          return true
        }
        return Promise.reject('指定したプロジェクトデータが見つかりません')
      }),
      check('is_displayed', '表示状態を正しく選択して下さい').isIn(displayStatusList),
      check('created_by').custom(async (value, obj) => {
        try {
          // ログインユーザー
          const userId = isNumber(value)
          if ( userId === false ) {
            throw new Error('プロジェクトの作成者IDが不正です')
          }
          // プロジェクトID
          const projectId = isNumber(obj.req.body.project_id)
          if ( projectId === false ) {
            throw new Error('プロジェクトIDが不正です')
          }
          let project = await models.Project.findByPk(projectId, {
            where: {
              created_by: userId,
            }
          })
          if ( project === null ) {
            throw new Error('プロジェクトが見つかりませんでした')
          }
          return true
        } catch ( error ) {
          return Promise.reject(error)
        }
      }),
      check('image_id').isArray().custom(async (value) => {
        try {
          console.log("image_id ----> ", value);
          // 指定された画像一覧がDB上に存在するかどうかを検証
          if ( value.length > 0 ) {
            let images = await models.Image.findAll({
              where: {
                id: {
                  [Op.in]: value,
                }
              }
            })
            console.log("images ---->", images);
            if ( images !== null ) {
              if (value.length === images.length) {
                return true;
              }
            }
          }
          throw new Error('指定した画像データが見つかりません')
        } catch ( error ) {
          return Promise.reject(error)
        }
      })
    ],
  // --------------------------------------------------
  // 新規タスクの作成ルール
  // --------------------------------------------------//
  'task.create': [
    // postデータのバリデーションチェック
    check('task_name', 'タスク名は必須項目です').not().isEmpty().isLength({
      min: 1,
      max: 256
    }),
    check('task_description', '1文字以上2000文字以内で入力して下さい').not().isEmpty().isLength({
      min: 1,
      max: 2048
    }),
    check('user_id', '作業者を設定して下さい').isInt().withMessage('ユーザーIDは数値で入力して下さい').custom(async (value, obj) => {
      try {
        // POSTされたuser_idがただし整数型に変換できるかどうかを検証
        const userId = isNumber(value)
        if ( userId === false ) {
          // Not a Numberだったら例外
          return Promise.reject(new Error('user_idが正しい数値型ではありません.'))
        }
        let user = await models.User.findByPk(userId)
        if ( user !== null && parseInt(user.id) === userId ) {
          // userIdの存在を確定.
          return true
        }
        return Promise.reject(new Error('正しいuserIdを設定して下さい'))
      } catch ( error ) {
        console.log(error)
        return Promise.reject(error)
      }
    }),
    check('project_id', '対応するプロジェクトを選択して下さい').not().isEmpty().isNumeric().withMessage('プロジェクトIDは数字で指定して下さい'),
    check('status').isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().withMessage('優先度は正しい値で設定して下さい').isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
    check('image_id').isArray().custom(async (value) => {
      try {
        let images = await models.Image.findAll({
          where: {
            id: {
              [Op.in]: value,
            }
          }
        })
        if ( images.length === value.length ) {
          return true
        }
        return Promise.reject(new Error('指定した画像がアップロードされていません｡'))
      } catch ( error ) {
        return Promise.reject(error)
      }
    }).withMessage('指定した画像がアップロードされていません｡'),
    check('start_date')
      .not()
      .isEmpty()
      .withMessage('開始日時は必須項目です')
      .custom(function (value, obj) {
        if ( value === null || value === undefined ) {
          throw new Error('開始時間は正しく入力して下さい')
        }
        const date = moment(value).format('YYYY-MM-DD')
        if ( date === value ) {
          return true
        }
        throw new Error('不正な開始時間です')
      }),
    check('end_date')
      .not()
      .isEmpty()
      .withMessage('開始日時は必須項目です')
      .custom(function (value, obj) {
        if ( value === null || value === undefined ) {
          throw new Error('終了時間は正しく入力して下さい')
        }
        const startTime = moment(obj.req.body.start_date)
        const endTime = moment(value)
        const endTimeFormat = endTime.format('YYYY-MM-DD')
        if ( endTimeFormat === value ) {
          if ( startTime < endTime ) {
            return true
          }
        }
        throw new Error('不正な終了時間です')
      })
  ],
  // ------------------------------------------------------------------
  // task.update
  // ------------------------------------------------------------------
  'task.update': [
    // バリデーションチェック
    check('task_id').custom(async (value, obj) => {
      // NaNでないことを検証する
      const taskId = isNumber(value)
      if ( taskId === false ) {
        return Promise.reject('This is Not a Number.')
      }
      let task = await models.Task.findByPk(taskId)
      if ( task !== null && parseInt(task.id) === taskId ) {
        return true
      }
      return Promise.reject(new Error('タスクが見つかりません'))
    }),
    check('task_name').isLength({
      min: 1,
      max: 256
    }).withMessage('タスク名を正しく入力して下さい｡'),
    check('task_description').isLength({
      min: 1,
      max: 2048
    }).withMessage('1文字以上2000文字以内で入力して下さい｡'),
    check('status').isNumeric().isIn(taskStatusList).withMessage('タスクステータスは有効な値を設定して下さい｡'),
    check('priority').isNumeric().isIn(priorityStatusList).withMessage('優先度は正しい値で設定して下さい'),
    check('is_displayed', '正しい表示状態を選択して下さい').isIn(displayStatusList),
    check('user_id').custom(async (value, obj) => {
      let userId = isNumber(value)
      if ( userId === false ) {
        return Promise.reject(new Error('タスク作成者IDが不正です.'))
      }
      // updateしようとしているユーザーが担当者orタスク作成者である必要がある
      const user = obj.req.session.user
      const taskId = obj.req.body.task_id
      let task = await models.Task.findByPk(taskId, {
        where: {
          [Op.or]: {
            user_id: userId,
            created_by: userId
          }
        }
      })
      if ( task !== null ) {
        return true
      }
      return Promise.reject(new Error('タスク作成者のみ編集可能です'))
    }),
    check("image_id").isArray().custom(async (value) => {
      try {
        console.log("image_id ------> ", value);
        if (value.length > 0) {
          let images = await models.Image.findAll({
            where: {
              id: {
                [Op.in]: value
              }
            }
          });
          console.log(images);
          if (images !== null && (images.length === value.length)) {
            console.log("validation ok.---->", images);
            return true;
          }
          throw new Error("指定した画像がサーバー上に存在しません");
        }
        return true;
      } catch (error) {
        console.log(error);
        return Promise.reject(error);
      }
    })
  ],
  // ---------------------------------
  // タスクに対してスターを送る
  // ---------------------------------
  'star.create': [
    check('task_id').custom(async (value, obj) => {
      const taskId = isNumber(value)
      if ( taskId === false ) {
        throw new Error('タスクIDが不正です')
      }
      let task = await models.Task.findByPk(taskId, {})
      if ( task !== null ) {
        return true
      }
      return Promise.reject(new Error('タスクIDが不正です'))
    }),
    check('user_id').custom(function (value, obj) {
      const userId = isNumber(value)
      if ( userId === false ) {
        return Promise.reject(new Error('ユーザーIDが不正です'))
      }
      return models.User.findByPk(userId).then(function (user) {
        if ( user !== null && parseInt(user.id) === userId ) {
          // user_idとtask_idの組み合わせはユニークであること
          return models.Star.findAll({
            where: {
              user_id: userId,
              task_id: obj.req.body.task_id
            }
          }).then(function (star) {
            if ( star.length > 0 ) {
              // throw new Error('既にスターリング済みです')
            }
            return true
          })
        }
        return Promise.reject(new Error('ユーザーIDが不正です'))
      }).catch(function (error) {
        return Promise.reject(new Error(error))
      })
    })
  ],
  'detail.project': [
    check('projectId').isNumeric().custom((value, { req }) => {
      const projectId = isNumber(value)
      if ( projectId === false ) {
        throw new Error('指定したプロジェクトデータが見つかりません')
      }
      return models.Project.findByPk(projectId)
        .then(function (project) {
          if ( parseInt(project.id) === projectId ) {
            return true
          }
          throw new Error('指定したプロジェクトデータが見つかりません')
        })
        .catch((error) => {
          throw new Error(error)
        })
    })
      .withMessage('指定したプロジェクトデータが見つかりません｡')
  ],
  'create.star': [
    check('task_id', '指定したタスクIDが存在しませんでした｡').isInt().custom(function (value, obj) {
      const taskId = isNumber(value)
      if ( taskId === false ) {
        return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'))
      }
      // カスタムバリデーション
      // この中でDBのtasksテーブルにPOSTされたtask_idとマッチするものがあるかを検証
      return models.Task.findByPk(value).then((data) => {
        if ( Number(data.id) === Number(value) ) {
          return true
        }
        return Promise.reject(new Error('指定したタスク情報が見つかりませんでした｡'))
      }).catch((error) => {
        return Promise.reject(new Error(error))
      })
    })
  ],
  'taskComment.create': [
    check('task_id', '不正なタスク情報です').isInt().custom(async (value) => {
      let task = await models.Task.findByPk(value, null)
      if ( task !== null ) {
        return true
      }
      return Promise.reject('指定したタスクIDが存在しません')
    }),
    check('user_id', '不正なユーザーです').isInt().custom(async (value) => {
      let user = await models.User.findByPk(value, null)
      if ( user !== null ) {
        return true
      }
      return Promise.reject('指定したユーザーIDが存在しません')
    }),
    check('comment', 'コメントは必ず入力して下さい').isString().isLength({
      min: 1,
      max: 65553
    }),
    check('image_id').optional({ nullable: true }).isArray().custom(async (value, { req }) => {
      // If you want to allow null data, add next condition.
      // optional({nullable: true});
      // Is all of images is correct?
      let images = await models.Image.findAll({
        where: {
          id: { [Op.in]: value }
        }
      })
      console.log(value)
      console.log(images)
      if ( images.length === value.length ) {
        return true
      }
      return Promise.reject('不正な画像IDが含まれています')
    }),
  ],
  'taskComment.get': [
    // Fetch the comment data list which is assciated
    check('taskId').isInt().not().isEmpty().custom(async (value) => {
      let task = await models.Task.findByPk(value)
      if ( task !== null ) {
        return true
      }
      return Promise.reject('The task id was not been able to find on DB.')
    }),
  ],
  'task.get': [
    check('id').isInt().custom(async (value, { req }) => {
      const taskId = isNumber(value)
      if ( taskId === false ) {
        return Promise.reject('Could not find the task record which you selected.')
      }
      let task = await models.Task.findByPk(taskId)
      if ( task !== null ) {
        return true
      }
      return Promise.reject('Could not find the task record which you selected.')
    }),
  ],
  'task.search': [
    check('keyword').isLength({
      min: 0,
      max: 256
    }).custom((value, obj) => {
      console.log(value)
      return true
    })
  ],
  'task.project.get': [
    check('keyword').isLength({
      min: 0,
      max: 256
    }).custom((value, obj) => {
      console.log(value)
      return true
    }),
    check('projectId').isInt().custom(async (value, obj) => {
      // The asynchronouse function always raturn a promise object.
      const projectId = isNumber(value)
      if ( projectId === false ) {
        return Promise.reject('不正なprojectIdです')
      }
      let project = await models.Project.findByPk(projectId, null)
      if ( projectId !== null ) {
        return true
      }
      return Promise.reject('不正なprojectIdです')
    })
  ],
  // ---------------------------------------------
  // 指定したprojectIdの情報を返却する
  // ---------------------------------------------
  'project.detail.get': [
    check('projectId')
      .isNumeric()
      .custom(async function (value, obj) {
        const proejctId = isNumber(value)
        if ( proejctId === false ) {
          return Promise.reject(new Error('projectレコードが見つかりません'))
        }
        // projectIDのバリデーションチェック
        let project = await models.Project.findByPk(proejctId)
        if ( project !== null ) {
          return true
        }
        return Promise.reject(new Error('projectレコードが見つかりません'))
      })
  ],
  "get.project.task": [
    check("projectId").isInt().custom(async (value) => {
      let projectId = isNumber(value);
      if (projectId === false) {
        return Promise.reject("正しいprojectIdを指定して下さい");
      }
      let project = await models.Project.findByPk(projectId,null);
      if (project !== null) {
        return true;
      }
      return Promise.reject("指定したプロジェクトが見つかりませんでした.");
    })
  ]
}

export default validationRules
