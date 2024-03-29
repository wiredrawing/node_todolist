import express from 'express'
import models from '../../models/index.js'
import validationRules from '../../config/validationRules.js'
import { validationResult } from 'express-validator'
import applicationConfig from '../../config/application-config.js'
import makeCodeNumber from '../../config/makeCodeNumber.js'
import arrayUnique from '../../config/array-unique.js'
import pkg from 'sequelize'

const { Op } = pkg

let router = express.Router()

/**
 * projectIdに問わずに全タスク一覧を取得する
 * keywordクエリで文字検索を行う
 */
router.get('/', ...validationRules['task.search'], (req, res, next) => {
  // リクエストされたqueryパラメータ
  let queries = req.query

  /**
   * 全タスクを取得する
   * @returns {Promise<void>}
   */
  const db = async () => {
    return new Promise((resolve, reject) => {
      let condition = {
        include: [
          {
            model: models.Star,
          },
          {
            model: models.Project,
            required: true,
          },
          {
            model: models.TaskComment,
            include: [
              {
                model: models.CommentImage,
              }
            ]
          }
        ],
        order: [
          ['end_date', 'desc'],
          ['id', 'desc']
        ],
      }
      // 検索用のフリーワードが設定されている場合
      if ( queries.keyword ) {
        condition['where'] = {
          [Op.or]: {
            task_name: {
              [Op.like]: '%' + queries.keyword + '%',
            },
            task_description: {
              [Op.like]: '%' + queries.keyword + '%',
            },
            '$Project.project_name$': {
              [Op.like]: '%' + queries.keyword + '%',
            },
            '$Project.project_description$': {
              [Op.like]: '%' + queries.keyword + '%',
            },
            '$TaskComments.comment$': {
              [Op.like]: '%' + queries.keyword + '%',
            }
          }
        }
      }

      models.Task.findAll(condition).then((result) => {
        // // console.log(result)
        resolve(result)
      }).catch((error) => {
        return Promise.reject(error)
      })
    })
  }

  const init = async () => {
    let tasks = await db()
    return tasks
  }

  return init().then((result) => {
    let json = {
      status: true,
      code: 200,
      response: result,
    }
    return res.send(json)
  }).catch((error) => {
    let json = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(json)
  })
})

