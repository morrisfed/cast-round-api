import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { randomUUID } from "crypto";
import { BuildableLinkUser, User } from "../interfaces/users";
import {
  hasTellorsReadPermissions,
  hasTellorsWritePermissions,
} from "../user/permissions";
import transactionalTaskEither from "../model/transaction";
import { createLinkUser, deleteLinkUser } from "../model/link-users";
import { getEvent } from "../events";
import {
  findEventTellorsByEvent,
  createEventTellor as modelCreateEventTellor,
  deleteEventTellor as modelDeleteEventTellor,
} from "../model/event-tellors";
import { EventTellor } from "../interfaces/tellors";
import { CreateEventTellorRequest } from "../api/interfaces/TellorApi";

export const getEventTellors =
  (user: User) =>
  (eventId: number): TE.TaskEither<Error | "forbidden", EventTellor[]> => {
    if (hasTellorsReadPermissions(user)) {
      return transactionalTaskEither((t) =>
        pipe(findEventTellorsByEvent(t)(eventId))
      );
    }

    return TE.left("forbidden" as const);
  };

export const createEventTellor =
  (user: User) => (createRequest: CreateEventTellorRequest) => {
    if (hasTellorsWritePermissions(user)) {
      return transactionalTaskEither((t) =>
        pipe(
          TE.Do,
          TE.bindW("event", () => getEvent(user, createRequest.eventId)),
          TE.bindW("linkUser", ({ event }) => {
            const id = randomUUID();
            const linkUser: BuildableLinkUser = {
              id,
              enabled: true,
              source: "link",
              link: {
                id,
                label: createRequest.label,
                type: "tellor",
                createdByUserId: user.id,
                info: {
                  infoSchemaVersion: 1,
                  tellorForEventId: event.id,
                },
              },
            };
            return createLinkUser(t)(linkUser);
          }),
          TE.chainW(({ linkUser, event }) =>
            modelCreateEventTellor(t)({
              eventId: event.id,
              tellorUserId: linkUser.id,
            })
          )
        )
      );
    }

    return TE.left("forbidden" as const);
  };

export const removeEventTellor =
  (user: User) =>
  (
    eventId: number,
    eventTellorId: string
  ): TE.TaskEither<Error | "forbidden", unknown> => {
    if (hasTellorsWritePermissions(user)) {
      return transactionalTaskEither((t) =>
        pipe(
          modelDeleteEventTellor(t)(eventId, eventTellorId),
          TE.chainW(() => deleteLinkUser(t)(eventTellorId))
        )
      );
    }

    return TE.left("forbidden" as const);
  };
