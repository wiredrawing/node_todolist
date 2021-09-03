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
let logoutRouter = require("./routes/logout");

// API向けルーティング
let imageApiRouter = require("./routes/api/image");
let projectApiRouter = require("./routes/api/project");

// es6 modules
let models = require("./models/index.js");

let config = require("./config/config.json");
console.log("config ====> ", config);

const session = require("express-session");
const fileUpload = require("express-fileupload");
// session用のpostgresql storeの実行用
const { Pool } = require("pg");
let pgSession = require("connect-pg-simple")(session);

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

// sequelizeの設定ファイルと共有する
const pool = new Pool({
  host: config.development.host,
  user: config.development.username,
  password: config.development.password,
  database: config.development.database,
  port: config.development.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ------------------------------------------
// ログイン情報の保持にセッションを利用する
// ------------------------------------------
app.use(
  session({
    store: new pgSession({
      pool: pool, // Connection pool
      tableName: "session", // Use another table-name than the default "session" one
    }),
    secret: "暗号化ソルト",
    resave: false,
    saveUninitialized: false,
    name: "task-managing-tool-cookie",
    rolling: true,
    // 30 日間
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
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
  console.log("req.sessionID ===> ", req.sessionID);
  let pathname = parseUrl(req).pathname;
  if (pathname.substr(-1) !== "/") {
    pathname += "/";
  }
  console.log("req.session.isLoggedIn ===> ", req.session.isLoggedIn);
  // ログイン状態が確認できない場合は､ログインへリダイレクト
  if (pathname.indexOf("/login/") === -1 && req.session.isLoggedIn !== true) {
    return res.redirect("/login");
  }

  if (req.session.isLoggedIn === true) {
    req.isLoggedIn = req.session.isLoggedIn;
  } else {
    req.isLoggedIn = false;
  }

  res.locals.req = req;
  return next();
});

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
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
