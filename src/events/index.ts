import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as ROA from "fp-ts/lib/ReadonlyArray";

import { User } from "../interfaces/users";
import {
  hasEventsReadAllPermission,
  hasEventsReadCurrentPermission,
  hasEventsWriteAllPermission,
  hasMotionsReadAllPermission,
} from "../user/permissions";
import {
  findAllEvents,
  findCurrentEventWithMotionsById,
  findEventsByDate,
  findEventWithMotionsById,
  createEvent as modelCreateEvent,
  updateEvent as modelUpdateEvent,
} from "../model/events";
import {
  findAllEventMotions,
  findMotionById,
  createEventMotion as modelCreateEventMotion,
  updateEventMotion as modelUpdateEventMotion,
} from "../model/motions";
import transactionalTaskEither from "../model/transaction";
import {
  BuildableEvent,
  Event,
  EventUpdates,
  EventWithMotions,
} from "../interfaces/events";
import {
  BuildableMotion,
  Motion,
  MotionStatus,
  MotionUpdates,
} from "../interfaces/motions";

const showMotionForUser = (user: User) => (motion: Motion) =>
  hasMotionsReadAllPermission(user) ||
  (motion.status !== "draft" && motion.status !== "discarded");

export const getEvents = (
  user: User
): TE.TaskEither<Error | "forbidden", readonly Event[]> => {
  if (hasEventsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAllEvents(t));
  }
  if (hasEventsReadCurrentPermission(user)) {
    return transactionalTaskEither((t) => findEventsByDate(t)(new Date()));
  }
  return TE.left("forbidden");
};

export const getEvent = (
  user: User,
  eventId: number
): TE.TaskEither<Error | "forbidden" | "not-found", EventWithMotions> => {
  if (hasEventsReadAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        findEventWithMotionsById(t)(eventId),
        TE.chainW(TE.fromNullable("not-found" as const))
      )
    );
  }

  if (hasEventsReadCurrentPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        findCurrentEventWithMotionsById(t)(eventId)(new Date()),
        TE.chainW(TE.fromNullable("not-found" as const)),
        TE.map((event) => ({
          ...event,
          motions: ROA.filter(showMotionForUser(user))(event.motions),
        }))
      )
    );
  }
  return TE.left("forbidden");
};

/**
 * Confirm the user has permission to create an event.
 */
const hasPermissionToCreateGroupDelegateForAccount = (user: User) =>
  hasEventsWriteAllPermission(user);

export const createEvent =
  (user: User) =>
  (
    buildableEvent: BuildableEvent
  ): TE.TaskEither<Error | "forbidden", EventWithMotions> => {
    if (hasPermissionToCreateGroupDelegateForAccount(user)) {
      return transactionalTaskEither((t) =>
        pipe(modelCreateEvent(t)(buildableEvent))
      );
    }

    return TE.left("forbidden");
  };

export const updateEvent = (
  user: User,
  eventId: number,
  eventUpdates: EventUpdates
): TE.TaskEither<Error | "not-found" | "forbidden", Event> => {
  if (hasEventsWriteAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(modelUpdateEvent(t)(eventId, eventUpdates))
    );
  }
  return TE.left("forbidden");
};

export const getEventMotions = (
  user: User,
  eventId: number
): TE.TaskEither<Error | "not-found" | "forbidden", Motion[]> => {
  if (hasEventsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAllEventMotions(t)(eventId));
  }
  return TE.left("forbidden");
};

export const createEventMotion = (
  user: User,
  eventId: number,
  buildableMotion: BuildableMotion
): TE.TaskEither<Error | "not-found" | "forbidden", Motion> => {
  if (hasEventsWriteAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        modelCreateEventMotion(t)({
          title: buildableMotion.title,
          description: buildableMotion.description,
          eventId,
          status: "draft",
          voteDefinition: {
            definitionSchemaVersion: 1,
            roleVotes: [
              { role: "ADMINISTRATOR", votes: 2 },
              { role: "GROUP_VOTER", votes: 10 },
            ],
            responses: [{ sequence: 5, label: "555" }],
          },
        })
      )
    );
  }
  return TE.left("forbidden");
};

export const updateEventMotion = (
  user: User,
  eventId: number,
  motionId: number,
  motionUpdates: MotionUpdates
): TE.TaskEither<Error | "not-found" | "forbidden", Motion> => {
  if (hasEventsWriteAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(modelUpdateEventMotion(t)(eventId, motionId)(motionUpdates))
    );
  }
  return TE.left("forbidden");
};

export const setEventMotionStatus = (
  user: User,
  eventId: number,
  motionId: number,
  status: MotionStatus
): TE.TaskEither<Error | "not-found" | "forbidden", Motion> => {
  if (hasEventsWriteAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        modelUpdateEventMotion(t)(eventId, motionId)({
          status,
        })
      )
    );
  }
  return TE.left("forbidden");
};

export const getEventMotion = (
  motionId: number
): TE.TaskEither<Error | "not-found", Motion> =>
  transactionalTaskEither((t) =>
    pipe(
      findMotionById(t)(motionId),
      TE.chainW(TE.fromNullable("not-found" as const))
    )
  );
