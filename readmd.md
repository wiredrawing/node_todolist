## Migrationを実行する
**sequelize db:migrate**

## 実行したMigrationをすべて初期化
**sequelize db:migrate:undo:all**

## 作成したすべてのSeederファイルを実行する
**sequelize db:seed:all**

```ini
Sequelizeによるマイグレーション管理はCommonJSモードで管理するため

マイグレーションファイル名の拡張子を.cjsとする

アプリケーション箇所に関してはESModule形式で実行させるため
拡張子は.jsとする

そのためpackage.jsonの "type"属性は "module" とする
```

