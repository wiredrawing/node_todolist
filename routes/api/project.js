import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
// const models = require('../../models/index.js')
import { check, validationResult } from 'express-validator'
import validationRules from '../../config/validationRules.js'
import makeCodeNumber from '../../config/makeCodeNumber.js'
import { Op } from 'sequelize'

/**
 * 新規プロジェクトを作成するAPI
 */
router.post('/create', ...validationRules['project.create'], (req, res, next) => {
  console.log(req.body);
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  let postData = req.body
  let codeNumber = makeCodeNumber();

  const init = async function () {
    try {
      // Check the variable codeNumber.
      let checkCodeNumber = await models.Project.findOne({
        where: {
          code_number: codeNumber,
        }
      })
      if (checkCodeNumber !== null) {

        throw new Error("現在,サーバーが混み合っているようです.もう一度試して見て下さい");
      }

      // Constract a object data to want to toregister afresh.
      let insertProject = {
        project_name: postData.project_name,
        project_description: postData.project_description,
        // user_idは当該プロジェクトのリーダーになるID
        user_id: postData.user_id,
        is_displayed: postData.is_displayed,
        code_number: makeCodeNumber(),
        start_time: postData.start_time,
        end_time: postData.end_time,
        // created_by: req.session.user.id
      }
      let project = await models.Project.create(insertProject)
      if ( project !== null ) {
        return project
      }
      return Promise.reject('新規プロジェクトの作成に失敗しました')
    } catch ( error ) {
      return Promise.reject(error)
    }
  }
  return init().then((result) => {
    return res.send({
      status: true,
      code: 200,
      response: result,
    })
  }).catch((error) => {
    return res.send({
      status: false,
      code: 400,
      response: error,
    })
  })
}).post('/create', (req, res, next) => {
  const errors = validationResult(req).array()
  return res.send({
    status: false,
    code: 400,
    response: errors,
  })
})

// 指定したprojectIDに関連するレコード人まとまりを取得する
router.get(
  '/detail/:projectId',
  [
    check('projectId')
      .isNumeric()
      .custom(function (value, obj) {
        // projectIDのバリデーションチェック
        return models.Project.findByPk(value).then(function (project) {
          if ( project !== null ) {
            return true
          }
          throw new Error('projectレコードが見つかりません')
        })
      })
  ],
  function (req, res, next) {
    const errors = validationResult(req)
    if ( errors.isEmpty() !== true ) {
      return res.redirect('back')
    }
    const projectID = parseInt(req.params.projectId)
    return models.Project.findByPk(projectID, {
      include: [
        {
          model: models.ProjectImage,
          include: [{ model: models.Image }]
        },
        { model: models.user },
        { model: models.Task }
      ]
    })
      .then(function (project) {
        const result = {
          status: true,
          code: 200,
          response: {
            project: project
          }
        }
        return res.json(result)
      })
      .catch(function (error) {
        const result = {
          status: false,
          code: 400,
          response: {
            project: null
          },
          error: error
        }
        return res.json(result)
      })
  }
)

/**
 * 指定したキーワードでプロジェクトを検索する
 * (※リレーション先のたtasksテーブル及びtask_commentsテーブルも検索対象とする
 */
router.get('/search/:keyword?', (req, res, next) => {

  let keyword = ''
  if ( req.params.keyword ) {
    keyword = req.params.keyword
  } else {
    keyword = ''
  }
  console.log(keyword)
  const init = async function () {
    try {
      let projects = await models.Project.findAll({
        include: [
          // リレーション先テーブルの設定
          {
            model: models.Task,
            include: [
              { model: models.TaskComment, }
            ]
          },
          { model: models.user, }
        ],
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
            {
              code_number: {
                [Op.like]: '%' + keyword + '%',
              },
            },
            {
              '$Tasks.task_name$': {
                [Op.like]: '%' + keyword + '%'
              },
            },
            {
              '$Tasks.task_description$': { [Op.like]: '%' + keyword + '%' },
            },
            {
              '$Tasks.TaskComments.comment$': { [Op.like]: '%' + keyword + '%' },
            }
          ]
        }
      })
      if ( projects.length > 0 ) {
        console.log(projects.length)
        return projects
      }
      return Promise.reject(new Error('該当するProjectデータが見つかりません'))
    } catch ( error ) {
      console.log(error)
      return Promise.reject(error)
    }
  }
  // 実行
  return init().then((result) => {
    console.log(result)
    let jsonResponse = {
      status: true,
      code: 200,
      response: result,
    }
    return res.send(jsonResponse)
  }).catch((error) => {
    console.log(error)
    let jsonResponse = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(jsonResponse)
  })
})
export default router
// module.exports = router
