var express = require('express');
var router = express.Router();
// モデルロード
const models = require('../models/index.js');
const { check, validationResult } = require("express-validator");

// 画像一覧を取得
router.get('/list', function (req, res, next) {

  // console.log("next => ", next);
  return models.Image.findAll().then((images) => {

    // console.log(images);
    req.images = images;
    return next();
    return res.render("image/index", {
      images: req.images,
    });
  }).catch((error) => {
    console.log("===>", error);
    return next(new Error(error));
  });
});

router.get('/list', function (req, res, next) {
  console.log("中継完了");
  console.log("req.images => ", req.images);
  return res.render("image/index", {
    images: req.images,
  });
});


// ------------------------------------------------------
// 指定したimage_idを削除する
// ------------------------------------------------------
router.post("/delete/:image_id", [
  check("image_id", "削除対象の画像が存在しません").custom(function (value, obj) {
    // value uuid型
    let imageID = value;
    return models.Image.findByPk(imageID).then((image) => {
      console.log("imageID ===> ", imageID);
      console.log("image.id ===> ", image.id);
      console.log(typeof(imageID));
      console.log(typeof(image.id));
      if (image.id !== imageID) {
        return Promise.reject("削除対象の画像が見つかりません");
      }
      return true;
    }).catch((error) => {
      throw new Error(error);
    });
  }),
],
(req, res, next) => {
  console.log(req.body);
  // postデータを変数化
  const postData = req.body;

  const errors = validationResult(req);
  if (errors.isEmpty() !== true) {
    console.log(errors.errors);
    req.session.sessionErrors = errors.errors;
    return res.redirect("back");
  }

  // 対象の画像レコードを取得する
  return models.Image.findByPk(postData.image_id).then((image) => {

    // selectした画像レコードを削除
    return image.destroy().then((del) => {
      console.log("del ===> ", del);
      return res.redirect("back");
    });

  }).catch((error) => {
    console.log("error ===> ", error);
    return next(new Error(error));
  });
});

module.exports = router;
