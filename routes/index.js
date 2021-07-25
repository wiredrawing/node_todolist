var express = require('express');
const { DatabaseError } = require('pg');
var router = express.Router();

// モデルロード
const models = require("../models/index.js")

/* GET home page. */
router.get('/', function(req, res, next) {

  // TOPページをレンダリング
  res.render("./top/index", {

  });
});

module.exports = router;
