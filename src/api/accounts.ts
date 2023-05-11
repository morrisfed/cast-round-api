import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import {
  CreateAccountDelegateResponse,
  GetAccountDelegatesResponse,
  GetAccountResponse,
  GetAccountsResponse,
} from "./interfaces/AccountResponses";
import { getAccountUser, getAccountDelegates, getAccounts } from "../accounts";
import { standardJsonResponseFold } from "./utils";
import { createGroupDelegate } from "../delegates";
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

accountsRouter.get<{ accountId: string }, GetAccountDelegatesResponse>(
  "/:accountId/delegates",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getAccountDelegatesResponseTask = pipe(
        getAccountDelegates(req.user)(req.params.accountId),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else if (err === "account-not-found") {
              res.sendStatus(404);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (results) => {
            res.json({ delegates: results });
            return T.of(undefined);
          }
        )
      );

      await getAccountDelegatesResponseTask();
    } else {
      throw new Error();
    }
  }
);

accountsRouter.post<
  { accountId: string },
  CreateAccountDelegateResponse,
  { label: string }
>("/:accountId/delegates", async (req, res) => {
  if (req.isAuthenticated()) {
    const createAccountDelegateResponseTask = pipe(
      createGroupDelegate(req.user)({
        label: req.body.label,
        delegateForAccountId: req.params.accountId,
      }),
      TE.fold(
        (err) => {
          if (err === "forbidden") {
            res.sendStatus(403);
          } else if (err === "invalid-delegate-for") {
            res.sendStatus(400);
          } else if (err === "not-found") {
            res.sendStatus(404);
          } else {
            res.sendStatus(500);
            logger.error(err);
          }
          return T.of(undefined);
        },
        () => {
          res.json({ delegate: { id: "TEST" } });
          return T.of(undefined);
        }
      )
    );

    await createAccountDelegateResponseTask();
  } else {
    throw new Error();
  }
});
