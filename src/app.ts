import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import session, { SessionOptions } from "express-session";
import * as middlewares from "./middlewares";
import authMiddlewares from "./app-authentication";
import api from "./api";

import sessionStore from "./session-store";

import env from "./utils/env";
import logger from "./utils/logging";

require("dotenv").config();

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // trust first proxy
}

const morganSuccessHandler = morgan("short", {
  skip: (_req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const morganErrorHandler = morgan("short", {
  skip: (_req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

app.use(morganSuccessHandler);
app.use(morganErrorHandler);
app.use(helmet());
app.use(cors());
app.use(express.json());

const sessionOptions: SessionOptions = {
  name: "castaround.sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: env.isProd },
  store: sessionStore,
};
app.use(session(sessionOptions));

app.use(authMiddlewares);

app.use("/api", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
