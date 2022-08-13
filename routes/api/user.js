import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
import applicationConfig from '../../config/application-config.js'
import {Op} from "sequelize";
// const models = require('../../models/index.js')
// ---------------------------------------------------
// 登録中のユーザー情報一覧を取得する
// ---------------------------------------------------
router.get('/', function(req, res, next) {
  let result = null
  // ユーザー情報を取得すると同時に保持しているtaskテーブルのレコードを取得する
  // SELECT
  // ID,
  //   ( SELECT COUNT ( * ) FROM tasks WHERE user_id = "User"."id" ) AS tasksNumber
  // FROM
  // users AS "User"
  // WHERE
  // ( "User"."deleted_at" IS NULL AND ( "User"."is_displayed" = 1 AND "User"."is_deleted" = 0 ) )
  //
  // 登録中のユーザー情報一覧を取得する
  return models.User.findAll({
    include: [
      {
        model: models.Task,
        // where: {
        //   // 表示中,非削除な有効なタスクのみ取得
        //   is_deleted: applicationConfig.binaryType.off,
        //   is_displayed: applicationConfig.binaryType.on,
        //   // 完了済みタスクのみ表示中
        //   status: {
        //     [Op.ne]: 6,
        //   }
        // }
      }
    ],
    where: {
      // 表示中
      is_displayed: applicationConfig.binaryType.on,
      // 非削除
      is_deleted: applicationConfig.binaryType.off,
    }
  }).then(function(users) {
    console.log(users);
    if ( users ) {
      // 成功時のレスポンス
      result = {
        status: true,
        code: 200,
        response: users,
        errors: null
      }
      res.status(200);
      return res.json(result)
    }
    throw new Error('ユーザー情報の取得に失敗しました')
  }).catch((error) => {
    // エラー時のレスポンス
    result = {
      status: false,
      code: 400,
      response: null,
      errors: null,
      message: error.message
    }
    res.status(400);
    return res.json(result)
  })
})

export default router
