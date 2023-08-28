import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";

import { Transaction } from "sequelize";
import { findPersistedMotion } from "./_internal/motion";
import { decodePersistedIOE } from "./_internal/utils";
import { DbMotionVote } from "./db/interfaces/db-motion-votes";
import {
  ModelBuildableMotionVote,
  ModelMotionVote,
} from "./interfaces/model-motion-votes";
import { PersistedMotionVote } from "./db/motion-votes";

const dbMotionVoteAsModelMotionVote = (dbMotionVote: DbMotionVote) =>
  decodePersistedIOE<DbMotionVote, ModelMotionVote, Error>(ModelMotionVote)(
    () => new Error("Invalid motion read from database")
  )(dbMotionVote);

const dbMotionVoteArrayAsModelMotionVoteArray = (
  dbMotionVotes: DbMotionVote[]
): IOE.IOEither<Error, ModelMotionVote[]> =>
  A.traverse(IOE.ApplicativePar)(dbMotionVoteAsModelMotionVote)(dbMotionVotes);

export const findAllMotionVotes =
  (t: Transaction) =>
  (motionId: number): TE.TaskEither<Error | "not-found", ModelMotionVote[]> =>
    pipe(
      findPersistedMotion(["votes"])(t)(motionId),
      TE.map((motion) => motion.votes || []),
      TE.chainIOEitherKW(dbMotionVoteArrayAsModelMotionVoteArray)
    );

export const findAllMotionsVotesForOnBehalfUser =
  (t: Transaction) =>
  (onBehalfOfUserId: string) =>
  (
    motionId: number
  ): TE.TaskEither<Error | "not-found", readonly ModelMotionVote[]> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotionVote.findAll({
            where: { motionId, onBehalfOfUserId },
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      ),

      TE.chainIOEitherKW(dbMotionVoteArrayAsModelMotionVoteArray)
    );

export const createMotionVote =
  (t: Transaction) =>
  (
    buildableMotionVote: ModelBuildableMotionVote
  ): TE.TaskEither<Error, ModelMotionVote> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotionVote.create(
            ModelBuildableMotionVote.encode(buildableMotionVote),
            {
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.chainIOEitherKW(dbMotionVoteAsModelMotionVote)
    );

export const deleteMotionVote = (t: Transaction) => (id: number) =>
  TE.tryCatch(
    () => PersistedMotionVote.destroy({ where: { id }, transaction: t }),
    (reason) => new Error(String(reason))
  );

export const deleteMotionVotesForOnBehalfUser =
  (t: Transaction) => (onBehalfOfUserId: string) => (motionId: number) =>
    TE.tryCatch(
      () =>
        PersistedMotionVote.destroy({
          where: { motionId, onBehalfOfUserId },
          transaction: t,
        }),
      (reason) => new Error(String(reason))
    );
