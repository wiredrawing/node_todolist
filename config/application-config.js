// アプリケーション内設定

const applicationConfig = {

  sectionType: [
    {
      id: 1, value: 'セクションA'
    },
    {
      id: 2, value: 'セクションB'
    },
    {
      id: 3, value: 'セクションC'
    },
    {
      id: 4, value: 'セクションD'
    }
  ],

  status: {
    uncheck: 1,
    checked: 2,
    working: 3,
    checkBack: 4,
    completed: 5,
    finish: 6
  },
  statusList: [
    { id: 0, value: '※設定して下さい' },
    { id: 1, value: '未確認' },
    { id: 2, value: '確認済み' },
    { id: 3, value: '作業中' },
    { id: 4, value: 'チェックバック中' },
    { id: 5, value: '作業完了' },
    { id: 6, value: 'タスク終了' }
  ],

  binaryType: {
    on: 1,
    off: 0
  },

  displayStatusList: [
    { id: 1, value: '表示する' },
    { id: 0, value: '非表示にする' }
  ],

  priority: {
    low: 1,
    middle: 2,
    high: 3,
    emergency: 4
  },
  // 作業優先度設定
  priorityStatusList: [
    { id: 0, value: '未設定' },
    { id: 1, value: '低' },
    { id: 2, value: '中' },
    { id: 3, value: '高' },
    { id: 4, value: '緊急' }
  ],

  // 許可された画像のmimeType
  mimeTypeList: {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf'
  }
}

module.exports = applicationConfig
