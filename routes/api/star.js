import express, { json } from 'express'
import validationRules from '../../config/validationRules.js'

const router = express.Router()
import models from '../../models/index.js'
import { validationResult } from 'express-validator'

router.post('/:taskId', validationRules['star.create'], function (req, res, next) {
  console.log('Start creating \'create star api\' --------------------------')
  const errors = validationResult(req)
  const postData = req.body
  const taskId = req.body.task_id
  console.log(req.body)
  // バリデーションチェックを実行
  if ( errors.isEmpty() !== true ) {
    const sessionErrors = {}
    console.log(errors.array())
    errors.errors.forEach((error, index) => {
      sessionErrors[error.param] = error.msg
    })
    // エラーをsessionに確保
    req.session.sessionErrors = sessionErrors
    return res.redirect('back')
  }

  (async function () {
    let tx = await models.sequelize.transaction()
    try {
      // Fetch the transaction object.
      // スターを送られたタスクレコードも更新のみ実行する
      let newStar = {
        task_id: postData.task_id,
        user_id: postData.user_id,
      }
      let star = await models.Star.create(newStar,
        {
          transaction: tx
        })
      if ( star === null ) {
        throw new Error('Failed creating new star record')
      }
      let task = await models.Task.findByPk(taskId, {
        transaction: tx
      })
      let result = await task.update(taskId, {
          updated_at: new Date()
        },
        {
          transaction: tx
        })
      console.log(result)
      // If the database was updated with a specified query correctly, do commit.
      await tx.commit()
      let totalStar = await models.Star.findOne({
        raw: true,
        where: {
          task_id: postData.task_id,
        },
        attributes: [
          [models.sequelize.fn("count", models.sequelize.col("id")), "stars"],
        ]
      });
      console.log(totalStar);
      console.log('Finished creating \'create star api\' --------------------------')
      // Return the json response.
      const jsonResponse = {
        status: true,
        code: 200,
        response: totalStar,
      }
      return Promise.resolve(jsonResponse);
    } catch ( error ) {
      await tx.rollback()
      console.log('Finished creating \'create star api\' --------------------------')
      return Promise.reject(error);
    }
  })().then((jsonResponse) => {
    return res.json(jsonResponse)
  }).catch((error) => {
    const jsonResponse = {
      status: false,
      code: 400,
      response: error,
      error: error
    }
    // エラー系 response
    return Promise.reject(jsonResponse)
  })
})

export default router
// module.exports = router
