// アプリケーション内設定

let applicationConfig = {

  sectionType: [
    {
      id: 1, value: "セクションA",
    },
    {
      id: 2, value: "セクションB",
    },
    {
      id: 3, value: "セクションC",
    },
    {
      id: 4, value: "セクションD",
    },
  ],

  statusList: [
    {id: 0, value: "※設定して下さい"},
    {id: 1, value: "未確認"},
    {id: 2, value: "確認済み"},
    {id: 3, value: "作業中"},
    {id: 4, value: "チェックバック中"},
    {id: 5, value: "作業完了"},
    {id: 6, value: "タスク終了"},
  ],

  binaryType: {
    on: 1,
    off: 0,
  },

  displayStatus: [
    {id: 1, value: "表示する"},
    {id: 0, value: "非表示にする"},
  ]
}

module.exports = applicationConfig;