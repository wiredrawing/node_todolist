let express = require("express");
let router = express.Router();
let models = require("../../models/index.js");
const { v4: uuid} = require("uuid");
const applicationConfig = require("../../config/application-config.js");
const moment = require("moment");
const fs = require("fs");

// ファイルのアップロード処理
router.post("/upload", function (req, res, next) {
  // プライマリキーを生成
  let primaryKey = uuid();
  // アップロードされたオブジェクトを取得
  let uploadFile = req.files.upload_file;
  // アップロードされたファイルの拡張子
  let extension = applicationConfig.mimeTypeList[uploadFile.mimetype];
  // アップロード後のファイルを作成
  let fileName = primaryKey + "." + extension;

  // アップロードされた画像をDBに挿入する
  return models.Image.create({
    id: primaryKey,
    user_id: 1,
    file_name: fileName,
    mimetype: uploadFile.mimetype,
  }).then((image) => {
    // console.log(image);
    // DBへの挿入が確定後､アップロードされたファイルを確定ディレクトリへ移動させる
    let destinationFilePath = "uploaded_images/" + moment(this.updated_at).format("Y/M/D/H") + "/" + fileName;
    return uploadFile.mv(destinationFilePath).then((result) => {
      let response = image.toJSON()
      response.show_image_url = image.getShowImageUrl();
      let json = {
        status: true,
        response: {
          image: response,
        },
      }
      // jsonをhttpレスポンスとして返却する
      return res.json(json);

    }).catch((error) => {
      throw new Error(error);
    });
  }).catch((error) => {
    return next(new Error(error));
  });
});

// アップロード済み画像一覧を返却する
router.get("/image", (req, res, next) => {

  // 現在アップロード済みの画像一覧を取得する
  return models.Image.findAll().then((images) => {

    let json = {
      status: true,
      response: {
        images: images,
      }
    };

    return res.json(json);
  }).catch((error) => {
    return next(new Error(error));
  });
});


// 指定した画像IDを表示する
router.get("/show/:image_id", (req, res, next) => {

  // 閲覧対象の画像ID
  let imageID = req.params.image_id;

  return models.Image.findByPk(imageID).then((image) => {

    if (image === null) {
      return Promise.reject(new Error("指定した画像が見つかりませんでした｡"));
    }
    // console.log(image);
    let destinationFilePath = req.__.applicationPath + "/uploaded_images/" + moment(image.createdAt).format("Y/M/D/H") + "/" + image.file_name;

    // 画像ファイルを読み込み出力する
    fs.readFile(destinationFilePath, function (error, result) {
      // console.log(error);
      if (error !== null) {
        return next(new Error(error));
      }
      res.type(image.mimetype);
      return res.send(result);
    });

  }).catch((error) => {
    return next(new Error(error));
  });
});

module.exports = router;