const configs = require("./configurations/app.config.js");
const express = require("express");
const helmet = require("helmet");
const compression = require("express-compression");
const bodyParse = require("body-parser");

//MIDDLEWARES
const app = express();
app.use(helmet());
app.use(compression());
app.use(bodyParse.json());

//ROUTES
const twitterRoutes = require("./routes/twitterRoutes");
const checkerRoutes = require("./routes/checkerRoutes");

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
app.use("/twitter", twitterRoutes);
app.use("/checker", checkerRoutes);
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
