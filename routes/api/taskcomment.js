import express from 'express'

let router = express.Router()
import validationRules from '../../config/validationRules.js'
import { check, validationResult } from 'express-validator'
import models from '../../models/index.js'

/**
 * 指定したプロジェクトIDにタスクコメントを追加するAPI
 *
 */
router.post('/create/:projectId', validationRules['taskComment.create'], (req, res, next) => {
  const errors = validationResult(req)
  // console.log(errors.array())
  let postData = req.body
  let imageIdList = req.body.image_id_list
  // console.log(postData)
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
    console.log(imageIdList);
    imageIdList.filter((value, index) => {
      if ( uniqueImageIdList.indexOf(value) === -1 ) {
        uniqueImageIdList.push(value)
      }
    })
    console.log(uniqueImageIdList);
    let commentImagesForBulk = []
    uniqueImageIdList.forEach((value) => {
      commentImagesForBulk.push({
        comment_id: taskCommentId,
        image_id: value,
      })
    })
    console.log(commentImagesForBulk)
    let commentImages = await models.CommentImage.bulkCreate(commentImagesForBulk, {transaction: tx});
    console.log(commentImages);
    if (commentImages.length !== commentImagesForBulk.length) {
      throw new Error("Failed inserting comment images.");
    }
    // commit.
    await tx.commit();
    return models.TaskComment.findByPk(taskCommentId, {
      include: [
        {
          model: models.CommentImage,
        }
      ]
    });
  }
  // Return the API response.
  init().then((result) => {
    return res.send({
      status: true,
      code: 200,
      response: result,
    });
  }).catch((error) => {
    console.log(error)
    return res.send({
      status: false,
      code: 400,
      response: error,
    });
  })
})

export default router
