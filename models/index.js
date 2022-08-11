// マイグレーションのリセット時
// npx sequelize db:migrate:undo
// マイグレーション実行時
// npx sequelize db:migrate
// DBへの接続情報
// npm install sequelize-cli-esm モジュールを事前にインストールする
import fs from 'fs'

//process.env.DB_URL = 'postgres://en:en_password@localhost:15432/todo-list'
// postgresqlのサーバーを変更
process.env.DB_URL = 'postgres://admin:admin@localhost:1235/todo-list'
import { Sequelize, DataTypes } from 'sequelize'
import user from './user.js'
import star from './star.js'
import image from './image.js'
import task from './task.js'
import commentimage from './commentimage.js'
import taskcomment from './taskcomment.js'
import taskimage from './taskimage.js'
import taskthread from './taskthread.js'
import project from './project.js'
import projectimage from './projectimage.js'
import projectuser from './projectuser.js'
import crypto from 'crypto'

const config = {
  'logging': function (str) {
    if ( fs.existsSync('./sql.logs') !== true ) {
      console.log(str)
      console.log('SQL保存用ディレクトリが存在しません')
      console.log("sql.logsディレクトリを作成します----->");
      fs.mkdir('./sql.logs', {recursive:  true}, (err) => {
        console.log("sql.logsのディレクトリを作成しました----->");
      })
      return false
    }
    // 実行したsqlのhash値を取得し,これをファイル名とする
    let sqlHash = './sql.logs/' + crypto.createHash('sha256').update(str).digest('hex') + '.sql.log'
    // console.log(sqlHash);
    if ( fs.existsSync(sqlHash) !== true ) {
      let file = fs.createWriteStream(sqlHash, 'utf8')
      file.on('end', function () {
        console.log('End Event')
      })
      file.on('finish', function () {
        console.log('Finish Event')
      })
      // 実行したSQLを1byteずつファイルへ書き込んでいく
      for ( let i = 0; i < str.length; i++ ) {
        if ( str[i] === ' ' ) {
          // スペースは改行させる
          file.write('\r\n')
        } else {
          file.write(str[i])
        }

      }
      file.end()
    }
    return true
  }
}
const sequelize = new Sequelize(process.env.DB_URL, config)
const models = {
  // モデルを静的定義していく
  User: user(sequelize, DataTypes),
  Task: task(sequelize, DataTypes),
  Star: star(sequelize, DataTypes),
  Image: image(sequelize, DataTypes),
  CommentImage: commentimage(sequelize, DataTypes),
  TaskComment: taskcomment(sequelize, DataTypes),
  TaskImage: taskimage(sequelize, DataTypes),
  TaskThread: taskthread(sequelize, DataTypes),
  Project: project(sequelize, DataTypes),
  ProjectImage: projectimage(sequelize, DataTypes),
  ProjectUser: projectuser(sequelize, DataTypes),

  // administrator: administrator(sequelize, DataTypes),
  // article: article(sequelize, DataTypes),
  // subPage: subPage(sequelize, DataTypes),
  // articleHashTag: articleHashTag(sequelize, DataTypes),
  // hashTag: hashTag(sequelize, DataTypes),
  // image: image(sequelize, DataTypes),
  // pageArticle: pageArticle(sequelize, DataTypes),
}

Object.keys(models).forEach(key => {
  if ( models[key].associate ) {
    models[key].associate(models)
  }
})
models.Sequelize = sequelize
models.sequelize = sequelize
export default models
