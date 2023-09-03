import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";
import { PersistedMotion } from "./db/motions";
import {
  findPersistedMotion,
  findPersistedMotionsByEventId,
  savePersistedMotion,
} from "./_internal/motion";
import {
  ModelBuildableMotion,
  ModelMotion,
  ModelMotionUpdates,
} from "./interfaces/model-motions";
import { decodePersistedIOE } from "./_internal/utils";

const dbMotionAsModelMotion = (dbMotion: PersistedMotion) =>
  decodePersistedIOE<PersistedMotion, ModelMotion, Error>(ModelMotion)(
    () => new Error("Invalid motion read from database")
  )(dbMotion);

const dbMotionArrayAsModelMotionArray = (
  dbMotions: PersistedMotion[]
): IOE.IOEither<Error, ModelMotion[]> =>
  A.traverse(IOE.ApplicativePar)(dbMotionAsModelMotion)(dbMotions);

export const findAllEventMotions =
  (t: Transaction) =>
  (eventId: number): TE.TaskEither<Error, ModelMotion[]> =>
    pipe(
      findPersistedMotionsByEventId([])(t)(eventId),
      TE.chainIOEitherKW(dbMotionArrayAsModelMotionArray)
    );

export const findMotionById =
  (t: Transaction) =>
  (id: number): TE.TaskEither<Error | "not-found", ModelMotion> =>
    pipe(
      findPersistedMotion([])(t)(id),
      TE.chainIOEitherKW(dbMotionAsModelMotion)
    );

export const createEventMotion =
  (t: Transaction) =>
  (buildableMotion: ModelBuildableMotion): TE.TaskEither<Error, ModelMotion> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotion.create(ModelBuildableMotion.encode(buildableMotion), {
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      ),
      TE.chainIOEitherKW(dbMotionAsModelMotion)
    );

const applyUpdatesToMotion =
  (updates: ModelMotionUpdates) =>
  (motion: PersistedMotion): PersistedMotion =>
    motion.set(ModelMotionUpdates.encode(updates));

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
      TE.chainW(savePersistedMotion(t)),
      TE.chainIOEitherKW(dbMotionAsModelMotion)
    );
