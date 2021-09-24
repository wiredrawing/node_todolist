const express = require('express')
const router = express.Router()
// モデルロード
const models = require('../models/index.js')
const applicationConfig = require('../config/application-config.js')
const { Op } = require('Sequelize')

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
      user_id: user.id,
      status: {
        // where status < applicationConfig.status.finish
        [Op.lt]: applicationConfig.status.finish
      }
    },
    // 締切が早い順
    order: [
      ['end_time', 'asc'],
      ['priority', 'desc']
    ]
  })

  // ログインユーザーが担当する完了したタスク一覧 最新10件を取得
  const completedTasks = models.task.findAll({
    where: {
      user_id: req.session.user.id,
      status: applicationConfig.status.finish
    },
    limit: 10
  })

  // 作成したproject
  const projectPromise = models.Project.findAll({
    where: {
      created_by: req.session.user.id
    },
    include: {
      model: models.task
    }
  })

  return Promise.all([taskPromise, projectPromise, completedTasks])
    .then(function (data) {
      const tasks = data[0]
      const projects = data[1]
      const completedTasks = data[2]
      console.log('projects---->', projects)
      console.log('completed tasks ----->', completedTasks)
      // TOPページをレンダリング
      return res.render('./top/index', {
        tasks: tasks,
        projects: projects,
        priorityStatusNameList: priorityStatusNameList,
        taskStatusNameList: taskStatusNameList,
        completedTasks: completedTasks
      })
    })
    .catch(function (error) {
      // エラーハンドリング
      return next(new Error(error))
    })
})

module.exports = router
