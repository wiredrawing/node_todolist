var express = require("express");
const { DatabaseError } = require("pg");
var router = express.Router();
// モデルロード
const models = require("../models/index.js");
const applicationConfig = require("../config/application-config.js");

let priorityStatusNameList = {};
applicationConfig["priorityStatusList"].forEach((data, index) => {
  priorityStatusNameList[data.id] = data.value;
});
let taskStatusNameList = {};
applicationConfig["statusList"].forEach((data, index) => {
  taskStatusNameList[data.id] = data.value;
});

/* GET home page. */
router.get("/", function (req, res, next) {
  let user = req.session.user;
  // ログイン中ユーザーの作業中タスク
  let tasks = [];

  models.task
    .findAll({
      include: [
        { model: models.Project },
        { model: models.Star }
      ],
      where: {
        user_id: user.id,
      },
      // 締切が早い順
      order: [
        ["end_time", "asc"],
        ["priority", "desc"]
      ],
    })
    .then(function (tasks) {
      console.log("tasks => ", tasks);
      // TOPページをレンダリング
      res.render("./top/index", {
        tasks: tasks,
        priorityStatusNameList: priorityStatusNameList,
        taskStatusNameList: taskStatusNameList,
      });
    })
    .catch(function (error) {
      // エラーハンドリング
      return next(new Error(error));
    });
});

module.exports = router;
