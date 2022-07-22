import express from 'express'
// const express = require('express')
const router = express.Router()

// モデルロード
import models from '../models/index.js'
// const models = require('../models/index.js')
// バリデーション用のモジュールを読み込み
import { check, validationResult } from 'express-validator'
// const { check, validationResult } = require('express-validator')
import applicationConfig from '../config/application-config.js'
// const applicationConfig = require('../config/application-config')
import validationRules from '../config/validationRules.js'
// const validationRules = require('../config/validationRules.js')
import { Op } from 'sequelize'
// const { Op } = require('sequelize')
// 識別使用コード生成関数
import makeCodeNumber from '../config/makeCodeNumber.js'
import projectuser from '../models/projectuser.js'
// const makeCodeNumber = require('../config/makeCodeNumber.js')
// 表示フラグのバリデーション用
const displayStatusList = []
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id)
})

// プロジェクト一覧ページ
router.get('/', function (req, res, next) {
  let keyword = ''
  if ( req.query.keyword ) {
    keyword = req.query.keyword
  }

  return models.Project.findAll({
    where: {
      [Op.or]: [
        {
          project_name: {
            [Op.like]: '%' + keyword + '%'
          }
        },
        {
          project_description: {
            [Op.like]: '%' + keyword + '%'
          }
        }
      ]
    },
    include: [{ model: models.Task }, { model: models.user }],
    order: [['id', 'desc']]
  })
    .then((projects) => {
      return res.render('project/index', {
        projects: projects
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

// プロジェクトの新規作成
router.get('/create', (req, res, next) => {
  // バリデーションエラーを取得
  const sessionErrors = {}

  // 現在のリクエストURLを変数に保持
  const actionUrl = req.originalUrl

  // 現在登録中のプロジェクト一覧を取得する
  const projects = models.Project.findAll({
    include: [{ model: models.Task }],
    order: [['id', 'desc']]
  })

  // 登録中のユーザー一覧
  const users = models.user.findAll({
    order: [['id', 'desc']]
  })

  // Promiseの解決
  Promise.all([users, projects])
    .then(function (response) {
      const users = response[0]
      const projects = response[1]
      return res.render('project/create', {
        users: users,
        projects: projects,
        actionUrl: actionUrl,
        sessionErrors: sessionErrors,
        applicationConfig: applicationConfig
        // old: req.old,
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

router.post('/create', validationRules['project.create'], (req, res, next) => {
  // POSTデータを取得
  const postData = req.body
  // express-validatorを使ったバリデーション結果を取得する
  // const errors = validationResult(req)
  if ( req.executeValidationCheck(req) !== true ) {
    return res.redirect('back')
  }

  // transaction処理
  (async function () {
    const codeNumber = makeCodeNumber(12)
    let tx = await models.sequelize.transaction()
    try {
      let project = await models.Project.create({
          project_name: postData.project_name,
          project_description: postData.project_description,
          // user_idは当該プロジェクトのリーダーになるID
          user_id: postData.user_id,
          is_displayed: postData.is_displayed,
          code_number: codeNumber,
          start_time: postData.start_time,
          end_time: postData.end_time,
          created_by: req.session.user.id
        },
        {
          transaction: tx
        })
      console.log(project);
      // projectの登録が成功した場合
      if ( project === null ) {
        throw new Error('Failed registering a project record.')
      }
      // ------------------------------------------------
      // Project Images を登録
      // lastInsertIDを取得
      // ------------------------------------------------
      let projectId = project.id
      const projectImagesForBulk = []
      req.body.image_id.forEach((id, index) => {
        projectImagesForBulk.push({
          image_id: id,
          project_id: projectId
        })
      })
      let projectImages = await models.ProjectImage.bulkCreate(projectImagesForBulk, {
        transaction: tx,
      })
      console.log("projectImagesForBulk.length ==> ", projectImagesForBulk.length);
      console.log("projectImages.length ==> ", projectImages.length);
      if (projectImages.length !== projectImagesForBulk.length) {
        throw new Error('Failed registering a project images record.')
      }

      // ---------------------------------------------------
      // プロジェクトに参加するユーザーをテーブルにinsert
      // ---------------------------------------------------
      const projectUsersForBulk = []
      if ( req.body.users && req.body.users.length > 0 ) {
        // userIdの重複を削除する
        let blushedUsers = [];
        req.body.users.filter((element, index, self) => {
          if (blushedUsers.indexOf(element) !== -1) {
            blushedUsers.push(element);
          }
        });
        blushedUsers.forEach((userId) => {
          projectUsersForBulk.push({
            user_id: userId,
            project_id: projectId
          })
        })
      }
      let projectUsers = await models.ProjectUser.bulkCreate(projectUsersForBulk, {
        transaction: tx,
      })
      console.log(projectUsers);
      console.log("projectUsersForBulk.length ==> ", projectUsersForBulk.length);
      console.log("projectUsers.length ==> ", projectUsers.length);
      if ( projectUsers === null ) {
        throw new Error('Failed registering a project users record.')
      }
      let result = await tx.commit()
      // 作成済みのプロジェクト詳細ページへ遷移
      return res.redirect('/project/detail/' + projectId)
    } catch ( error ) {
      console.log("例外発生中 ---->");
      console.log(error)
      await tx.rollback()
      return next(new Error(error))
    }

    //   return models.sequelize.transaction(null, null).then(transaction => {
  //
  //     let projectId = null
  //     // バリデーションチェックを通過した場合
  //     return models.Project.create(
  //       {
  //         project_name: postData.project_name,
  //         project_description: postData.project_description,
  //         // user_idは当該プロジェクトのリーダーになるID
  //         user_id: postData.user_id,
  //         is_displayed: postData.is_displayed,
  //         code_number: codeNumber,
  //         start_time: postData.start_time,
  //         end_time: postData.end_time,
  //         created_by: req.session.user.id
  //       },
  //       {
  //         transaction: transaction
  //       }
  //     ).then((data) => {
  //       // lastInsertIDを取得
  //       projectId = data.id
  //       const projectImagesForBulk = []
  //       req.body.image_id.forEach((id, index) => {
  //         projectImagesForBulk.push({
  //           image_id: id,
  //           project_id: projectId
  //         })
  //       })
  //
  //       return models.ProjectImage.bulkCreate(projectImagesForBulk, {
  //         transaction: transaction
  //       }).then((projectImages) => {
  //         // ---------------------------------------------------
  //         // プロジェクトに参加するユーザーをテーブルにinsert
  //         // ---------------------------------------------------
  //         const projectUsers = []
  //         if (req.users && req.users.length > 0) {
  //           req.body.users.forEach((userId) => {
  //             projectUsers.push({
  //               user_id: userId,
  //               project_id: projectId
  //             })
  //           })
  //         }
  //
  //         return models.ProjectUser.bulkCreate(projectUsers, {
  //           transaction: transaction
  //         }).then(function (projectUsers) {
  //           transaction.commit()
  //           // 作成済みのプロジェクト詳細ページへ遷移
  //           return res.redirect('/project/detail/' + projectId);
  //         })
  //       }).catch((error) => {
  //         console.log(error)
  //         throw new Error(error)
  //       })
  //     }).catch((error) => {
  //       // return
  //       return transaction.rollback().then((rollback) => {
  //         console.log(rollback);
  //         return next(new Error(error))
  //       })
  //     })
  //   })
  })();
})

/**
 * プロジェクトの編集および更新入力画面
 *
 */
router.get(
  '/detail/:projectId',
  [
    check('projectId')
      .isNumeric()
      .custom((value, { req }) => {
        const projectId = parseInt(value)
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
  function (req, res, next) {
    // URLパラメータの取得
    const projectId = req.params.projectId
    const errors = validationResult(req)
    if ( errors.isEmpty() !== true ) {
      return next(new Error(errors.errors))
    }

    let sessionErrors = {}
    if ( req.session.sessionErrors ) {
      sessionErrors = req.session.sessionErrors
      delete req.session.sessionErrors
    }

    const users = models.user.findAll()

    const project = models.Project.findByPk(projectId, {
      include: [
        {
          model: models.Task,
          include: [{ model: models.user }]
        },
        {
          model: models.ProjectImage,
          include: [{ model: models.Image }]
        }
      ],
      order: [[models.Task, 'id', 'desc']]
    })

    Promise.all([users, project])
      .then((data) => {
        const users = data[0]
        const project = data[1]
        return res.render('project/detail', {
          users: users,
          project: project,
          sessionErrors: sessionErrors,
          displayStatusList: applicationConfig.displayStatusList
        })
      })
      .catch((error) => {
        // 例外 ※次のイベントキューへ回す
        return next(new Error(error))
      })
  }
)

router.post('/detail/:projectId', validationRules['project.update'], (req, res, next) => {
  // バリデーションチェック開始
  if ( req.executeValidationCheck(req) !== true ) {
    console.log('バリデーションチェックに引っかかっています')

    return res.redirect('back')
  }

  console.log('req.body ====> ', req.body)

  const postData = req.body
  const projectId = parseInt(req.params.projectId)

  // トランザクション開始
  return models.sequelize
    .transaction()
    .then(function (tx) {
      const transaction = tx
      // -------------------------------------------
      // projectsテーブルのアップデート
      // -------------------------------------------
      return models.Project.findByPk(projectId)
        .then((project) => {
          console.log('project ===> ', project)
          if ( parseInt(project.id) !== projectId ) {
            return next(new Error('プロジェクトIDがマッチしませんでした'))
          }

          return project
            .update(
              {
                project_name: postData.project_name,
                project_description: postData.project_description,
                user_id: postData.user_id,
                is_displayed: postData.is_displayed,
                start_time: postData.start_time,
                end_time: postData.end_time
              },
              {
                transaction: transaction
              }
            )
            .then((project) => {
              if ( parseInt(project.id) !== projectId ) {
                // 詳細画面に戻る
                return res.redirect('back')
              }
              // -------------------------------------------
              // 既存登録済み画像を削除した後再度アップデートさせる
              // -------------------------------------------
              return models.ProjectImage.destroy(
                {
                  where: {
                    project_id: project.id
                  }
                },
                {
                  transaction: transaction
                }
              ).then((projectImages) => {
                const updateImageList = []
                postData.image_id.forEach(function (image, index) {
                  updateImageList.push({
                    image_id: image,
                    project_id: project.id
                  })
                })

                return models.ProjectImage.bulkCreate(updateImageList, {
                  transaction: transaction
                }).then((projectImages) => {
                  // 新規で更新したproject_imagesレコード
                  // 明示的なトランザクション
                  transaction.commit()
                  return res.redirect('back')
                })
              })
            })
            .catch((error) => {
              return Promise.reject(error)
            })
        })
        .catch((error) => {
          // transaction rollback
          transaction.rollback()
          return next(new Error(error))
        })
    })
    .catch(function (error) {
      return next(error)
    })
})

// --------------------------------------------------
// 指定したプロジェクトに紐づくタスク一覧を取得する
// --------------------------------------------------
router.get(
  '/task/:projectId',
  [
    check('projectId')
      .custom((value, { req }) => {
        value = parseInt(value)
        return models.Project.findByPk(value)
          .then((project) => {
          })
          .catch((error) => {
            return Promise.reject(error)
          })
      })
      .withMessage('指定したプロジェクトが見つかりません｡')
  ],
  function (req, res, next) {
    const projectId = req.params.projectId

    return models.Project.findByPk(projectId, {
      include: [
        {
          model: models.Task,
          include: [{ model: models.user }, { model: models.Star }]
        }
      ],
      order: [[models.Task, 'id', 'desc']]
    })
      .then((project) => {
        // ビューを返却
        return res.render('project/task', {
          project: project
        })
      })
      .catch((error) => {
        return next(new Error(error))
      })
  }
)

router.post(
  '/delete/:project_id',
  [
    check('project_id')
      .isNumeric()
      .custom(function (value, obj) {
        const projectId = parseInt(value)
        return models.Project.findByPk(projectId).then(function (project) {
        })
      })
  ],
  function (req, res, next) {
    const errors = validationResult(req)
    if ( errors.isEmpty() !== true ) {
      return req.res.redirect('back')
    }
    const body = req.body
    return models.Project.findByPk(parseInt(body.project_id))
      .then((project) => {
        return project
          .destroy()
          .then((project) => {
            return res.redirect('back')
          })
          .catch((error) => {
            throw new Error(error)
          })
      })
      .catch((error) => {
        return next(new Error(error))
      })
  }
)
export default router
// module.exports = router
