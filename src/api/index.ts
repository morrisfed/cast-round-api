import express from "express";

import ProfileResponse from "../interfaces/ProfileResponse";

import adminRouter from "./admin";
import { getPermissions } from "../user/permissions";

const router = express.Router();

router.get<{}, ProfileResponse>("/profile", (req, res) => {
  if (req.user) {
    res.json({
      profile: {
        id: req.user.id,
        name: req.user.name,
        type: req.user.type,
        permissions: getPermissions(req.user),
      },
    });
  } else {
    res.sendStatus(401);
  }
});

router.use("/admin", adminRouter);

export default router;
