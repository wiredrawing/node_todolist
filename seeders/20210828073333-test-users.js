// sequelize seed:generate --name test-users
"use strict";

let bc = require("bcrypt");
module.exports = {
  up: (queryInterface, DataTypes) => {
    console.log("seeder command start.");
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    const now = new Date();
    return new Promise(function (resolve, reject) {
      console.log("===>");
      // 実行日時取得

      let rawPassword = "AAAaaa123";
      bc.genSalt(10, function (error, salt) {
        console.log(error);
        console.log("salt ==> ", salt);
        bc.hash(rawPassword, salt, function (error, hash) {
          console.log("hash ==> ", hash);
          let hashedPassword = hash;
          console.log(hash);
          resolve(hashedPassword);
        });
      });
    }).then((hash) => {
      return queryInterface.bulkInsert("users", [
        {
          user_name: "ダミーユーザー",
          email: "admin@gmail.com",
          password: hash,
          created_at: now,
          updated_at: now,
        },
      ]);
    }).catch((error) => {
      console.log(error);
      throw new Error(error);
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete("users", null, {});
  },
};
