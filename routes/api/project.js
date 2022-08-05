import express from 'express'
// const express = require('express')
const router = express.Router()
import models from '../../models/index.js'
// const models = require('../../models/index.js')
import { check, validationResult } from 'express-validator'
import validationRules from '../../config/validationRules.js'
import makeCodeNumber from '../../config/makeCodeNumber.js'
import { Op } from 'sequelize'

// 新規プロジェクト作成用API
// The data required when requesting with post method to make new project data.
// {
//   "project_name": "新規作成用プロジェクト名",
//   "project_description": "新規作成用プロジェクト概要",
//   "is_displayed": 1,
//   "start_date": "2022-05-05",
//   "end_date": "2022-09-09",
//   "user_id": 1,
//   "image_id": []
// }
// End point.
// http://localhost:3000/api/project/create/
router.post('/create', ...validationRules['project.create'], (req, res, next) => {
  // console.log(req.body)
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  let postData = req.body
  let codeNumber = makeCodeNumber()
  // console.log(codeNumber)

  const init = async function () {
    try {
      // Make a transaction.
      let tx = await models.sequelize.transaction();
      // Check the variable codeNumber.
      let checkCodeNumber = await models.Project.findOne({
        where: {
          code_number: codeNumber,
        },
        transaction: tx,
      })
      if ( checkCodeNumber !== null ) {
        throw new Error('現在,サーバーが混み合っているようです.もう一度試して見て下さい')
      }

      // Constract a object data to want to toregister afresh.
      let insertProject = {
        project_name: postData.project_name,
        project_description: postData.project_description,
        // user_idは当該プロジェクトのリーダーになるID
        user_id: postData.user_id,
        is_displayed: postData.is_displayed,
        code_number: makeCodeNumber(),
        start_date: postData.start_date,
        end_date: postData.end_date,
        // created_by: req.session.user.id
      }
      let project = await models.Project.create(insertProject, {
        transaction: tx,
      });
      if ( project !== null ) {
        // console.log("project --------------->", project);
        // projectsテーブルへの挿入が成功した場合
        // project_imagesテーブルへの画像レコードの挿入処理を行う
        let images = [];
        postData.image_id.forEach((value, index) => {
          images.push({
            image_id: value,
            project_id: project.id,
          })
        })
        // console.log(images);
        let projectImages = await models.ProjectImage.bulkCreate(images, {
          transaction: tx
        });
        if (images.length === projectImages.length) {
          await tx.commit();
          // console.log(projectImages);
          return project
        }
        return Promise.reject("projectsテーブルへの変更は完了しましたが,project_imagesテーブルへの反映に失敗しました");
      }
      return Promise.reject('新規プロジェクトの作成に失敗しました')
    } catch ( error ) {
      await tx.rollback();
      return Promise.reject(error)
    }
  }
  return init().then((result) => {
    return res.send({
      status: true,
      code: 200,
      response: result,
    })
  }).catch((error) => {
    return res.send({
      status: false,
      code: 400,
      response: error,
    })
  })
}).post('/create', (req, res, next) => {
  const errors = validationResult(req).array()
  return res.send({
    status: false,
    code: 400,
    response: errors,
  })
})

// ----------------------------------------------------
// 指定したprojectIDに関連するレコードひとまとまりを取得する
// ----------------------------------------------------
router.get('/detail/:projectId', ...validationRules['project.detail.get'], async (req, res, next) => {
  const errors = validationResult(req)
  if ( errors.isEmpty() !== true ) {
    return next()
  }
  const projectId = parseInt(req.params.projectId)
  const db = async () => {
    let project = await models.Project.findByPk(projectId, {
      include: [
        {
          model: models.ProjectImage,
          include: [{ model: models.Image }]
        },
        { model: models.user },
        {
          model: models.Task,
          include: [{ model: models.TaskComment }]
        }
      ]
    })
    if ( project === null ) {
      return Promise.reject('指定したproject idのデータが見つかりません')
    }
    return project
  }

  return db().then((result) => {
    const json = {
      status: true,
      code: 200,
      response: result
    }
    return res.json(json)
  })
}).get('/detail/:projectId', (req, res, next) => {
  const json = {
    status: false,
    code: 400,
    response: validationResult(req).array(),
  }
  return res.send(json)
})

