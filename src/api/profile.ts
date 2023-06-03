import express from "express";
import nocache from "nocache";

import { getRoles } from "../user/permissions";
import ProfileResponse from "./interfaces/ProfileResponse";

export const profileRouter = express.Router();

profileRouter.get<{}, ProfileResponse>("/", nocache(), (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      profile: {
        id: req.user.id,
        name: req.user.account?.name || req.user.link?.label || "unknown",
        roles: getRoles(req.user),
      },
    });
  } else {
    throw new Error();
  }
});
