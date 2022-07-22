// シーダーファイルを生成する
// sequelize seed:generate --name test-users
// 作成したシーダーファイルを実行する
// sequelize db:seed:all
'use strict'

const bc = require('bcrypt')
module.exports = {
  up: (queryInterface, DataTypes) => {
    console.log('seeder command start.')
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    const now = new Date()
    return new Promise(function (resolve, reject) {
      console.log('===>')
      // 実行日時取得

      const rawPassword = 'AAAaaa123'
      bc.genSalt(10, function (error, salt) {
        console.log(error)
        console.log('salt ==> ', salt)
        bc.hash(rawPassword, salt, function (error, hash) {
          if (error) {
            console.log(error)
            reject(new Error(error))
          }
          console.log('hash ==> ', hash)
          const hashedPassword = hash
          console.log(hash)
          resolve(hashedPassword)
        })
      })
    }).then((hash) => {
      const bulkUsers = [
        {
          user_name: '管理ユーザー',
          email: 'admin@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        },
        {
          user_name: 'ユーザー1',
          email: 'user1@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        },
        {
          user_name: 'ユーザー2',
          email: 'user2@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        },
        {
          user_name: 'ダミーユーザー3',
          email: 'user3@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        },
        {
          user_name: 'ダミーユーザー4',
          email: 'user4@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        },
        {
          user_name: 'ダミーユーザー5',
          email: 'user5@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        },
        {
          user_name: 'ダミーユーザー6',
          email: 'user6@gmail.com',
          password: hash,
          created_at: now,
          updated_at: now
        }
      ]
      return queryInterface.bulkInsert('users', bulkUsers)
    }).catch((error) => {
      console.log(error)
      throw new Error(error)
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('users', null, {})
  }
}
