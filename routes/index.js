const express = require('express')
const router = express.Router()
// モデルロード
const models = require('../models/index.js')
const applicationConfig = require('../config/application-config.js')

const priorityStatusNameList = {}
applicationConfig.priorityStatusList.forEach((data, index) => {
  priorityStatusNameList[data.id] = data.value
})
const taskStatusNameList = {}
applicationConfig.statusList.forEach((data, index) => {
  taskStatusNameList[data.id] = data.value
})

/* GET home page. */
router.get('/', function (req, res, next) {
  const user = req.session.user

  // 担当中タスク
  const taskPromise = models.task.findAll({
    include: [
      {
        model: models.Project
      },
      { model: models.Star }
    ],
    // ログイン中ユーザーのタスク
    where: {
      user_id: user.id
    },
    // 締切が早い順
    order: [
      ['end_time', 'asc'],
      ['priority', 'desc']
    ]
  })

  // 作成したproject
  const projectPromise = models.Project.findAll({
    where: {
      by_user_id: req.session.user.id
    },
    include: {
      model: models.task
    }
  })

  return Promise.all([taskPromise, projectPromise])
    .then(function (data) {
      const tasks = data[0]
      const projects = data[1]
      console.log('projects---->', projects)
      // TOPページをレンダリング
      return res.render('./top/index', {
        tasks: tasks,
        projects: projects,
        priorityStatusNameList: priorityStatusNameList,
        taskStatusNameList: taskStatusNameList
      })
    })
    .catch(function (error) {
      // エラーハンドリング
      return next(new Error(error))
    })
})

module.exports = router
