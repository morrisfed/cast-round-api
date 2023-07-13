import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import { findPersistedEvent } from "./_internal/event";
import { BuildableMotion, Motion, MotionUpdates } from "../interfaces/motions";
import { PersistedMotion } from "./db/motions";
import { findPersistedMotion, savePersistedMotion } from "./_internal/motion";

export const findAllEventMotions =
  (t: Transaction) =>
  (eventId: number): TE.TaskEither<Error | "not-found", Motion[]> =>
    pipe(
      findPersistedEvent(["motions"])(t)(eventId),
      TE.map((event) => event.motions || [])
    );

export const findMotionById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", Motion> =>
    findPersistedMotion([])(t)(id);

export const createEventMotion =
  (t: Transaction) =>
  (buildableMotion: BuildableMotion): TE.TaskEither<Error, Motion> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotion.create(
            {
              eventId: buildableMotion.eventId,
              description: buildableMotion.description,
              title: buildableMotion.title,
              status: buildableMotion.status,
            },
            {
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      )
    );

const applyUpdatesToMotion =
  (updates: MotionUpdates) =>
  (motion: PersistedMotion): PersistedMotion =>
    motion.set(updates);

export const updateEventMotion =
  (t: Transaction) =>
  (eventId: number, motionId: number) =>
  (updates: MotionUpdates): TE.TaskEither<Error | "not-found", Motion> =>
    pipe(
      findPersistedMotion([])(t)(motionId),
      TE.chainW(
        TE.fromPredicate(
          (motion) => motion.eventId === eventId,
          () => new Error("not-found")
        )
      ),
      TE.map(applyUpdatesToMotion(updates)),
      TE.chainW(savePersistedMotion(t))
    );
