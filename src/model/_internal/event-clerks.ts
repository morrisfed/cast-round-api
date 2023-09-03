import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { CreateOptions, FindOptions, Transaction } from "sequelize";
import { PersistedEventClerk } from "../db/event-clerks";
import { DbEventClerk } from "../db/interfaces/db-event-clerk";

export const findPersistedEventClerks =
  (include: FindOptions["include"]) => (t: Transaction) => (eventId: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventClerk.findAll({
            where: {
              eventId,
            },
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      )
    );

export const findPersistedEventClerkByEventAndUser =
  (include: FindOptions["include"]) =>
  (t: Transaction) =>
  (eventId: number) =>
  (userId: string) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventClerk.findOne({
            where: {
              eventId,
              clerkUserId: userId,
            },
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      )
    );

export const createPersistedEventClerkWithIncludableReturn =
  (t: Transaction) =>
  (include: CreateOptions["include"]) =>
  (buildableEventClerk: DbEventClerk) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedEventClerk.create(
            {
              eventId: buildableEventClerk.eventId,
              clerkUserId: buildableEventClerk.clerkUserId,
            },
            { transaction: t }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.chain(
        TE.tryCatchK(
          (pec: PersistedEventClerk) =>
            include
              ? pec.reload({ transaction: t, include })
              : Promise.resolve(pec),
          (reason) => new Error(String(reason))
        )
      )
    );
