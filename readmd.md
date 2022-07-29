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

<hr>

# Api list on express application.

## Make a new project.
**http://localhost:3000/api/project/create/**

リクエストbody
```request.json
{
    "project_name": "project_name",
    "project_description": "project_description",
    "image_id": [],
    "start_date": "2022-01-01",
    "end_date": "2022-10-10",
    "is_displayed": 1,
    "user_id": 1
}
```

レスポンスbody
```response.json
{
    "status": true,
    "code": 200,
    "response": {
        "id": "8",
        "project_name": "project_name",
        "project_description": "project_description",
        "user_id": "1",
        "is_displayed": 1,
        "code_number": "rztIiEL",
        "start_date": "2022-01-01T00:00:00.000Z",
        "end_date": "2022-10-10T00:00:00.000Z",
        "updatedAt": "2022-07-29T07:06:35.044Z",
        "createdAt": "2022-07-29T07:06:35.044Z",
        "created_by": null
    }
}
```
## Update a project which you specified.
**http://localhost:3000/api/project/update/{projectId}**

```request.json
{
    "project_name": "project_name",
    "project_description": "project_description",
    "image_id": [],
    "start_date": "2022-01-01",
    "end_date": "2022-10-10",
    "is_displayed": 1,
    "user_id": 1,
    "project_id": 8,
    "created_by": 1
}
```

