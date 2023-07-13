import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import {
  GetAccountResponse,
  GetAccountsResponse,
} from "./interfaces/AccountResponses";
import { getAccountUser, getAccounts } from "../accounts";
import { standardJsonResponseFold } from "./utils";
import logger from "../utils/logging";

export const accountsRouter = express.Router();

accountsRouter.get<{}, GetAccountsResponse>("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const getAccountsResponseTask = pipe(
      getAccounts(req.user),
      TE.map((accounts) => ({ accounts })),
      standardJsonResponseFold(res)
    );

    await getAccountsResponseTask();
  } else {
    throw new Error();
  }
});

accountsRouter.get<{ accountId: string }, GetAccountResponse>(
  "/:accountId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getAccountResponseTask = pipe(
        getAccountUser(req.user, req.params.accountId),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else if (err === "not-found") {
              res.sendStatus(404);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (accountUser) => {
            res.json({ account: accountUser.account });
            return T.of(undefined);
          }
        )
      );

      await getAccountResponseTask();
    } else {
      throw new Error();
    }
  }
);
