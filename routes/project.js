var express = require("express");
var router = express.Router();

// モデルロード
const models = require("../models/index.js");
// バリデーション用のモジュールを読み込み
const { check, validationResult } = require("express-validator");
const applicationConfig = require("../config/application-config");
const validationRules = require("../config/validationRules.js");
const { Op } = require("sequelize");
// 識別使用コード生成関数
const makeCodeNumber = require("../config/makeCodeNumber.js");
const projectimage = require("../models/projectimage.js");
// 表示フラグのバリデーション用
let displayStatusList = [];
applicationConfig.displayStatusList.forEach((status, index) => {
  displayStatusList.push(status.id);
});

// プロジェクト一覧ページ
router.get("/", function (req, res, next) {
  let keyword = "";
  if (req.query.keyword) {
    keyword = req.query.keyword;
  }

  return models.Project.findAll({
    where: {
      [Op.or]: [
        {
          project_name: {
            [Op.like]: "%" + keyword + "%",
          },
        },
        {
          project_description: {
            [Op.like]: "%" + keyword + "%",
          },
        },
      ],
    },
    include: [{ model: models.task }, { model: models.user }],
    order: [["id", "desc"]],
  })
    .then((projects) => {
      return res.render("project/index", {
        projects: projects,
      });
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

// プロジェクトの新規作成
router.get("/create", (req, res, next) => {
  // バリデーションエラーを取得
  let sessionErrors = {};

  // 現在のリクエストURLを変数に保持
  let actionUrl = req.originalUrl;

  // 現在登録中のプロジェクト一覧を取得する
  let projects = models.Project.findAll({
    include: [{ model: models.task }],
    order: [["id", "desc"]],
  });

  // 登録中のユーザー一覧
  let users = models.user.findAll({
    order: [["id", "desc"]],
  });

  // Promiseの解決
  Promise.all([users, projects])
    .then(function (response) {
      let users = response[0];
      let projects = response[1];
      return res.render("project/create", {
        users: users,
        projects: projects,
        actionUrl: actionUrl,
        sessionErrors: sessionErrors,
        applicationConfig: applicationConfig,
        // old: req.old,
      });
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

router.post("/create", validationRules["project.create"], (req, res, next) => {
  // POSTデータを取得
  const postData = req.body;
  // express-validatorを使ったバリデーション結果を取得する
  const errors = validationResult(req);
  if (req.executeValidationCheck(req) !== true) {
    return res.redirect("back");
  }

  return models.sequelize.transaction((tx) => {
    let transaction = tx;
    let codeNumber = makeCodeNumber(12);
    // バリデーションチェックを通過した場合
    return models.Project.create(
      {
        project_name: postData.project_name,
        project_description: postData.project_description,
        // user_idは当該プロジェクトのリーダーになるID
        user_id: postData.user_id,
        is_displayed: postData.is_displayed,
        code_number: codeNumber,
        start_time: postData.start_time,
        end_time: postData.end_time,
      },
      {
        transaction: transaction,
      }
    )
      .then((data) => {
        // lastInsertIDを取得
        let projectId = data.id;
        let projectImagesForBulk = [];
        req.body.image_id.forEach((id, index) => {
          projectImagesForBulk.push({
            image_id: id,
            project_id: projectId,
          });
        });

        return models.ProjectImage.bulkCreate(projectImagesForBulk, {
          transaction: transaction,
        })
          .then((projectImages) => {
            return res.redirect("back");
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .catch((error) => {
        // return
        return next(new Error(error));
      });
  });
});

/**
 * プロジェクトの編集および更新入力画面
 *
 */
router.get(
  "/detail/:projectId",
  [
    check("projectId").isNumeric().custom((value, { req }) => {
        let projectId = parseInt(value);

        return models.Project.findByPk(projectId).then(function (project) {
          if (parseInt(project.id) === projectId) {
            return true;
          }
          return Promise.reject("指定したプロジェクトデータが見つかりません");
        }).catch((error) => {
          throw new Error(error);
        });
      })
      .withMessage("指定したプロジェクトデータが見つかりません｡"),
  ],
  function (req, res, next) {
    // URLパラメータの取得
    let projectId = req.params.projectId;
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      return next(new Error(errors.errors));
    }

    let sessionErrors = {};
    if (req.session.sessionErrors) {
      sessionErrors = req.session.sessionErrors;
      delete req.session.sessionErrors;
    }

    let users = models.user.findAll();

    let project = models.Project.findByPk(projectId, {
      include: [
        {
          model: models.task,
          include: [{ model: models.user }],
        },
        {
          model: models.ProjectImage,
          include: [{ model: models.Image }],
        },
      ],
      order: [[models.task, "id", "desc"]],
    });

    Promise.all([users, project])
      .then((data) => {
        let users = data[0];
        let project = data[1];
        return res.render("project/detail", {
          users: users,
          project: project,
          sessionErrors: sessionErrors,
          displayStatusList: applicationConfig.displayStatusList,
        });
      })
      .catch((error) => {
        // 例外 ※次のイベントキューへ回す
        return next(new Error(error));
      });
  }
);

router.post(
  "/detail/:projectId",
  [
    // カスタムバリデーター
    check("user_id")
      .isNumeric()
      .custom(function (value, request) {
        // user_idがDBレコードに存在するかバリデーションする
        return models.user
          .findByPk(value)
          .then((data) => {
            if (data.id == value) {
              return true;
            }
            return Promise.reject("DBレコードに一致しません｡");
          })
          .catch((error) => {
            throw new Error(error);
          });
      }),
    check("project_name").isLength({ min: 1, max: 256 }).withMessage("プロジェクト名を入力して下さい"),
    check("project_description").isLength({ min: 1, max: 4096 }).withMessage("プロジェクトの概要を4000文字以内で入力して下さい｡"),
    check("project_id")
      .isNumeric()
      .custom((value, { req }) => {
        // DBに存在するproject_idかどうかをチェックする
        return models.Project.findByPk(parseInt(value))
          .then((project) => {
            // 正しいproject_id
            if (parseInt(project.id) === parseInt(value)) {
              return true;
            }
            return Promise.reject("プロジェクトが見つかりませんでした");
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .withMessage("正しいフォーマットで入力して下さい"),
    check("is_displayed", "表示状態を正しく選択して下さい").isIn(displayStatusList),
  ],
  (req, res, next) => {

    // バリデーションチェック開始
    if (req.executeValidationCheck(req) !== true) {
      return res.redirect("back");
    }

    let postData = req.body;
    let projectId = parseInt(req.params.projectId);

    // トランザクション開始
    return models.sequelize.transaction().then(function (tx) {
      let transaction = tx;
      // -------------------------------------------
      // projectsテーブルのアップデート
      // -------------------------------------------
      return models.Project.findByPk(projectId).then((project) => {

        if (parseInt(project.id) !== projectId) {
          return next(new Error("プロジェクトIDがマッチしませんでした"));
        }

        return project.update({
          project_name: postData.project_name,
          project_description: postData.project_description,
          user_id: postData.user_id,
          is_displayed: postData.is_displayed,
          start_time: postData.start_time,
          end_time: postData.end_time,
        },{
          transaction: transaction,
        }).then((project) => {
          if (parseInt(project.id) !== projectId) {
            // 詳細画面に戻る
            return res.redirect("back");
          }
          // -------------------------------------------
          // 既存登録済み画像を削除した後再度アップデートさせる
          // -------------------------------------------
          return models.ProjectImage.destroy({
            where: {
              project_id: project.id,
            }
          }, {
            transaction: transaction,
          }).then(projectImages => {
            let updateImageList = [];
            postData.image_id.forEach(function (image, index) {
              updateImageList.push({
                image_id: image,
                project_id: project.id,
              });
            });

            return models.ProjectImage.bulkCreate(updateImageList,
            {
              transaction: transaction
            }).then(projectImages => {
              // 新規で更新したproject_imagesレコード
              // 明示的なトランザクション
              transaction.commit();
              return res.redirect("back");
            });
          })

        })
        .catch((error) => {
          return Promise.reject(error);
        });
      }).catch((error) => {
        // transaction rollback
        transaction.rollback();
        return next(new Error(error));
      });
    }).catch (function(error) {
      return next(new Error("トランザクションが開始できませんでした"));
    });
  }
);

// --------------------------------------------------
// 指定したプロジェクトに紐づくタスク一覧を取得する
// --------------------------------------------------
router.get(
  "/task/:projectId",
  [
    check("projectId")
      .custom((value, { req }) => {
        value = parseInt(value);
        return models.Project.findByPk(value)
          .then((project) => {})
          .catch((error) => {
            return Promise.reject(error);
          });
      })
      .withMessage("指定したプロジェクトが見つかりません｡"),
  ],
  function (req, res, next) {
    let projectId = req.params.projectId;

    return models.Project.findByPk(projectId, {
      include: [
        {
          model: models.task,
          include: [{ model: models.user }, { model: models.Star }],
        },
      ],
      order: [[models.task, "id", "desc"]],
    })
      .then((project) => {
        // ビューを返却
        return res.render("project/task", {
          project: project,
        });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }
);

router.post(
  "/delete/:project_id",
  [
    check("project_id")
      .isNumeric()
      .custom(function (value, obj) {
        let projectId = parseInt(value);
        return models.Project.findByPk(projectId).then(function (project) {
        });
      }),
  ],
  function (req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty() !== true) {
      return req.res.redirect("back");
    }
    let body = req.body;
    return models.Project.findByPk(parseInt(body.project_id))
      .then((project) => {
        return project
          .destroy()
          .then((project) => {
            return res.redirect("back");
          })
          .catch((error) => {
            throw new Error(error);
          });
      })
      .catch((error) => {
        return next(new Error(error));
      });
  }
);
module.exports = router;
