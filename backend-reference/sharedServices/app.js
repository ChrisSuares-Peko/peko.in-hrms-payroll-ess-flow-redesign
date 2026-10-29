/* eslint-disable no-unused-vars */

const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const errorHandler = require("./middlewares/error");
const loggerMiddleware = require("./middlewares/loggerMiddleware");
const logger = require("./utils/logger");

require("./configs/database");
require("./utils/bull/worker/accountingEventsWorker");
require("./utils/bull/worker/accountingReadsWorker");

const app = express();

console.log("Environment: " + app.get("env"));

app.use(cors());
app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: "GO" }));
app.use(compression());
app.use(bodyParser.json({ limit: "10000kb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(loggerMiddleware);

app.get("/", (req, res) => {
  res.send("sharedServices is up and running!!");
});

app.use((req, res) => {
  return res.status(404).json({
    status: 404,
    message: "The requested resource was not found on this server.",
    data: {},
    responseCode: "001",
  });
});

app.use(errorHandler);

app.use((err, req, res, _next) => {
  logger.error("Unhandled error", { err, path: req?.originalUrl });
  return res.status(err?.status || 500).json({
    status: err?.status || 500,
    message: "Internal Server Error",
    data: {},
    responseCode: "001",
  });
});

module.exports = app;
