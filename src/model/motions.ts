import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import { findPersistedEvent } from "./_internal/event";
import { PersistedMotion } from "./db/motions";
import { findPersistedMotion, savePersistedMotion } from "./_internal/motion";
import {
  ModelBuildableMotion,
  ModelMotion,
  ModelMotionUpdates,
} from "./interfaces/model-motions";

export const findAllEventMotions =
  (t: Transaction) =>
  (eventId: number): TE.TaskEither<Error | "not-found", ModelMotion[]> =>
    pipe(
      findPersistedEvent(["motions"])(t)(eventId),
      TE.map((event) => event.motions || [])
    );

export const findMotionById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", ModelMotion> =>
    findPersistedMotion([])(t)(id);

export const createEventMotion =
  (t: Transaction) =>
  (buildableMotion: ModelBuildableMotion): TE.TaskEither<Error, ModelMotion> =>
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
  (updates: ModelMotionUpdates) =>
  (motion: PersistedMotion): PersistedMotion =>
    motion.set(updates);

export const updateEventMotion =
  (t: Transaction) =>
  (eventId: number, motionId: number) =>
  (
    updates: ModelMotionUpdates
  ): TE.TaskEither<Error | "not-found", ModelMotion> =>
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