// /**
//  * 指定したprojectIdに紐づく全タスクを取得する
//  * /?keyword=something でフリワード検索を行う
//  */
// router.get('/:projectId', ...validationRules['task.project.get'], (req, res, next) => {
//   let queries = req.query
//   const errors = validationResult(req)
//   if ( errors.isEmpty() !== true ) {
//     return next()
//   }
//   const db = (queries) => {
//     return new Promise((resolve, reject) => {
//       let condition = {
//         where: {
//           project_id: {
//             [Op.eq]: req.params.projectId
//           },
//         },
//         include: [
//           {
//             model: models.Project,
//             required: true,
//           },
//           {
//             model: models.TaskComment,
//           }
//         ]
//       }
//       if ( queries.keyword ) {
//         condition['where'][Op.or] = {
//           task_name: {
//             [Op.like]: '%' + queries.keyword + '%',
//           },
//           task_description: {
//             [Op.like]: '%' + queries.keyword + '%',
//           },
//           '$TaskComments.comment$': {
//             [Op.like]: '%' + queries.keyword + '%',
//           }
//         }
//       }
//       // console.log(condition)
//       return models.Task.findAll(condition).then((result) => {
//         resolve(result)
//       }).catch((error) => {
//         // console.log(error)
//         reject(error)
//       })
//     })
//   }
//
//   const init = async () => {
//     try {
//       let tasks = await db(queries)
//       return tasks
//     } catch ( error ) {
//       // console.log(error)
//       return null
//     }
//   }
//
//   // Return the json response.
//   return init().then((result) => {
//     // console.log(result)
//     let json = {
//       status: true,
//       code: 200,
//       response: result,
//     }
//     return res.send(json)
//   }).catch((error) => {
//     let json = {
//       status: false,
//       code: 400,
//       response: error,
//     }
//     return res.send(json)
//   })
//
// }).get('/:projectId', (req, res, next) => {
//   const errors = validationResult(req)
//   let json = {
//     status: false,
//     code: 400,
//     response: errors,
//   }
//   return res.send(json)
// })

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
      return models.Task.findByPk(taskId, {
        include: [
          {
            model: models.TaskComment,
            include: [{
              model: models.CommentImage,
            }],
          },
          {
            model: models.TaskImage,
          },
          {
            model: models.User,
          },
          {
            model: models.Project,
          }
        ],
        order: [
          [models.TaskComment, "id", "desc"]
        ]
      }).then((result) => {
        if ( result !== null ) {
          // // console.log(result)
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
    // console.log(error)
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
router.post('/create', ...validationRules['task.create'], (req, res, next) => {
  let postData = req.body
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  // console.log('Pass validation check.')
  // Add new task record.
  const codeNumber = makeCodeNumber(12)
  const db = async function () {
    return new Promise(async (resolve, reject) => {
      try {
        // Make an object to do transaction.
        const tx = await models.sequelize.transaction()
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
            is_deleted: applicationConfig.binaryType.off,
            code_number: codeNumber,
            start_date: postData.start_date,
            end_date: postData.end_date,
            // created_by: user.id
            created_by: 1,
          },
          {
            transaction: tx
          }
        )
        let lastInsertId = null
        if ( task === null ) {
          throw new Error('Failed creating new task record on DB.')
        }
        // console.log(task.id)
        lastInsertId = task.id
        const imageIDList = arrayUnique(req.body.image_id)
        const imagePromiseList = []
        // タスクの登録が完了したあと､画像とタスクを紐付ける
        // console.log(imageIDList);
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
        let images = await Promise.all(imagePromiseList)
        if ( images.length !== imagePromiseList.length ) {
          throw new Error('Failed creating image record associated with task record.')
        }
        // トランザクションコミットを実行
        const promiseTransaction = await tx.commit()
        console.log("promiseTransaction -----> ", promiseTransaction)
        task = await models.Task.findByPk(lastInsertId, {
          include: [
            { model: models.TaskImage }
          ]
        })
        return resolve(task)
      } catch ( error ) {
        // console.log(error)
        return reject(error)
      }
    })
  }

  const init = async () => {
    let task = await db()
    return task
  }
  return init().then((result) => {
    let jsonResponse = {
      status: true,
      code: 200,
      response: result,
    }
    return res.send(jsonResponse)
  }).catch((error) => {
    let jsonResponse = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(jsonResponse)
  })
}).post('/create', (req, res, next) => {
  const errors = validationResult(req).array()
  // console.log(errors)
  let jsonResponse = {
    status: false,
    code: 400,
    response: errors,
  }
  return res.send(jsonResponse)
})

/**
 * 指定したタスクIDの情報を更新する
 * TODO: tasksテーブルの更新処理後,task_imagesテーブルの更新処理を追加する
 */
router.post('/update/:taskId', ...validationRules['task.update'], async (req, res, next) => {
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  const tx = await models.sequelize.transaction();
  try {
    let postData = req.body
    // 更新用オブジェクト
    let updateTask = {
      task_name: postData.task_name,
      task_description: postData.task_description,
      user_id: postData.user_id,
      status: postData.status,
      project_id: postData.project_id,
      priority: postData.priority,
      is_displayed: postData.is_displayed,
      start_date: postData.start_date,
      end_date: postData.end_date,
    }
    let task = await models.Task.findByPk(postData.task_id, {
      transaction: tx,
      // for update
      lock: tx.LOCK.UPDATE,
      // include: [
      //   {
      //     model: models.Project,
      //   },
      //   {
      //     model: models.TaskComment,
      //     include: [
      //       {
      //         model: models.CommentImage,
      //       }
      //     ]
      //   }
      // ],
    })
    if ( task === null ) {
      throw new Error('指定したタスク情報が見つかりません')
    }
    let result = await task.update(updateTask, {
      transaction: tx,
    })
    // 既存のタスク画像を削除する
    let deletedTaskImages = await models.TaskImage.destroy({
      where: {
        task_id: postData.task_id,
      },
      transaction: tx,
    })
    console.log("deletedTaskImages -----> ",  deletedTaskImages);

    // タスク用画像が存在する場合
    if (postData.image_id.length > 0) {
      let updateTaskImages = [];
      postData.image_id.forEach((value) => {
        updateTaskImages.push({
          task_id: postData.task_id,
          image_id: value,
        })
      })
      let newestTaskImages = await models.TaskImage.bulkCreate(updateTaskImages, {
        transaction: tx,
      });
      console.log("newestTaskImages -----> ", newestTaskImages);
    }

    let commitResult = await tx.commit();
    console.log("commitResult ====> ", commitResult);
    let jsonResponse = {
      status: true,
      code: 200,
      response: result,
    }
    return res.send(jsonResponse)
  } catch ( error ) {
    let rollbackResult = await tx.rollback();
    console.log(error);
    console.log("rollbackResult ---> ", rollbackResult);
    let jsonResponse = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(jsonResponse)
  }
}).post('/update/:taskId', (req, res, next) => {
  let jsonResponse = {
    status: false,
    code: 400,
    response: validationResult(req).array(),
  }
  return res.send(jsonResponse)
})

export default router
