import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { FindOptions, Transaction } from "sequelize";
import { PersistedMotion } from "../db/motions";

export const findPersistedMotionsByEventId =
  (include: FindOptions["include"]) => (t: Transaction) => (eventId: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotion.findAll({
            where: { eventId },
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      )
    );

export const findPersistedMotion =
  (include: FindOptions["include"]) => (t: Transaction) => (id: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotion.findByPk(id, {
            transaction: t,
            include,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainW(TE.fromNullable("not-found" as const))
    );

export const savePersistedMotion =
  <T extends PersistedMotion>(t: Transaction) =>
  (motion: T) =>
    TE.tryCatch(
      () => motion.save({ transaction: t }),
      (reason) => new Error(String(reason))
    );
