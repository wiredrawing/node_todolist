var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
let todoRouter = require('./routes/todo');
let projectRouter = require('./routes/project');

let applicationConfig = require('./config/application-config');
// es6 modules
let models = require('./models/index.js');
const { check, validationResult } = require('express-validator');
const { profileEnd } = require('console');

const session = require('express-session');

const EventEmitter = require('events');
let emitter = new EventEmitter();
emitter.on('get_star', (task_id) => {
  console.log('タスクID => ' + task_id + ' にスターを獲得しました｡');
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
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
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: '暗号化ソルト',
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 10 * 10000,
    },
  })
);

// 本アプリケーション独自のミドルウェア
app.use((req, res, next) => {
  let users = models.user.findAll({
    order: [['id', 'desc']],
    include: [{ model: models.task }],
  });
  let tasks = models.task.findAll({
    order: [['id', 'desc']],
    include: [{ model: models.user }, { model: models.Star }],
  });
  let projects = models.Project.findAll({
    order: [['id', 'desc']],
  });
  Promise.all([users, tasks, projects])
    .then((data) => {
      console.log("毎リクエストごとに動く");
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
        e: emitter,
      };
      return next();
    })
    .catch((error) => {
      return next(new Error(error));
    });
});

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/todo', todoRouter);
app.use('/project', projectRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err.message);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
