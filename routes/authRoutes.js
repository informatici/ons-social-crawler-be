const express = require("express");
const { param, body } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const authControllers = require("../controllers/authControllers");
const router = express.Router();

router.get("/", isAuthorized(["Admin"]), authControllers.index);
router.get(
  "/:uid",
  isAuthorized(["Admin"]),
  param("uid").notEmpty(),
  authControllers.indexId
);
router.post(
  "/",
  isAuthorized(["Admin"]),
  body("email").isString().isEmail().notEmpty().escape(),
  body("password").isString().notEmpty().isLength({ min: 6 }).escape(),
  body("displayName").isString().notEmpty().escape(),
  body("userRoles").isArray().notEmpty().optional({ nullable: true }),
  authControllers.create
);
router.put(
  "/",
  isAuthorized(["Admin"]),
  body("uid").isString().notEmpty().escape(),
  body("email").isString().isEmail().notEmpty().escape(),
  body("password")
    .isString()
    .optional({ nullable: true })
    .bail()
    .isLength({ min: 6 })
    .escape(),
  body("displayName").isString().notEmpty().escape(),
  body("userRoles").isArray().notEmpty().optional({ nullable: true }),
  authControllers.update
);
router.delete(
  "/",
  isAuthorized(["Admin"]),
  body("uid").isString().notEmpty().escape(),
  authControllers.destroy
);
router.post("/verify", authControllers.verify);

module.exports = router;
