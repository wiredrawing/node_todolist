import express from 'express'
import applicationConfig from '../../config/application-config.js'

const router = express.Router()

/**
 * フロントエンド側で使用する優先順位ステータス一覧を返却する
 */
router.get('/', (req, res, next) => {
  console.log(applicationConfig)
  if (applicationConfig.priorityStatusList) {
    let json = {
      status: true,
      code: 200,
      response: {
        priority: applicationConfig.priorityStatusList,
        status: applicationConfig.statusList,
      }
    }
    res.status(200);
    return res.send(json);
  }
  let json = {
    status: false,
    code: 400,
    response: null
  }
  res.status(400);
  return res.send(json);
})

export default router
