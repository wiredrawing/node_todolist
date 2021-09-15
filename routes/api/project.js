const express = require('express')
const router = express.Router()
const models = require('../../models/index.js')
const { check, validationResult } = require('express-validator')

// 指定したprojectIDに関連するレコード人まとまりを取得する
router.get(
  '/detail/:projectID',
  [
    check('projectID')
      .isNumeric()
      .custom(function (value, obj) {
        // projectIDのバリデーションチェック
        return models.Project.findByPk(value).then(function (project) {
          if (project !== null) {
            return true
          }
          throw new Error('projectレコードが見つかりません')
        })
      })
  ],
  function (req, res, next) {
    const errors = validationResult(req)
    if (errors.isEmpty() !== true) {
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
        { model: models.task }
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

module.exports = router
