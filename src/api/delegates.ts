import express from "express";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  CreateEventGroupDelegateRequest,
  CreateEventGroupDelegateResponse,
  GetDelegatesResponse,
} from "./interfaces/DelegateApi";
import { createEventGroupDelegate, getDelegates } from "../delegates";
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

delegatesRouter.post<
  {},
  CreateEventGroupDelegateResponse,
  CreateEventGroupDelegateRequest
>("/eventgroupdelegates", async (req, res) => {
  if (req.isAuthenticated()) {
    const createEventGroupDelegateResponseTask = pipe(
      createEventGroupDelegate(req.user)(req.body),
      TE.mapLeft((err) =>
        err === "invalid-delegate-for" ? ("bad-request" as const) : err
      ),
      TE.map((eventGroupDelegate) => ({
        delegateUserId: eventGroupDelegate.delegateUserId,
        label: req.body.label,
        delegateUserLoginPath: `/api/auth/delegate/${eventGroupDelegate.delegateUserId}`,
        eventId: eventGroupDelegate.eventId,
        delegateForAccountUserId: eventGroupDelegate.delegateForUserId,
      })),
      standardJsonResponseFold(res)
    );

    await createEventGroupDelegateResponseTask();
  } else {
    throw new Error();
  }
});
