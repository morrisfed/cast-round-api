import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { Transaction } from "sequelize";
import { PersistedMotionVoteAudit } from "../db/motion-vote-audits";

export const findPersistedMotionVoteAuditsByMotionId =
  (t: Transaction) => (motionId: number) =>
    pipe(
      TE.tryCatch(
        () =>
          PersistedMotionVoteAudit.findAll({
            where: { motionId },
            transaction: t,
          }),
        (reason) => new Error(String(reason))
      )
    );
