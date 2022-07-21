import express from 'express'
// const express = require('express')
import validationRules from '../../config/validationRules.js'
// const validationRules = require('../../config/validationRules')
const router = express.Router()
import models from '../../models/index.js'
// const models = require('../../models/index.js')

router.post('/:taskId', validationRules['star.create'], function (req, res, next) {
  console.log('star api')
  // バリデーションの実行

  return new Promise(function (resolve, reject) {
    if ( req.executeValidationCheck(req) ) {
      return resolve(true)
    }
    return reject(new Error('バリデーションに失敗しました'))
  }).then(function (data) {
    // 各種IDをNumber型へキャスト
    const userId = parseInt(req.body.user_id)
    const taskId = parseInt(req.body.task_id)
    return models.Star.create({
      user_id: userId,
      task_id: taskId
    }).then(function (star) {
      if ( star !== null && parseInt(star.user_id) === userId ) {
        // json レスポンスを返却
        // 正常系 response
        const jsonResponse = {
          status: true,
          code: 200,
          response: star
        }
        return res.json(jsonResponse)
      }
      throw new Error('スターリングに失敗しました')
    }).catch(function (error) {
      // json レスポンスを返却
      const jsonResponse = {
        status: false,
        code: 400,
        response: null,
        error: error
      }
      // エラー系 response
      return res.json(jsonResponse)
    })
  }).catch(function (error) {
    const validationErrors = req.session.validationErrors
    // json レスポンスを返却
    const jsonResponse = {
      status: false,
      code: 400,
      response: validationErrors,
      error: error
    }
    // エラー系 response
    return res.json(jsonResponse)
  })
})

export default router
// module.exports = router
