import express from "express";
import nocache from "nocache";

import { getRoles } from "../user/permissions";
import ProfileResponse from "./interfaces/ProfileResponse";
import { getFrontEndFeatureFlags } from "../utils/feature-flags";

export const profileRouter = express.Router();

profileRouter.get<{}, ProfileResponse>("/", nocache(), (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      profile: {
        id: req.user.id,
        name: req.user.account?.name || req.user.link?.label || "unknown",
        roles: getRoles(req.user),
        groupDelegateInfo:
          req.user.loggedInUser.link?.type === "group-delegate"
            ? {
                delegateForGroupId:
                  req.user.loggedInUser.link.info.delegateForGroupId,
                delegateForGroupName:
                  req.user.loggedInUser.link.info.delegateForGroupName,
                delegateForEventId:
                  req.user.loggedInUser.link.info.delegateForEventId,
                delegateForRoles:
                  req.user.loggedInUser.link.info.delegateForRoles,
              }
            : undefined,
        tellorInfo:
          req.user.loggedInUser.link?.type === "tellor"
            ? {
                tellorForEventId:
                  req.user.loggedInUser.link.info.tellorForEventId,
              }
            : undefined,
        clerkInfo:
          req.user.loggedInUser.link?.type === "clerk"
            ? {
                clerkForEventId:
                  req.user.loggedInUser.link.info.clerkForEventId,
              }
            : undefined,
      },
      frontEndFeatureFlags: getFrontEndFeatureFlags(),
    });
  } else {
    throw new Error();
  }
});
