import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import { Response } from "express";

import logger from "../../utils/logging";

export const standardJsonResponseFold = <A>(res: Response<A>) =>
  TE.fold<Error | "bad-request" | "forbidden" | "not-found", A, undefined>(
    (err) => {
      if (err === "bad-request") {
        res.sendStatus(400);
      } else if (err === "forbidden") {
        res.sendStatus(403);
      } else if (err === "not-found") {
        res.sendStatus(404);
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
