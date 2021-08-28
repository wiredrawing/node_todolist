var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let bodyParser = require("body-parser");
let parseUrl = require("parseUrl");

// テンプレート用ルーティング
var indexRouter = require("./routes/index");
var userRouter = require("./routes/user");
let todoRouter = require("./routes/todo");
let projectRouter = require("./routes/project");
let imageRouter = require("./routes/image.js");
let loginRouter = require("./routes/login");

// API向けルーティング
let imageApiRouter = require("./routes/api/image");
let projectApiRouter = require("./routes/api/project");

// es6 modules
let models = require("./models/index.js");
const { check, validationResult } = require("express-validator");
const { profileEnd } = require("console");

const session = require("express-session");
const fileUpload = require("express-fileupload");
// const EventEmitter = require('events');

// let emitter = new EventEmitter();
// emitter.on('get_star', (task_id) => {
//   // console.log('タスクID => ' + task_id + ' にスターを獲得しました｡');
// });

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "暗号化ソルト",
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 10 * 10000,
    },
  })
);

// ------------------------------------------
// POSTメソッドの場合は､req.bodyをセッションに格納する
// ------------------------------------------
app.use(function (req, res, next) {
  let sessionPostData = null;
  if (req.method === "POST") {
    req.session.sessionPostData = req.body;
  } else {
    if (req.session.sessionPostData) {
      sessionPostData = req.session.sessionPostData;
      req.session.sessionPostData = null;
    }
  }
  const old = (function (postData) {
    // console.log("postData ===> ", postData);
    return function (param, defaultValue = "") {
      if (postData && postData[param]) {
        if (isNaN(postData[param])) {
          return postData[param];
        }
        // 数値型の場合は､Numberにキャストする
        return Number(postData[param]);
      }
      return defaultValue;
    };
  })(sessionPostData);
  req.old = old;
  // ejsテンプレート上にhelper関数として登録
  res.locals.old = old;
  // // console.log("req.ejs ===>", req.locals);
  // // console.log("req.method ===> ", req.method);
  // // console.log("req.body ===> ", req.body);

  return next();
});

// ------------------------------------------
// バリデーションエラーの内容をテンプレートで出力できるようにカスタム
// ------------------------------------------
app.use(function (req, res, next) {
  const setValidationErrors = function (errors) {
    let sessionErrors = {};
    errors.forEach((error, index) => {
      sessionErrors[error.param] = error.msg;
    });

    // --------------------------------------
    // Laravelの$errors関数のエミュレーション
    // helper関数としてテンプレートに登録
    // --------------------------------------
    res.locals.errors = function (param) {
      if (sessionErrors[param]) {
        return sessionErrors[param];
      }
      return "";
    };
  };

  req.setValidationErrors = setValidationErrors;
  // エラーの初期化
  req.setValidationErrors([]);
  return next();
});

// ファイルアップロードのためのミドルウェア
app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "tmp/",
    setFileNames: true,
    debug: true,
  })
);

// 本アプリケーション独自のミドルウェア
app.use((req, res, next) => {
  let users = models.user.findAll({
    order: [["id", "desc"]],
    include: [{ model: models.task }],
  });
  let tasks = models.task.findAll({
    order: [["id", "desc"]],
    include: [{ model: models.user }, { model: models.Star }],
  });
  let projects = models.Project.findAll({
    order: [["id", "desc"]],
  });
  Promise.all([users, tasks, projects])
    .then((data) => {
      let users = data[0];
      let tasks = data[1];
      let projects = data[2];
      let userIDList = [];
      let taskIDList = [];
      let projectIDList = [];
      // usersテーブルのIDのみの配列
      users.forEach((user, index) => {
        userIDList.push(user.id);
      });

      // tasksテーブルのIDのみの配列
      tasks.forEach((task, index) => {
        taskIDList.push(task.id);
      });

      // projectsテーブルのIDのみの配列
      projects.forEach((project, index) => {
        projectIDList.push(project.id);
      });

      req.__ = {
        users: users,
        tasks: tasks,
        projects: projects,
        userIDList: userIDList,
        taskIDList: taskIDList,
        projectIDList: projectIDList,
        // e: emitter,
        applicationPath: __dirname,
      };
      return next();
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

app.use((req, res, next) => {
  let pathname = parseUrl(req).pathname;
  if (pathname.substr(-1) !== "/") {
    pathname += "/";
  }
  console.log(pathname);
  let envParam = {};
  if (pathname === "/login/") {
    envParam.hasMenu = false;
  }
  req.envParam = envParam;
  res.locals.req = req;
  return next();
});

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/user", userRouter);
app.use("/todo", todoRouter);
app.use("/project", projectRouter);
app.use("/image", imageRouter);

// API用ルーティング
app.use("/api/image", imageApiRouter);
app.use("/api/project", projectApiRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // console.log(err.message);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
