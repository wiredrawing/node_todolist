const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const bodyParser = require('body-parser')
const parseUrl = require('parseUrl')
const { validationResult } = require('express-validator')
// テンプレート用ルーティング
const indexRouter = require('./routes/index')
const userRouter = require('./routes/user')
const todoRouter = require('./routes/todo')
const projectRouter = require('./routes/project')
const imageRouter = require('./routes/image.js')
const loginRouter = require('./routes/login')
const logoutRouter = require('./routes/logout')
const registerRouter = require('./routes/register')

// API向けルーティング
const imageApiRouter = require('./routes/api/image')
const projectApiRouter = require('./routes/api/project')
const starApiRouter = require('./routes/api/star')
const userApiRouter = require('./routes/api/user')

const config = require('./config/config.json')

const session = require('express-session')
const fileUpload = require('express-fileupload')
// session用のpostgresql storeの実行用
const { Pool } = require('pg')
const pgSession = require('connect-pg-simple')(session)

const app = express()

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
  host: config.development.host,
  user: config.development.username,
  password: config.development.password,
  database: config.development.database,
  port: config.development.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// ------------------------------------------
// ログイン情報の保持にセッションを利用する
// ------------------------------------------
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
  if (req.method === 'POST') {
    req.session.sessionPostData = req.body
  } else {
    if (req.session.sessionPostData) {
      sessionPostData = req.session.sessionPostData
      req.session.sessionPostData = null
    }
  }
  const old = (function (postData) {
    return function (param, defaultValue = '') {
      if (postData && postData[param]) {
        if (isNaN(postData[param])) {
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

app.use((req, res, next) => {
  // applicationPath
  req.applicationPath = __dirname

  const executeValidationCheck = function (request) {
    // バリデーション検証
    const errors = validationResult(request)
    // バリデーションエラー無し
    if (errors.isEmpty() === true) {
      request.session.validationErrors = null
      return true
    }
    console.log(errors.errors)
    request.session.validationErrors = errors.errors
    return false
  }
  req.executeValidationCheck = executeValidationCheck

  const checkValidationErrors = function (request) {
    const validationErrors = []
    const errors = request.session.validationErrors
    if (Array.isArray(errors) && errors.length > 0) {
      errors.forEach((error, index) => {
        validationErrors[error.param] = error.msg
      })
    }
    console.log('validationErrors => ', validationErrors)
    request.session.validationErrors = null
    return function (param) {
      if (validationErrors[param]) {
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
    '/api/'
  ]
  let pathname = parseUrl(req).pathname
  if (pathname.substr(-1) !== '/') {
    pathname += '/'
  }

  let isAllowed = false
  for (let index = 0; index < notRequiredList.length; index++) {
    // URLリストから正規表現を作成
    const pathRegex = new RegExp(notRequiredList[index])
    if (pathRegex.test(pathname) === true) {
      console.log('pathRegex.test(pathname) ==> ', pathRegex.test(pathname), pathname)
      isAllowed = true
      break
    }
  }
  if (isAllowed !== true) {
    if (req.session.user === null || req.session.user === undefined) {
      return res.redirect('/login')
    }
  }
  res.locals.req = req
  return next()
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

module.exports = app
