import express from "express";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { GetDelegatesResponse } from "./interfaces/DelegateResponses";
import { getDelegates } from "../delegates";
import { standardJsonResponseFold } from "./utils";

export const delegatesRouter = express.Router();

delegatesRouter.get<{}, GetDelegatesResponse>("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const getDelegatesResponseTask = pipe(
      getDelegates(req.user),
      TE.map((delegates) => ({ delegates })),
      standardJsonResponseFold(res)
    );

    await getDelegatesResponseTask();
  } else {
    throw new Error();
  }
});
