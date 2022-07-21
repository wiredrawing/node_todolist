import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
// const models = require('../../models/index.js')
import { v4 as uuid } from 'uuid';
// const { v4: uuid } = require('uuid')
import applicationConfig from '../../config/application-config.js'
// const applicationConfig = require('../../config/application-config.js')
import moment from 'moment'
// const moment = require('moment')
import fs from 'fs'
// const fs = require('fs')

// ファイルのアップロード処理
router.post('/upload', function (req, res, next) {
  // プライマリキーを生成
  const primaryKey = uuid()
  // アップロードされたオブジェクトを取得
  const uploadFile = req.files.upload_file
  // アップロードされたファイルの拡張子
  const extension = applicationConfig.mimeTypeList[uploadFile.mimetype]
  // アップロード後のファイルを作成
  const fileName = primaryKey + '.' + extension

  // アップロードされた画像をDBに挿入する
  return models.Image.create({
    id: primaryKey,
    user_id: 1,
    file_name: fileName,
    mimetype: uploadFile.mimetype
  })
    .then((image) => {
      // console.log(image);
      // DBへの挿入が確定後､アップロードされたファイルを確定ディレクトリへ移動させる
      const destinationFilePath = 'uploaded_images/' + moment(this.updated_at).format('Y/M/D/H') + '/' + fileName
      return uploadFile
        .mv(destinationFilePath)
        .then((result) => {
          const response = image.toJSON()
          response.show_image_url = image.getShowImageUrl()
          const json = {
            status: true,
            response: {
              image: response
            }
          }
          // jsonをhttpレスポンスとして返却する
          return res.json(json)
        })
        .catch((error) => {
          throw new Error(error)
        })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

// アップロード済み画像一覧を返却する
router.get('/image', (req, res, next) => {
  // 現在アップロード済みの画像一覧を取得する
  return models.Image.findAll()
    .then((images) => {
      const json = {
        status: true,
        response: {
          images: images
        }
      }

      return res.json(json)
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

// 指定した画像IDを表示する
router.get('/show/:image_id', (req, res, next) => {
  // 閲覧対象の画像ID
  const imageID = req.params.image_id

  return models.Image.findByPk(imageID)
    .then((image) => {
      if ( image === null ) {
        return Promise.reject(new Error('指定した画像が見つかりませんでした｡'))
      }
      // console.log(image);
      const destinationFilePath = req.applicationPath + '/uploaded_images/' + moment(image.createdAt).format('Y/M/D/H') + '/' + image.file_name

      // 画像ファイルを読み込み出力する
      fs.readFile(destinationFilePath, function (error, result) {
        // console.log(error);
        if ( error !== null ) {
          return next(new Error(error))
        }
        res.type(image.mimetype)
        return res.send(result)
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

export default router
// module.exports = router
