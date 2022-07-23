import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
// const models = require('../../models/index.js')
import { check, validationResult } from 'express-validator'
import validationRules from '../../config/validationRules.js'
import makeCodeNumber from '../../config/makeCodeNumber.js'

/**
 * 新規プロジェクトを作成するAPI
 */
router.post('/create', ...validationRules['project.create'], (req, res, next) => {
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  let postData = req.body
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
  const init = async function () {
    try {
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
export default router
// module.exports = router
