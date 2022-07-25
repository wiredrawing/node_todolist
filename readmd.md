# How to run this appliction

## Execute installing npm modules.
**npm install**

## Execute migration files.
**sequelize db:migrate**

## Execute seeder files.
**sequelize db:seed:all**

```ini
Sequelizeによるマイグレーション管理はCommonJSモードで管理するため

マイグレーションファイル名の拡張子を.cjsとする

アプリケーション箇所に関してはESModule形式で実行させるため
拡張子は.jsとする

そのためpackage.jsonの "type"属性は "module" とする
```



# Option commands.
## The command to initialize DB records.
**sequelize db:migrate:undo:all**
