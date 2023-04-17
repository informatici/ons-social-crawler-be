const express = require("express");
const { body } = require("express-validator");
const authControllers = require("../controllers/authControllers");
const router = express.Router();

router.get("/", authControllers.index);
router.post(
  "/",
  body("email").isString().isEmail().notEmpty().escape(),
  body("password").isString().notEmpty().isLength({ min: 6 }).escape(),
  body("displayName").isString().notEmpty().escape(),
  body("userRoles").isArray().notEmpty().optional({ nullable: true }),
  authControllers.create
);
router.put(
  "/",
  body("uid").isString().notEmpty().escape(),
  body("email").isString().isEmail().notEmpty().escape(),
  body("password").isString().notEmpty().isLength({ min: 6 }).escape(),
  body("displayName").isString().notEmpty().escape(),
  body("userRoles").isArray().notEmpty().optional({ nullable: true }),
  authControllers.update
);
router.delete(
  "/",
  body("uid").isString().notEmpty().escape(),
  authControllers.destroy
);
router.post("/verify", authControllers.verify);

module.exports = router;
