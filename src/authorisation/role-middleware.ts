import { RequestHandler } from "express";
import { isAdmin, isMember } from "./roles";

export const adminOnly: RequestHandler = (req, res, next) => {
  if (isAdmin(req.user)) {
    next();
  } else {
    res.sendStatus(403);
  }
};

export const memberOnly: RequestHandler = (req, res, next) => {
  if (isMember(req.user)) {
    next();
  } else {
    res.sendStatus(403);
  }
};
