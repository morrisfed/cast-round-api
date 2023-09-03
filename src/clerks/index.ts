import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { randomUUID } from "crypto";
import { User } from "../interfaces/users";
import transactionalTaskEither from "../model/transaction";
import { createLinkUser, deleteLinkUser } from "../model/link-users";
import { getEvent } from "../events";
import { ModelEventClerkWithEventAndUserDetails } from "../model/interfaces/model-event-clerks";
import {
  findEventClerksByEvent,
  createEventClerkAndReturnExpanded as modelCreateEventClerkAndReturnExpanded,
  deleteEventClerk as modelDeleteEventClerk,
} from "../model/event-clerks";
import { ModelBuildableLinkUser } from "../model/interfaces/model-users";
import {
  hasClerksReadPermissions,
  hasClerksWritePermissions,
} from "../user/permissions";

export const getEventClerks =
  (user: User) =>
  (
    eventId: number
  ): TE.TaskEither<
    Error | "forbidden",
    ModelEventClerkWithEventAndUserDetails[]
  > => {
    if (hasClerksReadPermissions(user)) {
      return transactionalTaskEither((t) =>
        pipe(findEventClerksByEvent(t)(eventId))
      );
    }

    return TE.left("forbidden" as const);
  };

export const createEventClerk =
  (user: User) =>
  (
    eventId: number,
    label: string
  ): TE.TaskEither<
    Error | "forbidden" | "not-found",
    ModelEventClerkWithEventAndUserDetails
  > => {
    if (hasClerksWritePermissions(user)) {
      return transactionalTaskEither((t) =>
        pipe(
          TE.Do,
          TE.bindW("event", () => getEvent(user, eventId)),
          TE.bindW("linkUser", ({ event }) => {
            const id = randomUUID();
            const linkUser: ModelBuildableLinkUser = {
              id,
              enabled: true,
              source: "link",
              link: {
                id,
                label,
                type: "clerk",
                createdByUserId: user.id,
                info: {
                  infoSchemaVersion: 1,
                  clerkForEventId: event.id,
                },
              },
            };
            return createLinkUser(t)(linkUser);
          }),
          TE.bindW("eventClerk", ({ linkUser, event }) =>
            modelCreateEventClerkAndReturnExpanded(t)({
              eventId: event.id,
              clerkUserId: linkUser.id,
            })
          ),
          TE.map(({ eventClerk }) => ({
            ...eventClerk,
            clerkUser: eventClerk.clerkUser,
            event: eventClerk.event,
          }))
        )
      );
    }

    return TE.left("forbidden" as const);
  };

export const removeEventClerk =
  (user: User) =>
  (
    eventId: number,
    eventClerkId: string
  ): TE.TaskEither<Error | "forbidden", number> => {
    if (hasClerksWritePermissions(user)) {
      return transactionalTaskEither((t) =>
        pipe(
          modelDeleteEventClerk(t)(eventId, eventClerkId),
          TE.chainFirstW(() => deleteLinkUser(t)(eventClerkId))
        )
      );
    }

    return TE.left("forbidden" as const);
  };
