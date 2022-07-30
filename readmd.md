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
## Select a project data which you specified.
**http://localhost:3000/api/project/detail/{projectId}**

```response.json
{
    "status": true,
    "code": 200,
    "response": {
        "project": {
            "id": "2",
            "project_name": "新規作成用プロジェクト名",
            "project_description": "新規作成用プロジェクト概要",
            "user_id": "1",
            "code_number": "szmoK0L",
            "is_displayed": 1,
            "start_date": "2022-05-05T00:00:00.000Z",
            "end_date": "2022-09-09T00:00:00.000Z",
            "created_by": null,
            "createdAt": "2022-07-27T09:34:51.078Z",
            "updatedAt": "2022-07-27T09:34:51.078Z",
            "ProjectImages": [],
            "User": {
                "id": "1",
                "user_name": "管理ユーザー",
                "email": "admin@gmail.com",
                "section_type": null,
                "description": null,
                "password": "$2b$10$M8pUeIiBUXwjjDwnDWoBI.scSU/B47a.qger4s/Qr9kHcNMHv1.5W",
                "deleted_at": null,
                "created_at": "2022-07-27T09:30:16.355Z",
                "updated_at": "2022-07-27T09:30:16.355Z",
                "createdAt": "2022-07-27T09:30:16.355Z",
                "updatedAt": "2022-07-27T09:30:16.355Z",
                "deletedAt": null
            },
            "Tasks": []
        }
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

## Make a new task data.

**http://localhost:3000/api/task/create**

リクエストbody
```request.json
{
    "user_id": 1,
    "project_id": 1,
    "task_name": "タスク名",
    "task_description": "タスク概要",
    "status": 1,
    "priority": 1,
    "start_date": "2022-01-01",
    "end_date": "2022-10-10",
    "image_id": []
}
```

レスポンスbody
```response.json
{
    "status": true,
    "code": 200,
    "response": {
        "id": "2",
        "task_name": "タスク名",
        "user_id": "1",
        "project_id": "1",
        "task_description": "タスク概要",
        "status": 1,
        "priority": 1,
        "is_displayed": 1,
        "code_number": "W3CikmEQl8pf",
        "created_by": "1",
        "deleted_at": null,
        "created_at": "2022-07-29T08:17:34.044Z",
        "updated_at": "2022-07-29T08:17:34.044Z",
        "start_date": "2022-01-01T00:00:00.000Z",
        "end_date": "2022-10-10T00:00:00.000Z",
        "createdAt": "2022-07-29T08:17:34.044Z",
        "updatedAt": "2022-07-29T08:17:34.044Z",
        "deletedAt": null,
        "TaskImages": []
    }
}
```

## Select a existing task record.

**http://localhost:3000/api/task/{taskId}**

```response.json
{
    "status": true,
    "code": 200,
    "response": {
        "id": "5",
        "task_name": "新規 タスク名",
        "user_id": "1",
        "project_id": "1",
        "task_description": "新規 タスク概要",
        "status": 1,
        "priority": 1,
        "is_displayed": 1,
        "code_number": "Uoundefined0uTQ7x4uB",
        "created_by": "1",
        "deleted_at": null,
        "created_at": "2022-07-29T23:24:45.983Z",
        "updated_at": "2022-07-29T23:24:45.983Z",
        "start_date": "2022-01-01T00:00:00.000Z",
        "end_date": "2022-10-10T00:00:00.000Z",
        "createdAt": "2022-07-29T23:24:45.983Z",
        "updatedAt": "2022-07-29T23:24:45.983Z",
        "deletedAt": null
    }
}
```

## Update a selected task record which you specified.

**http://localhost:3000/api/task/update/{taskId}**

```request.json
{
    "user_id": 1,
    "project_id": 1,
    "task_name": "あああああ戦場ヶ原ああああ新規 タスク名",
    "task_description": "新規 タスク概要タスク内容を修正する",
    "status": 1,
    "priority": 1,
    "start_date": "2022-01-01",
    "end_date": "2022-10-10",
    "image_id": [],
    "task_id": 5,
    "is_displayed": 1
}
```

```response.json
{
    "status": true,
    "code": 200,
    "response": {
        "id": "5",
        "task_name": "ああああああえちえちなしたぎあああああ新規 タスク名",
        "user_id": 1,
        "project_id": 1,
        "task_description": "新規 タスク概要タスク内容を修正する",
        "status": 1,
        "priority": 1,
        "is_displayed": 1,
        "code_number": "Uoundefined0uTQ7x4uB",
        "created_by": "1",
        "deleted_at": null,
        "created_at": "2022-07-29T23:24:45.983Z",
        "updated_at": "2022-07-29T23:32:38.724Z",
        "start_date": "2022-01-01T00:00:00.000Z",
        "end_date": "2022-10-10T00:00:00.000Z",
        "createdAt": "2022-07-29T23:24:45.983Z",
        "updatedAt": "2022-07-29T23:33:11.251Z",
        "deletedAt": null,
        "Project": {
            "id": "1",
            "project_name": "新規作成用プロジェクト名",
            "project_description": "新規作成用プロジェクト概要",
            "user_id": "1",
            "code_number": "LNiUSPp",
            "is_displayed": 1,
            "start_date": "2022-05-04T15:00:00.000Z",
            "end_date": "2022-09-08T15:00:00.000Z",
            "created_by": null,
            "createdAt": "2022-07-27T09:34:33.992Z",
            "updatedAt": "2022-07-27T09:34:33.992Z"
        }
    }
}
```


## Send the specified task a star.

**http://localhost:3000/api/star/{taskId}**

```request.json
{
    "task_id": 5,
    "user_id": 4
}
```

```response.json 
{
    "status": true,
    "code": 200,
    "response": {
        "stars": "8"
    }
}
```
