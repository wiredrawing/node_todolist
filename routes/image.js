var express = require('express');
const { DatabaseError } = require('pg');
var router = express.Router();

// モデルロード
const models = require('../models/index.js');


// 画像一覧を取得
router.get('/list', function (req, res, next) {

  console.log("next => ", next);
  return models.Image.findAll().then((images) => {

    console.log(images);
    req.images = images;
    return res.render("image/index", {
      images: req.images,
    });
    return next();
  }).catch((error) => {
    console.log("===>");
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
module.exports = router;
