const configs = require("./configurations/app.config.js");
const express = require("express");
const helmet = require("helmet");
const compression = require("express-compression");
const bodyParse = require("body-parser");
const verify = require("./utilities/firebase.js").verify;
var morgan = require("morgan");

//MIDDLEWARES
const app = express();

//ADDED FOR LOGGING
// app.use(morgan("combined"));

app.use(helmet());
app.use(compression());
app.use(bodyParse.json());
app.use(verify);

//ROUTES
const twitterRoutes = require("./routes/twitterRoutes");
const youTubeRoutes = require("./routes/youtubeRoutes.js");
const twitchRoutes = require("./routes/twitchRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const streamRoutes = require("./routes/streamRoutes.js");
const elasticsearchRoutes = require("./routes/elasticsearchRoutes.js");

//HEADERS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

//ROUTER
app.use("/api/twitter", twitterRoutes);
app.use("/api/youtube", youTubeRoutes);
app.use("/api/twitch", twitchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/elasticsearch", elasticsearchRoutes);

app.use("/api/checker", (req, res, next) => {
  try {
    res.status(200).json({ msg: "ONS BE is working well!" });
  } catch (err) {
    next(err);
  }
});
app.use("/", (req, res, next) => {
  const status = 400;
  const message = "Nothing to see here, sorry";
  res.status(status).json({ status: status, message: message });
});
app.use((error, req, res, next) => {
  console.log("[ons]", error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ status: status, message: message });
});

app.listen(configs.appDefaultPort, () => {
  console.log(
    `${configs.appName} is listening to port: ${configs.appDefaultPort}`
  );
});
