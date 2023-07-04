import express from "express";

import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { standardJsonResponseFold } from "./utils";
import {
  CreateEventTellorRequest,
  CreateEventTellorResponse,
} from "./interfaces/TellorApi";
import { createEventTellor } from "../tellors";

export const tellorsRouter = express.Router();

tellorsRouter.post<{}, CreateEventTellorResponse, CreateEventTellorRequest>(
  "/",
  async (req, res) => {
    if (req.isAuthenticated()) {
      const createEventTellorResponseTask = pipe(
        createEventTellor(req.user)(req.body),
        TE.map((eventTellor) => ({
          tellorUserId: eventTellor.tellorUserId,
          label: req.body.label,
          tellorUserLoginPath: `/api/auth/link/${eventTellor.tellorUserId}`,
          eventId: eventTellor.eventId,
        })),
        standardJsonResponseFold(res)
      );

      await createEventTellorResponseTask();
    } else {
      throw new Error();
    }
  }
);
