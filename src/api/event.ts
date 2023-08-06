import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as A from "fp-ts/lib/Array";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";
import { NonEmptyString } from "io-ts-types";
import { pipe } from "fp-ts/lib/function";

import express from "express";

import { standardJsonResponseFold } from "./utils";
import logger from "../utils/logging";

import {
  createEventMotion,
  getEvent,
  getEventMotion,
  getEventMotions,
  setEventMotionStatus,
  updateEvent,
  updateEventMotion,
} from "../events";
import {
  CreateMotionRequest,
  CreateMotionResponse,
  GetEventResponse,
  GetMotionResponse,
  GetMotionsResponse,
  PatchEventRequest,
  PatchEventResponse,
  PatchMotionRequest,
  PatchMotionResponse,
  SetMotionStatusRequest,
  SetMotionStatusResponse,
} from "./interfaces/EventApi";
import { getEventGroupDelegate } from "../delegates";
import { GroupDelegateResponse } from "./interfaces/DelegateApi";
import { EventTellorsResponse } from "./interfaces/TellorApi";
import { getEventTellors, removeEventTellor } from "../tellors";

const EventIdObject = t.strict({
  eventId: IntFromString,
});
type EventIdObject = t.TypeOf<typeof EventIdObject>;

const EventIdAndTellorIdObject = t.strict({
  eventId: IntFromString,
  tellorId: NonEmptyString,
});
type EventIdAndTellorIdObject = t.TypeOf<typeof EventIdAndTellorIdObject>;

const EventIdAndMotionIdObject = t.strict({
  eventId: IntFromString,
  motionId: IntFromString,
});
type EventIdAndMotionIdObject = t.TypeOf<typeof EventIdAndMotionIdObject>;

export const eventRouter = express.Router({ mergeParams: true });

eventRouter.get<EventIdObject, GetEventResponse>("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const getEventResponseTask = pipe(
      EventIdObject.decode(req.params),
      E.mapLeft(() => "bad-request" as const),
      TE.fromEither,
      TE.chainW(({ eventId }) => getEvent(req.user, eventId)),
      TE.map((event) => ({ event })),
      standardJsonResponseFold(res)
    );

    await getEventResponseTask();
  } else {
    throw new Error();
  }
});

eventRouter.patch<EventIdObject, PatchEventResponse, PatchEventRequest>(
  "/",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const updateEventResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request"),
        TE.fromEither,
        TE.chainW(({ eventId }) =>
          updateEvent(req.user, eventId, req.body.eventUpdates)
        ),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else if (err === "not-found") {
              res.sendStatus(404);
            } else if (err === "bad-request") {
              res.sendStatus(400);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (event) => {
            res.json({ event });
            return T.of(undefined);
          }
        )
      );

      await updateEventResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.get<EventIdObject, GetMotionsResponse>(
  "/motions",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventMotionsResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId }) => getEventMotions(req.user, eventId)),
        TE.map((motions) => ({ motions })),
        standardJsonResponseFold(res)
      );

      await getEventMotionsResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.get<EventIdObject, GroupDelegateResponse>(
  "/groupdelegate",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getGroupDelegateResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId }) => getEventGroupDelegate(req.user)(eventId)),
        TE.map((eventGroupDelegate) => ({
          delegateUserId: eventGroupDelegate.delegateUser.id,
          label: eventGroupDelegate.delegateUser.label,
          delegateUserLoginPath: `/api/auth/link/${eventGroupDelegate.delegateUserId}`,
          eventId: eventGroupDelegate.eventId,
          delegateForAccountUserId: eventGroupDelegate.delegateFor.id,
        })),
        standardJsonResponseFold(res)
      );

      await getGroupDelegateResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.get<EventIdObject, EventTellorsResponse>(
  "/tellors",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventTellorsResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId }) => getEventTellors(req.user)(eventId)),
        TE.map(
          A.map((tellor) => ({
            tellorUserId: tellor.tellorUserId,
            tellorUserLoginPath: `/api/auth/link/${tellor.tellorUserId}`,
            eventId: tellor.eventId,
            label: tellor.tellorUser.label,
          }))
        ),
        TE.map((tellors) => ({ tellors })),
        standardJsonResponseFold(res)
      );

      await getEventTellorsResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.delete<EventIdAndTellorIdObject>(
  "/tellors/:tellorId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const removeEventTellorResponseTask = pipe(
        EventIdAndTellorIdObject.decode(req.params),
        E.mapLeft(() => "bad-request" as const),
        TE.fromEither,
        TE.chainW(({ eventId, tellorId }) =>
          removeEventTellor(req.user)(eventId, tellorId)
        ),
        standardJsonResponseFold(res)
      );

      await removeEventTellorResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.post<EventIdObject, CreateMotionResponse, CreateMotionRequest>(
  "/motions",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const createMotionResponseTask = pipe(
        EventIdObject.decode(req.params),
        E.mapLeft(() => "bad-request"),
        TE.fromEither,
        TE.chainW(({ eventId }) =>
          createEventMotion(req.user, eventId, {
            ...req.body.motion,
            eventId,
          })
        ),
        TE.fold(
          (err) => {
            if (err === "forbidden") {
              res.sendStatus(403);
            } else {
              res.sendStatus(500);
              logger.error(err);
            }
            return T.of(undefined);
          },
          (motion) => {
            res.json({ motion });
            return T.of(undefined);
          }
        )
      );

      await createMotionResponseTask();
    } else {
      throw new Error();
    }
  }
);