/**
 * 指定したキーワードでプロジェクトを検索する
 * (※リレーション先のたtasksテーブル及びtask_commentsテーブルも検索対象とする
 */
router.get('/search/:keyword?', (req, res, next) => {

  let keyword = ''
  if ( req.params.keyword ) {
    keyword = req.params.keyword
  } else {
    keyword = ''
  }
  // console.log(keyword)
  const init = async function () {
    try {
      let projects = await models.Project.findAll({
        include: [
          // リレーション先テーブルの設定
          {
            model: models.Task,
            include: [
              { model: models.TaskComment, }
            ]
          },
          { model: models.user, }
        ],
        where: {
          [Op.or]: [
            {
              project_name: {
                [Op.like]: '%' + keyword + '%',
              },
            },
            {
              project_description: {
                [Op.like]: '%' + keyword + '%',
              },
            },
            {
              code_number: {
                [Op.like]: '%' + keyword + '%',
              },
            },
            {
              '$Tasks.task_name$': {
                [Op.like]: '%' + keyword + '%'
              },
            },
            {
              '$Tasks.task_description$': { [Op.like]: '%' + keyword + '%' },
            },
            {
              '$Tasks.TaskComments.comment$': { [Op.like]: '%' + keyword + '%' },
            }
          ]
        },
        order: [
          ["id", "desc"]
        ]
      })
      if ( projects.length > 0 ) {
        // console.log(projects.length)
        return projects
      }
      return Promise.reject(new Error('該当するProjectデータが見つかりません'))
    } catch ( error ) {
      // console.log(error)
      return Promise.reject(error)
    }
  }
  // 実行
  return init().then((result) => {
    // console.log(result)
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
})

/**
 * 指定したプロジェクトデータの更新処理
 */
router.post('/update/:projectId', ...validationRules['project.update'], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      return next();
    }
    let postData = req.body
    let project = await models.Project.findByPk(postData.project_id)
    if ( project === null ) {
      throw new Error('Cound not find specified project id.')
    }
    let updateProject = {
      project_name: postData.project_name,
      project_description: postData.project_description,
      is_displayed: postData.is_displayed,
      start_date: postData.start_date,
      end_date: postData.end_date,
      user_id: postData.user_id,
      image_id: []
    }
    // Update.
    let result = await project.update(updateProject)
    // console.log(result);
    if (result === null) {
      throw new Error("Failed updating existing record.");
    }
    let json = {
      status: true,
      code: 200,
      response: result,
    }
    // console.log(json);
    return res.send(json)
  } catch (error) {
    // console.log(error);
    let json = {
      status: false,
      code: 400,
      response: error,
    }
    return res.send(json)
  }
}).post("/update/:projectId", (req, res, next) => {
  const errors = validationResult(req).array();
  let json = {
    status: false,
    code: 400,
    response: errors,
  }
  res.status(400);
  return res.send(json);
})

/**
 * 指定したプロジェクトに紐づくタスク一覧を取得する
 */
router.get("/task/:projectId/", ...validationRules["get.project.task"], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty() !== true) {
    return next();
  }
  let projectId = req.params.projectId;
  const db = () => {
    return new Promise(function(resolve, reject) {
      models.Task.findAll({
        where: {
          project_id: projectId,
        },
        include: [
          {
            model: models.Star,
          },
        ],
      }).then((result) => {
        // console.log("result ====>", result);
        resolve(result);
      }).catch((error) => {
        // console.log(error);
        reject(new Error("タスク情報の取得に失敗しました"));
      })
    })
  }
  const init = async () => {
    try {
      let tasks = await db();
      // console.log(tasks);
      return tasks;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return init().then((result) => {
    let json = {
      status: true,
      code: 200,
      response: result,
    }
    res.status(200);
    return res.send(json);
  }).catch((error) => {
    console.log(error);
    let json = {
      status: false,
      code: 400,
      response: error,
    }
    res.status(400);
    return res.send(json);
  })
}).get("/:projectId/task", (req, res, next) => {
  const errors = validationResult(req);
  let json = {
    status: false,
    code: 400,
    response: errors,
  }
  res.status(400);
  return res.send(json);
})
export default router

