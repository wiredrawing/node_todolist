import createError from 'http-errors'
import express from 'express'
import path, { dirname } from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import bodyParser from 'body-parser'
import parseUrl from 'parse-url'
import { query, validationResult } from 'express-validator'
import cors from "cors";
// ----------------------------------------------------------
// テンプレート用ルーティング(コントローラ)
// ----------------------------------------------------------
import indexRouter from './routes/index.js'
import userRouter from './routes/user.js'
import todoRouter from './routes/todo.js'
import projectRouter from './routes/project.js'
import imageRouter from './routes/image.js'
import loginRouter from './routes/login.js'
import logoutRouter from './routes/logout.js'
import registerRouter from './routes/register.js'
// ----------------------------------------------------------
// API向けルーティング(API用コントローラ)
// ----------------------------------------------------------
import imageApiRouter from './routes/api/image.js'
import projectApiRouter from './routes/api/project.js'
import starApiRouter from './routes/api/star.js'
import userApiRouter from './routes/api/user.js'
import taskCommentApiRouter from "./routes/api/taskcomment.js";
import taskApiRouter from "./routes/api/task.js";
import utilityApiRouter from "./routes/api/utility.js";
import session from 'express-session'
import fileUpload from 'express-fileupload'
// session用のpostgresql storeの実行用
import pkg from 'pg'
const { Pool } = pkg
import sessionForPg from 'connect-pg-simple'
// __dirnameと__filenameのシミュレーション
import { fileURLToPath } from 'url'


const pgSession = sessionForPg(session)

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true
  })
)
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// sequelizeの設定ファイルと共有する
const pool = new Pool({
  host: 'localhost',
  user: 'admin',
  password: 'admin',
  database: 'todo-list',
  port: '1235',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// ------------------------------------------------------------------
// ログイン情報の保持にセッションを利用する
// 以下のSQLを実行してセッション保存用のテーブルを作成する必要がある
// psql mydatabase < node_modules/connect-pg-simple/table.sql
// ------------------------------------------------------------------
app.use(
  session({
    store: new pgSession({
      pool: pool, // Connection pool
      tableName: 'session' // Use another table-name than the default "session" one
    }),
    secret: '暗号化ソルト',
    resave: false,
    saveUninitialized: false,
    name: 'task-managing-tool-cookie',
    rolling: true,
    // 30 日間
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
  })
)

// ------------------------------------------
// POSTメソッドの場合は､req.bodyをセッションに格納する
// ------------------------------------------
app.use(function (req, res, next) {
  let sessionPostData = {}
  if ( req.method === 'POST' ) {
    req.session.sessionPostData = req.body
  } else {
    if ( req.session.sessionPostData ) {
      sessionPostData = req.session.sessionPostData
      req.session.sessionPostData = null
    }
  }
  const old = (function (postData) {
    return function (param, defaultValue = '') {
      if ( postData && postData[param] ) {
        if ( isNaN(postData[param]) ) {
          return postData[param]
        }
        // 数値型の場合は､Numberにキャストする
        return Number(postData[param])
      }
      return defaultValue
    }
  })(sessionPostData)
  req.old = old
  // ejsテンプレート上にhelper関数として登録
  res.locals.old = old
  return next()
})

// ファイルアップロードのためのミドルウェア
app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: 'tmp/',
    setFileNames: true,
    debug: true
  })
)

// app.use(function (req, res, next) {
//   let validationErrors = {};
//   let errors = req.session.validationErrors;
//   if (Array.isArray(errors) && errors.length > 0) {
//     errors.forEach((error, index) => {
//       validationErrors[error.param] = error.msg;
//     });
//   }
//   req.session.validationErrors = null;
//   res.locals.errors = function (param) {
//     if (validationErrors[param]) {
//       return validationErrors[param];
//     }
//     return "";
//   }
//   return next();
// });

/**
 * corsモジュールを使用せずに,生でcorsクロスドメイン通信を許可する場合は以下の内容を
 * 実行する
 */
app.use((req, res, next) => {
  // フロントエンド側のドメインからのリクエストを許可する
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.setHeader("Access-Control-Allow-Headers", 'access-control-allow-origin,content-type');
  // res.setHeader("Vary", 'Access-Control-Request-Headers');
  res.status(200);
  next();
});
// app.use(cors({
//   origin: 'http://localhost:3001', //アクセス許可するオリジン
//   credentials: true, //レスポンスヘッダーにAccess-Control-Allow-Credentials追加
//   optionsSuccessStatus: 200 //レスポンスstatusを200に設定
// }));
app.use((req, res, next) => {
  try {
    // applicationPath
    req.applicationPath = __dirname

    req.executeValidationCheck = function (request) {
      // バリデーション検証
      const errors = validationResult(request)
      // バリデーションエラー無し
      if ( errors.isEmpty() === true ) {
        request.session.validationErrors = null
        return true
      }
      // // console.log(errors.errors)
      request.session.validationErrors = errors.errors
      return false
    }

    const checkValidationErrors = function (request) {
      const validationErrors = []
      const errors = request.session.validationErrors
      if ( Array.isArray(errors) && errors.length > 0 ) {
        errors.forEach((error, index) => {
          validationErrors[error.param] = error.msg
        })
      }
      // // console.log('validationErrors => ', validationErrors)
      request.session.validationErrors = null
      return function (param) {
        if ( validationErrors[param] ) {
          return validationErrors[param]
        }
        return ''
      }
    }
    res.locals.errors = checkValidationErrors(req)

    // -------------------------------------------
    // 未ログインの場合のみアクセスできるURL
    // -------------------------------------------
    const notRequiredList = [
      '/login/',
      '/login/authenticate/',
      '/register/create/',
      '/api/',
    ]
    let pathname = req.path
    if ( pathname === '' || pathname.substring(-1) !== '/' ) {
      pathname += '/'
    }

    let isAllowed = false
    for ( let index = 0; index < notRequiredList.length; index++ ) {
      // URLリストから正規表現を作成
      const pathRegex = new RegExp(notRequiredList[index])
      if (pathRegex.test(pathname) === true) {
        console.log(pathname);
        console.log('pathRegex.test(pathname) ==> ', pathRegex.test(pathname), pathname)
        isAllowed = true
        break
      }
    }
    console.log(isAllowed);
    // console.log(isAllowed);
    if ( isAllowed !== true ) {
      if ( req.session.user === null || req.session.user === undefined ) {
        console.log("強制リダイレクト");
        return res.redirect('/login')
      }
    }
    res.locals.req = req
    return next()
  } catch ( error ) {
    // console.log(error.message)
    res.locals.req = req
    return next()
  }
})
app.use('/', indexRouter)
app.use('/register', registerRouter)
app.use('/login', loginRouter)
app.use('/logout', logoutRouter)
app.use('/user', userRouter)
app.use('/todo', todoRouter)
app.use('/project', projectRouter)
app.use('/image', imageRouter)

// API用ルーティング
app.use('/api/image', imageApiRouter)
app.use('/api/project', projectApiRouter)
app.use('/api/star', starApiRouter)
app.use('/api/user', userApiRouter)
app.use("/api/taskcomment", taskCommentApiRouter);
app.use("/api/task", taskApiRouter);
app.use("/api/utility", utilityApiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

export default app
// module.exports = app