eventRouter.patch<
  EventIdAndMotionIdObject,
  PatchMotionResponse,
  PatchMotionRequest
>("/motions/:motionId", async (req, res) => {
  if (req.isAuthenticated()) {
    const updateMotionResponseTask = pipe(
      EventIdAndMotionIdObject.decode(req.params),
      E.mapLeft(() => "bad-request"),
      TE.fromEither,
      TE.chainW(({ eventId, motionId }) =>
        updateEventMotion(req.user, eventId, motionId, req.body.motionUpdates)
      ),
      TE.fold(
        (err) => {
          if (err === "forbidden") {
            res.sendStatus(403);
          } else if (err === "not-found") {
            res.sendStatus(404);
          } else if (err === "bad-request") {
            res.sendStatus(400);
          } else {
            res.sendStatus(500);
            logger.error(err);
          }
          return T.of(undefined);
        },
        (motion) => {
          res.json({ motion });
          return T.of(undefined);
        }
      )
    );

    await updateMotionResponseTask();
  } else {
    throw new Error();
  }
});

eventRouter.post<
  EventIdAndMotionIdObject,
  SetMotionStatusResponse,
  SetMotionStatusRequest
>("/motions/:motionId/status", async (req, res) => {
  if (req.isAuthenticated()) {
    const setMotionStatusResponseTask = pipe(
      E.Do,
      E.bind("ids", () => EventIdAndMotionIdObject.decode(req.params)),
      E.bind("statusRequest", () => SetMotionStatusRequest.decode(req.body)),
      E.mapLeft(() => "bad-request"),
      TE.fromEither,
      TE.chainW(({ ids, statusRequest }) =>
        setEventMotionStatus(
          req.user,
          ids.eventId,
          ids.motionId,
          statusRequest.status
        )
      ),
      TE.fold(
        (err) => {
          if (err === "forbidden") {
            res.sendStatus(403);
          } else if (err === "not-found") {
            res.sendStatus(404);
          } else if (err === "bad-request") {
            res.sendStatus(400);
          } else {
            res.sendStatus(500);
            logger.error(err);
          }
          return T.of(undefined);
        },
        (motion) => {
          res.json({ status: motion.status });
          return T.of(undefined);
        }
      )
    );

    await setMotionStatusResponseTask();
  } else {
    throw new Error();
  }
});

eventRouter.get<{ eventId: number; motionId: number }, GetMotionResponse>(
  "/motions/:motionId",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const getEventMotionResponseTask = pipe(
        getEventMotion(req.params.motionId),
        TE.map((motion) => ({ motion })),
        standardJsonResponseFold(res)
      );

      await getEventMotionResponseTask();
    } else {
      throw new Error();
    }
  }
);
