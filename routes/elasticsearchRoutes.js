const express = require("express");
const { param, query } = require("express-validator");
const { isAuthorized } = require("../utilities/firebase.js");
const elasticsearchControllers = require("../controllers/elasticsearchControllers.js");
const router = express.Router();

router.get("/info", isAuthorized(["Admin"]), elasticsearchControllers.info);
router.get("/config", isAuthorized(["Admin"]), elasticsearchControllers.config);
router.get("/clean", isAuthorized(["Admin"]), elasticsearchControllers.clean);

router.get("/query", 
  query("dateFrom").notEmpty(),
  query("dateTo").notEmpty(),
  elasticsearchControllers.search
);

router.get(
  "/query/:social",
  param("social").notEmpty(),
  query("size").notEmpty(),
  query("page").notEmpty(),
  elasticsearchControllers.query
);

module.exports = router;
