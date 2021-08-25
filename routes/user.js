var express = require('express');
var router = express.Router();
let models = require('../models/index.js');
const { check, validationResult } = require('express-validator');
const applicationConfig = require('../config/application-config.js');
const {Op} = require('Sequelize');

let sectionTypeIDList = [];
applicationConfig.sectionType.map((data, index) => {
  sectionTypeIDList.push(data.id);
});

router.get('/', function (req, res, next) {
  console.log(req.params);
  console.log(req.query);
  let query = req.query;
  let ormOption = {};
  ormOption.order = [
    ["id", "desc"]
  ];
  ormOption.include = [
    {model: models.task}
  ]
  if (query.keyword && query.keyword.length > 0) {
    // orm用オプションを指定
    ormOption.where = {
      user_name: {
        [Op.like]: '%' + query.keyword + '%'
      }
    };
  }
  console.log(ormOption);
  models.user.findAll(ormOption).then((users) => {
    return res.render('./user/index', {
      query: query,
      users: users,
    });
  }).catch(error => {
    // 次のコールバックへ飛ばす
    return next(new Error(error));
  });
});

/**
 * ユーザー情報の新規作成処理
 */
router.get('/create', (req, res, next) => {
  let actionUrl = req.originalUrl;
  models.user
    .findAll({
      order: [['id', 'asc']],
      include: [{ model: models.task }],
    })
    .then((users) => {
      let data = {
        users: users,
      };
      // ユーザー一覧をビューに表示
      res.render('./user/create', {
        users: users,
        actionUrl: actionUrl,
        sectionType: applicationConfig.sectionType,
      });
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

router.post(
  '/create',
  [
    // postデータのバリデーション
    check('user_name', '名前は必須項目です｡').isLength({ min: 1, max: 256 }),
    check('section_type', '規定の値から選択して下さい｡').isIn(sectionTypeIDList),
  ],
  (req, res, next) => {
    let actionUrl = req.originalUrl;
    let user = models.user;
    let postData = req.body;
    // バリデーションのチェック
    const errors = validationResult(req);
    // バリデーション結果

    if (errors.isEmpty() === true) {
      user
        .create({
          user_name: postData.user_name,
          section_type: postData.section_type,
        })
        .then((data) => {
          res.redirect(301, '/user');
        })
        .catch((error) => {
          return next(new Error(error));
        });
    } else {
      // 現在登録済みのユーザー一覧
      user
        .findAll({
          order: [['id', 'asc']],
          include: [{ model: models.task }],
        })
        .then((users) => {
          // console.log(users);
          res.render('./user/create', {
            users: users,
            errors: errors,
            actionUrl: actionUrl,
            sectionType: applicationConfig.sectionType,
          });
        })
        .catch((error) => {
          return next(new Error(error));
        });
    }
  }
);

/* GET users listing. */
router.get('/:userID', (req, res, next) => {
  let userID = req.params.userID;

  models.user
    .findByPk(userID, {
      include: [{ model: models.task }],
    })
    .then((user) => {
      res.render('./user/detail', {
        user: user,
      });
    })
    .catch((error) => {
      // 次に処理を渡す
      return next(new Error(error));
    });
});
module.exports = router;
