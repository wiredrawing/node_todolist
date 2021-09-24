const express = require('express')
const router = express.Router()
const models = require('../../models/index.js')
// ---------------------------------------------------
// 登録中のユーザー情報一覧を取得する
// ---------------------------------------------------
router.get('/', function (req, res, next) {
  let result = null

  // 登録中のユーザー情報一覧を取得する
  return models.user.findAll().then(function (users) {
    if (users) {
      // 成功時のレスポンス
      result = {
        status: true,
        response: users,
        errors: null
      }
      return res.json(result)
    }

    throw new Error('ユーザー情報の取得に失敗しました')
  }).catch((error) => {
    // エラー時のレスポンス
    result = {
      status: false,
      response: null,
      errors: null,
      message: error.message
    }
    return res.json(result)
  })
})

module.exports = router
