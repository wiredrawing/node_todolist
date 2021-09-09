const { validationResult } = require("express-validator");

module.exports = function (options) {
  let routeName = "";
  return [
    function (req, res, next) {
      console.log("---> 1");
      console.log("req.path --->", req.path);
      routeName = req.path;
      next();
    },

    function (req, res, next) {
      console.log("---> 2");
      const errors = validationResult(req);
      console.log(errors.errors);
      next();
    },
  ];
};
