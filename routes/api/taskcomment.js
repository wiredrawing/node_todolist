import express, { json } from 'express'

let router = express.Router()
import validationRules from '../../config/validationRules.js'
import { check, validationResult } from 'express-validator'
import models from '../../models/index.js'
import { Op } from 'sequelize'
import arrayUnique from '../../config/array-unique.js'

/**
 * 指定したプロジェクトIDにタスクコメントを追加するAPI
 *
 */
router.post('/create', validationRules['taskComment.create'], (req, res, next) => {
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  let postData = req.body
  let imageIdList = req.body.image_id_list
  const init = async function () {

    /**
     *
     * @type {Transaction}
     */
    let tx = await models.sequelize.transaction(null, null)
    let taskComment = await models.TaskComment.create({
      task_id: postData.task_id,
      user_id: postData.user_id,
      comment: postData.comment,
    }, { transaction: tx })
    console.log(taskComment)
    // Fetch the last insert id.
    let taskCommentId = taskComment.id
    let uniqueImageIdList = []
    console.log(imageIdList)
    // Exclude duplicate value.
    uniqueImageIdList = arrayUnique(imageIdList)

    console.log(uniqueImageIdList)
    let commentImagesForBulk = []
    uniqueImageIdList.forEach((value) => {
      commentImagesForBulk.push({
        comment_id: taskCommentId,
        image_id: value,
      })
    })
    console.log(commentImagesForBulk)
    let commentImages = await models.CommentImage.bulkCreate(commentImagesForBulk, { transaction: tx })
    console.log(commentImages)
    if ( commentImages.length !== commentImagesForBulk.length ) {
      throw new Error('Failed inserting comment images.')
    }
    // commit.
    await tx.commit()
    return models.TaskComment.findByPk(taskCommentId, {
      include: [
        {
          model: models.CommentImage,
        }
      ]
    })
  }
  // Return the API response.
  init().then((result) => {
    return res.send({
      status: true,
      code: 200,
      response: result,
    })
  }).catch((error) => {
    console.log(error)
    return res.send({
      status: false,
      code: 400,
      response: error,
    })
  })
}).post('/create', (req, res, next) => {
  // When validation check failed, below process will be executed.
  const errors = validationResult(req).array()
  return res.send({
    status: false,
    code: 400,
    response: errors,
  })
})

/**
 * 指定したTaskIdに紐づくコメント一覧を取得する
 */
router.get('/:taskId', validationRules['taskComment.get'], (req, res, next) => {
  let taskId = req.params.taskId
  return models.TaskComment.findAll({
    where: {
      task_id: {
        [Op.eq]: taskId,
      }
    },
    include: [
      {
        model: models.CommentImage,
      },
      {
        model: models.Task,
      }
    ]
  }).then((taskComments) => {
    let jsonResponse = {
      status: true,
      code: 200,
      response: taskComments
    }
    return res.send(jsonResponse)
  }).catch((error) => {
    console.log(error)
    let jsonResponse = {
      status: false,
      code: 400,
      response: error
    }
    return res.send(jsonResponse)
  })
})

export default router
