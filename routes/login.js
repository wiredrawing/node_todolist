const models = require('../models/index.js')
const bcrypt = require('bcrypt')
const validationRules = require('../config/validationRules.js')
const express = require('express')
const router = express.Router()

// ログインページの表示
router.get('/', function (req, res, next) {
  return res.render('./login/index')
})

// 認証処理
router.post('/authenticate', validationRules['login.index'], function (req, res, next) {
  const email = req.body.email
  const password = req.body.password
  return models.user.findOne({
    where: {
      email: email
    }
  }).then(function (user) {
    if (user === null) {
      throw new Error('ユーザー認証に失敗しました｡')
    }
    // emailからユーザーの存在確認後,パスワードの認証をする
    return bcrypt.compare(password, user.password).then(function (authenticate) {
      if (authenticate !== true) {
        throw new Error('ユーザー認証に失敗しました｡')
      }
      // ログイン情報をセッションに保持
      req.session.isLoggedIn = authenticate
      req.session.user = user

      // my pageへ遷移
      return res.redirect('/')
    }).catch(function (error) {
      throw new Error(error)
    })
  }).catch(function (error) {
    console.log(error)
    return res.redirect('back')
  })
})

module.exports = router
