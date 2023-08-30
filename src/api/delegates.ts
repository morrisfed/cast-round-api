import express from "express";

import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";

import {
  CreateEventGroupDelegateRequest,
  CreateEventGroupDelegateResponse,
} from "./interfaces/DelegateApi";
import {
  createEventGroupDelegate,
  deleteEventGroupDelegate,
} from "../delegates";
import { standardJsonResponseFold } from "./utils";

const EventIdAndGroupIdObject = t.strict({
  eventId: IntFromString,
  groupMemberId: t.string,
});
type EventIdAndGroupIdObject = t.TypeOf<typeof EventIdAndGroupIdObject>;

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

delegatesRouter.delete<EventIdAndGroupIdObject>(
  "/eventgroupdelegates/:eventId/:groupMemberId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const deleteEventGroupDelegateResponseTask = pipe(
        EventIdAndGroupIdObject.decode(req.params),
        TE.fromEither,
        TE.chainW((ids) =>
          deleteEventGroupDelegate(req.user)(ids.eventId)(ids.groupMemberId)
        ),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else if (err === "not-found") {
              res.sendStatus(404);
            } else {
              res.sendStatus(500);
            }
            return T.of(undefined);
          },
          () => {
            res.sendStatus(204);
            return T.of(undefined);
          }
        )
      );

      await deleteEventGroupDelegateResponseTask();
    } else {
      throw new Error();
    }
  }
);
