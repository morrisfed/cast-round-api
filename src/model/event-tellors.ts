import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/Array";
import { Refinement } from "fp-ts/lib/Refinement";

import { Transaction } from "sequelize";

import { PersistedEventTellor } from "./db/event-tellors";
import { findPersistedEventTellors } from "./_internal/event-tellors";
import {
  BuildableEventTellor,
  EventTellor,
  EventTellorNoExpansion,
} from "../interfaces/tellors";
import { PersistedEvent } from "./db/events";
import { PersistedLinkUser } from "./db/users";

interface PersistedEventTellorWithEventAndUser extends PersistedEventTellor {
  event: PersistedEvent;
  tellorUser: PersistedLinkUser;
}

const isPersistedEventTellorWithEventAndUser: Refinement<
  PersistedEventTellor,
  PersistedEventTellorWithEventAndUser
> = (pet): pet is PersistedEventTellorWithEventAndUser =>
  pet.event !== undefined && pet.tellorUser !== undefined;

export const findEventTellorsByEvent =
  (t: Transaction) =>
  (eventId: number): TE.TaskEither<Error, EventTellor[]> =>
    pipe(
      findPersistedEventTellors(["tellorUser", "event"])(t)(eventId),
      TE.map(A.filter(isPersistedEventTellorWithEventAndUser)),
      TE.map(
        A.map((persistedEventTellor) => ({
          eventId: persistedEventTellor.eventId,
          tellorUserId: persistedEventTellor.tellorUserId,
          tellorUser: persistedEventTellor.tellorUser,
          event: persistedEventTellor.event,
        }))
      )
    );

const createPersistedEventTellor =
  (t: Transaction) => (buildableEventTellor: BuildableEventTellor) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventTellor.create(
            {
              eventId: buildableEventTellor.eventId,
              tellorUserId: buildableEventTellor.tellorUserId,
            },
            { transaction: t, include: ["event", "tellorUser"] }
          ),
        (reason) => new Error(String(reason))
      )
    );

export const createEventTellor =
  (t: Transaction) =>
  (
    buildableEventTellor: BuildableEventTellor
  ): TE.TaskEither<Error, EventTellorNoExpansion> =>
    pipe(
      createPersistedEventTellor(t)(buildableEventTellor),
      TE.map((persistedEventTellor) => ({
        eventId: persistedEventTellor.eventId,
        tellorUserId: persistedEventTellor.tellorUserId,
      }))
    );
