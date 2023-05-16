import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { User } from "../interfaces/UserInfo";
import {
  hasEventsReadAllPermission,
  hasEventsWriteAllPermission,
} from "../user/permissions";
import {
  findAllEvents,
  findEventById,
  createEvent as modelCreateEvent,
} from "../model/events";
import {
  findAllEventVotes,
  findVoteById,
  createEventVote as modelCreateEventVote,
  updateEventVote as modelUpdateEventVote,
} from "../model/votes";
import transactionalTaskEither from "../model/transaction";
import { BuildableEvent, Event } from "../interfaces/events";
import { BuildableVote, Vote, VoteUpdates } from "../interfaces/votes";

export const getEvents = (
  user: User
): TE.TaskEither<Error | "forbidden", readonly Event[]> => {
  if (hasEventsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAllEvents(t));
  }
  return TE.left("forbidden");
};

export const getEvent = (
  user: User,
  eventId: number
): TE.TaskEither<Error | "forbidden" | "not-found", Event> => {
  if (hasEventsReadAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(
        findEventById(t)(eventId),
        TE.chainW(TE.fromNullable("not-found" as const))
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
  ): TE.TaskEither<Error | "forbidden", Event> => {
    if (hasPermissionToCreateGroupDelegateForAccount(user)) {
      return transactionalTaskEither((t) =>
        pipe(modelCreateEvent(t)(buildableEvent))
      );
    }

    return TE.left("forbidden");
  };

export const getEventVotes = (
  user: User,
  eventId: number
): TE.TaskEither<Error | "not-found" | "forbidden", Vote[]> => {
  if (hasEventsReadAllPermission(user)) {
    return transactionalTaskEither((t) => findAllEventVotes(t)(eventId));
  }
  return TE.left("forbidden");
};

export const createEventVote = (
  user: User,
  eventId: number,
  buildableVote: BuildableVote
): TE.TaskEither<Error | "not-found" | "forbidden", Vote> => {
  if (hasEventsWriteAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(modelCreateEventVote(t)(buildableVote))
    );
  }
  return TE.left("forbidden");
};

export const updateEventVote = (
  user: User,
  eventId: number,
  voteId: number,
  voteUpdates: VoteUpdates
): TE.TaskEither<Error | "not-found" | "forbidden", Vote> => {
  if (hasEventsWriteAllPermission(user)) {
    return transactionalTaskEither((t) =>
      pipe(modelUpdateEventVote(t)(eventId, voteId)(voteUpdates))
    );
  }
  return TE.left("forbidden");
};

export const getEventVote = (
  voteId: number
): TE.TaskEither<Error | "not-found", Vote> =>
  transactionalTaskEither((t) =>
    pipe(
      findVoteById(t)(voteId),
      TE.chainW(TE.fromNullable("not-found" as const))
    )
  );
