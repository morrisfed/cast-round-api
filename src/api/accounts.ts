import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { GetAccountsResponse } from "./interfaces/AccountResponses";
import { getAccounts } from "../accounts";
import { standardJsonResponseFold } from "./utils";

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
