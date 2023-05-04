import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import * as middlewares from "./middlewares";
import api from "./api";

import env from "./utils/env";
import logger from "./utils/logging";
import { sessionRequestHandler } from "./authentication/session";
import { authenticationRequestHandlers } from "./authentication/appAuthentication";

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

app.use(sessionRequestHandler);
app.use(authenticationRequestHandlers);

app.use("/api", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
