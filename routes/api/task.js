import express from 'express'
import models from '../../models/index.js'
import validationRules from '../../config/validationRules.js'
import { validationResult } from 'express-validator'
import applicationConfig from '../../config/application-config.js'
import makeCodeNumber from '../../config/makeCodeNumber.js'
import arrayUnique from '../../config/array-unique'

let router = express.Router()

/**
 * 全タスクを取得する
 */
router.get('/', (req, res, next) => {

})

/**
 * 指定したtaskIdのタスク情報を取得する
 */
router.get('/:id', ...validationRules['task.get'], (req, res, next) => {

  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }

  let taskId = req.params.id

  const db = function () {
    return new Promise((resolve, reject) => {
      return models.Task.findByPk(taskId).then((result) => {
        if ( result !== null ) {
          return resolve(result)
        }
        return Promise.reject('Failed finding task record which you selelcted.')
      }).catch((error) => {
        return Promise.reject(error)
      })
    })
  }

  const init = async function () {
    try {
      let task = await db()
      return task
    } catch ( error ) {
      return Promise.reject(error)
    }
  }
  return init().then((result) => {
    let jsonResponse = {
      status: true,
      code: 200,
      response: result,
    }
    return res.send(jsonResponse)
  }).catch((error) => {
    console.log(error)
    let jsonResponse = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(jsonResponse)
  })
}).get('/:id', (req, res, next) => {
  let jsonResponse = {
    status: false,
    code: 400,
    response: validationResult(req).array(),
  }
  return res.send(jsonResponse)
})

/**
 * 新規タスク情報を登録する
 */
router.post('/create/', ...validationRules['task.create'], (req, res, next) => {
  let postData = req.body
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  console.log(postData)
  // Add new task record.
  const codeNumber = makeCodeNumber(12)
  const db = async function () {
    return new Promise(async (resolve, reject) => {
      try {
        // Make an object to do transaction.
        const tx = await models.sequelize.transaction();
        // Execute the query to tasks table.
        let task = await models.Task.create(
          {
            task_name: postData.task_name,
            task_description: postData.task_description,
            user_id: postData.user_id,
            status: postData.status,
            project_id: postData.project_id,
            priority: postData.priority,
            is_displayed: applicationConfig.binaryType.on,
            code_number: codeNumber,
            start_time: postData.start_time,
            end_time: postData.end_time,
            created_by: user.id
          },
          {
            transaction: tx
          }
        );
        let lastInsertId = null;
        if (task === null) {
          throw new Error("Failed creating new task record on DB.")
        }
        lastInsertId = task.id;
        const imageIDList = arrayUnique(req.body.image_id);
        const imagePromiseList = []
        // タスクの登録が完了したあと､画像とタスクを紐付ける
        imageIDList.forEach((imageId, index) => {
          const pro = models.TaskImage.create(
            {
              image_id: imageId,
              task_id: lastInsertId
            },
            {
              transaction: tx
            }
          )
          imagePromiseList.push(pro)
        })
        let images = await Promise.all(imagePromiseList);
        if (images.length !== imagePromiseList.length) {
          throw new Error("Failed creating image record associated with task record.");
        }
        // トランザクションコミットを実行
        const promiseTransaction = await tx.commit()
        console.log(promiseTransaction);
        // Return the new last insert id.
        return resolve(lastInsertId);
      } catch (error) {
        return reject(error);
      }
    })
  }

  const init = async () => {
    let lastInsertId = await db();
    let task = await models.Task.findByPk({
      include: [
        {model: models.TaskImage}
      ]
    })
    return task;
  }
  return init().then((result) => {
    let jsonResponse = {
      status: true,
      code: 200,
      response: result,
    }
    return res.send(jsonResponse);
  }).catch ((error) => {
    let jsonResponse = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(jsonResponse);
  })
}).post('/create', (req, res, next) => {
  const errors = validationResult(req).array()
  console.log(errors)
  let jsonResponse = {
    status: false,
    code: 400,
    response: errors,
  }
  return res.send(jsonResponse)
})

export default router