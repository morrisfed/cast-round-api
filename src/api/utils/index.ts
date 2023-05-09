import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import { Response } from "express";

import logger from "../../utils/logging";

export const standardJsonResponseFold = <E, A>(res: Response) =>
  TE.fold<E, A, undefined>(
    (err: E) => {
      if (err === "forbidden") {
        res.sendStatus(403);
      } else {
        res.sendStatus(500);
        logger.error(err);
      }
      return T.of(undefined);
    },
    (results: A) => {
      res.json(results);
      return T.of(undefined);
    }
  );
