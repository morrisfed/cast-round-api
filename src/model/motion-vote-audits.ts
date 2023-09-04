import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as IOE from "fp-ts/lib/IOEither";
import * as A from "fp-ts/lib/Array";
import * as ROA from "fp-ts/lib/ReadonlyArray";

import { Op, Transaction } from "sequelize";
import { decodePersistedIOE } from "./_internal/utils";
import { ModelMotionVoteAudit } from "./interfaces/model-motion-vote-audits";
import { findPersistedMotionVoteAuditsByMotionId } from "./_internal/motion-vote-audit";
import { PersistedMotionVoteAudit } from "./db/motion-vote-audits";

const dbMotionVoteAuditAsModelMotionVoteAudit = (
  dbMotionVoteAudit: PersistedMotionVoteAudit
) =>
  decodePersistedIOE<PersistedMotionVoteAudit, ModelMotionVoteAudit, Error>(
    ModelMotionVoteAudit
  )(() => new Error("Invalid motion vote audit read from database"))(
    dbMotionVoteAudit
  );

const dbMotionVoteAuditArrayAsModelMotionVoteAuditArray = (
  dbMotionVoteAudits: PersistedMotionVoteAudit[]
): IOE.IOEither<Error, ModelMotionVoteAudit[]> =>
  A.traverse(IOE.ApplicativePar)(dbMotionVoteAuditAsModelMotionVoteAudit)(
    dbMotionVoteAudits
  );

export const findAllMotionVoteAudits =
  (t: Transaction) =>
  (motionId: number): TE.TaskEither<Error, ModelMotionVoteAudit[]> =>
    pipe(
      findPersistedMotionVoteAuditsByMotionId(t)(motionId),
      TE.chainIOEitherKW(dbMotionVoteAuditArrayAsModelMotionVoteAuditArray)
    );

export const createMotionVoteAudit =
  (t: Transaction) =>
  (
    buildableMotionVoteAudit: ModelMotionVoteAudit
  ): TE.TaskEither<Error, ModelMotionVoteAudit> =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotionVoteAudit.create(
            ModelMotionVoteAudit.encode(buildableMotionVoteAudit),
            {
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.chainIOEitherKW(dbMotionVoteAuditAsModelMotionVoteAudit)
    );

export const createMotionVoteAudits =
  (t: Transaction) =>
  (
    buildableMotionVoteAudits: readonly ModelMotionVoteAudit[]
  ): TE.TaskEither<Error, readonly ModelMotionVoteAudit[]> =>
    ROA.traverse(TE.ApplicativePar)(createMotionVoteAudit(t))(
      buildableMotionVoteAudits
    );

export const supersedeMotionVoteAudits =
  (t: Transaction) => (voteIds: number[]) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotionVoteAudit.update(
            { superseded: true },
            {
              where: {
                voteId: {
                  [Op.in]: voteIds,
                },
              },
              transaction: t,
            }
          ),
        (reason) => new Error(String(reason))
      ),
      TE.map(([affectedRowsCount]) => affectedRowsCount)
    );
