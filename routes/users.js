var express = require('express');
var router = express.Router();
let models = require("../models/index.js");



/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(models);

  let users = models.user.findAll({
    order: [
      ["id", "asc"]
    ],
    include: [
      {model: models.task}
    ]
  }).then(users => {
    console.log(users);
    let data = {
      users: users,
    };
    users.map(user => {
      console.log("===================>");
      console.log(user.id);
      console.log(user.user_name);
      console.log(user.tasks);
    });
    // ユーザー一覧をビューに表示
    res.render("./user/index", data)
  }).catch((error) => {
    console.log(error);
    res.render("./error/index", error);
  });
});

module.exports = router;
