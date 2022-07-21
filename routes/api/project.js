import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
// const models = require('../../models/index.js')
import { check, validationResult } from 'express-validator'
// const { check, validationResult } = require('express-validator')

// 指定したprojectIDに関連するレコード人まとまりを取得する
router.get(
  '/detail/:projectID',
  [
    check('projectID')
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
    const projectID = parseInt(req.params.projectID)
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
