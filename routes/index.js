var express = require('express');
const { DatabaseError } = require('pg');
var router = express.Router();

const models = require("../models");
/* GET home page. */
console.log(models.user);
console.log(models.task);
router.get('/', function(req, res, next) {
  // モデルに新規レコード追加
  console.log(models.user);
  let user = models.user.create( {
    user_name: "ああ",
  }).then((data) => {
    console.log(data);
    return data;
  }).catch((error) => {
    console.log(error);
    return null;
  }).then((data) => {
    console.log(data);
    // 子テーブルにレコード挿入
    let task = models.task.create( {
      task_name: "作業名を記述",
      status: 1,
      user_id: data.id,
    }).then(data => {
      console.log(data);
      return data;
    }).catch((error) => {
      return null;
    });
  });


  // Promise.all([
  //   user,
  //   task,
  // ]).then(result => {
  //   console.log(result);
  // });

  res.render('index', { title: 'Express' });
});

router.get("/list", (req, res, next) => {
  let users = models.user.findAll({
    order: [
      ["id", "asc"],
    ],
    include: [
      {model: models.task}
    ]
  }).then(users => {
    users.map((user, index) => {
      console.log("===========================>");
      console.log(user.tasks);
      console.log(user);
      console.log(index);
    });
  });
  res.send("-==");
});

module.exports = router;
