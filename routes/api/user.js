import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
import applicationConfig from '../../config/application-config.js'
// const models = require('../../models/index.js')
// ---------------------------------------------------
// 登録中のユーザー情報一覧を取得する
// ---------------------------------------------------
router.get('/', function(req, res, next) {
  let result = null

  // 登録中のユーザー情報一覧を取得する
  return models.user.findAll({
    where: {
      // 表示中
      is_displayed: applicationConfig.binaryType.on,
      // 非削除
      is_deleted: applicationConfig.binaryType.off,
    }
  }).then(function(users) {
    if ( users ) {
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

export default router
