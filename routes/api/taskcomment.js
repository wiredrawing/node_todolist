import express from 'express'

let router = express.Router()
import validationRules from '../../config/validationRules.js'
import { check, validationResult } from 'express-validator'
import models from "../../models/index.js";
/**
 * 指定したプロジェクトIDにタスクコメントを追加するAPI
 */
router.post('/create/:projectId', validationRules['taskComment.create'], (req, res, next) => {

  const errors = validationResult(req)
  console.log(errors.array())
  let postData = req.body;
  let projectId = req.params.projectId
  console.log(postData);
  const init = async function () {
    let taskComment = await models.TaskComment.create( {
      task_id: postData.task_id,
      user_id: postData.user_id,
      comment: postData.comment,
    });
    console.log(taskComment);
  }
  init().then((result) => {

  }).catch((error) => {
    console.log(error);
  })
})

export default router
