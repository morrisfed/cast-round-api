import express from "express";

import adminRouter from "./admin";
import { accountsRouter } from "./accounts";
import { profileRouter } from "./profile";
import { delegatesRouter } from "./delegates";
import { eventsRouter } from "./events";

const apiRouter = express.Router();

// All API paths must be authenticated.
// Paths related to the authentication process are handled through a different router provided
// by src/authentication/appAuthentication.ts.
apiRouter.use((req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.sendStatus(401);
  }
});

apiRouter.use("/profile", profileRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/accounts", accountsRouter);
apiRouter.use("/delegates", delegatesRouter);
apiRouter.use("/events", eventsRouter);

export default apiRouter;
