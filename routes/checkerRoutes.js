const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  try {
    res.status(200).json({ status: "done" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
