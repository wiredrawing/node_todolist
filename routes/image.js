const express = require('express')
const router = express.Router()
// モデルロード
const models = require('../models/index.js')
const { check, validationResult } = require('express-validator')

// 画像一覧を取得
router.get('/list', function (req, res, next) {
  return models.Image.findAll()
    .then((images) => {
      req.images = images
      return next()
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

router.get('/list', function (req, res, next) {
  return res.render('image/index', {
    images: req.images
  })
})

// ------------------------------------------------------
// 指定したimage_idを削除する
// ------------------------------------------------------
router.post(
  '/delete/:image_id',
  [
    check('image_id', '削除対象の画像が存在しません').custom(function (value, obj) {
      // value uuid型
      const imageID = value
      return models.Image.findByPk(imageID)
        .then((image) => {
          if (image.id !== imageID) {
            return Promise.reject('削除対象の画像が見つかりません')
          }
          return true
        })
        .catch((error) => {
          throw new Error(error)
        })
    })
  ],
  (req, res, next) => {
    // postデータを変数化
    const postData = req.body

    const errors = validationResult(req)
    if (errors.isEmpty() !== true) {
      req.session.sessionErrors = errors.errors
      return res.redirect('back')
    }

    // 対象の画像レコードを取得する
    return models.Image.findByPk(postData.image_id)
      .then((image) => {
        // selectした画像レコードを削除
        return image.destroy().then((del) => {
          return res.redirect('back')
        })
      })
      .catch((error) => {
        return next(new Error(error))
      })
  }
)

module.exports = router
