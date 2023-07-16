const express = require("express");
const { isAuthorized } = require("../utilities/firebase.js");
const elasticsearchControllers = require("../controllers/elasticsearchControllers.js");
const router = express.Router();

router.get("/info", isAuthorized(["Admin"]), elasticsearchControllers.info);
router.get("/config", isAuthorized(["Admin"]), elasticsearchControllers.config);

module.exports = router;
