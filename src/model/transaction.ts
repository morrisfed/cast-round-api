import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Transaction } from "sequelize";
import {
  commitDbTransaction,
  createDbTransaction,
  rollbackDbTransaction,
} from "./db";

const createTransaction = () =>
  TE.tryCatch(createDbTransaction, (reason) => new Error(String(reason)));
const commitTransaction = (t: Transaction) =>
  TE.tryCatchK(
    () => commitDbTransaction(t),
    (reason) => new Error(String(reason))
  );
const rollbackTransaction = (t: Transaction) =>
  TE.tryCatchK(
    () => rollbackDbTransaction(t),
    (reason) => new Error(String(reason))
  );

const transactionalTaskEither = <E, A>(
  f: (t: Transaction) => TE.TaskEither<E, A>
) =>
  TE.bracket(
    createTransaction(),
    (t) => pipe(f(t), TE.chainFirstW(commitTransaction(t))),
    (t, either) =>
      pipe(
        either,
        TE.fromEither,
        TE.map((x) => x as void),
        TE.orElse(rollbackTransaction(t))
      )
  );

export default transactionalTaskEither;
