import { RequestHandler } from "express";
import { isAdministratorRole, isMemberRole } from "../user/permissions";

export const adminOnly: RequestHandler = (req, res, next) => {
  if (isAdministratorRole(req.user)) {
    next();
  } else {
    res.sendStatus(403);
  }
};

export const memberOnly: RequestHandler = (req, res, next) => {
  if (isMemberRole(req.user)) {
    next();
  } else {
    res.sendStatus(403);
  }
};
