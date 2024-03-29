import express from "express";
const router = express.Router()
import models from "../models/index.js";
import {check, validationResult} from 'express-validator'
import applicationConfig from "../config/application-config.js";
import {Op} from "sequelize";

const sectionTypeIDList = []
applicationConfig.sectionType.map((data, index) => {
  sectionTypeIDList.push(data.id)
})

router.get('/', function (req, res, next) {
  console.log(req.params)
  console.log(req.query)
  const query = req.query
  const ormOption = {}
  ormOption.order = [
    ['id', 'desc']
  ]
  ormOption.include = [
    { model: models.Task }
  ]
  if (query.keyword && query.keyword.length > 0) {
    // orm用オプションを指定
    ormOption.where = {
      user_name: {
        [Op.like]: '%' + query.keyword + '%'
      }
    }
  }
  console.log(ormOption)
  models.User.findAll(ormOption).then((users) => {
    return res.render('./user/index', {
      query: query,
      users: users
    })
  }).catch(error => {
    // 次のコールバックへ飛ばす
    return next(new Error(error))
  })
})

/**
 * ユーザー情報の新規作成処理
 */
router.get('/create', (req, res, next) => {
  const actionUrl = req.originalUrl
  models.user
    .findAll({
      order: [['id', 'asc']],
      include: [{ model: models.Task }]
    })
    .then((users) => {
      const data = {
        users: users
      }
      // ユーザー一覧をビューに表示
      res.render('./user/create', {
        users: users,
        actionUrl: actionUrl,
        sectionType: applicationConfig.sectionType
      })
    })
    .catch((error) => {
      return next(new Error(error))
    })
})

router.post(
  '/create',
  [
    // postデータのバリデーション
    check('user_name', '名前は必須項目です｡').isLength({ min: 1, max: 256 }),
    check('section_type', '規定の値から選択して下さい｡').isIn(sectionTypeIDList)
  ],
  (req, res, next) => {
    const actionUrl = req.originalUrl
    const user = models.user
    const postData = req.body
    // バリデーションのチェック
    const errors = validationResult(req)
    // バリデーション結果

    if (errors.isEmpty() === true) {
      user
        .create({
          user_name: postData.user_name,
          section_type: postData.section_type
        })
        .then((data) => {
          res.redirect(301, '/user')
        })
        .catch((error) => {
          return next(new Error(error))
        })
    } else {
      // 現在登録済みのユーザー一覧
      user
        .findAll({
          order: [['id', 'asc']],
          include: [{ model: models.Task }]
        })
        .then((users) => {
          // console.log(users);
          res.render('./user/create', {
            users: users,
            errors: errors,
            actionUrl: actionUrl,
            sectionType: applicationConfig.sectionType
          })
        })
        .catch((error) => {
          return next(new Error(error))
        })
    }
  }
)

/* GET users listing. */
router.get('/:userID', (req, res, next) => {
  const userID = req.params.userID

  models.user
    .findByPk(userID, {
      include: [{ model: models.Task }]
    })
    .then((user) => {
      res.render('./user/detail', {
        user: user
      })
    })
    .catch((error) => {
      // 次に処理を渡す
      return next(new Error(error))
    })
})

export default router;
// module.exports = router
