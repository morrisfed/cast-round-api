import express from "express";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  CreateEventGroupDelegateRequest,
  CreateEventGroupDelegateResponse,
} from "./interfaces/DelegateApi";
import { createEventGroupDelegate } from "../delegates";
import { standardJsonResponseFold } from "./utils";

export const delegatesRouter = express.Router();

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
        delegateUserLoginPath: `/api/auth/link/${eventGroupDelegate.delegateUserId}`,
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
