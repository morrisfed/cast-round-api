import express from "express";
import nocache from "nocache";

import { getPermissions } from "../user/permissions";
import ProfileResponse from "./interfaces/ProfileResponse";

export const profileRouter = express.Router();

profileRouter.get<{}, ProfileResponse>("/", nocache(), (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      profile: {
        id: req.user.id,
        name: req.user.account?.name || req.user.delegate?.label || "unknown",
        type: req.user.account?.type || req.user.delegate?.type || "friend",
        permissions: getPermissions(req.user),
      },
    });
  } else {
    throw new Error();
  }
});
