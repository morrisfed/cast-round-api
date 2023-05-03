import express from "express";

import ProfileResponse from "../interfaces/ProfileResponse";

import adminRouter from "./admin";

const router = express.Router();

router.get<{}, ProfileResponse>("/profile", (req, res) => {
  if (req.user) {
    res.json({
      profile: { id: req.user.id, name: req.user.name, type: req.user.type },
    });
  } else {
    res.sendStatus(401);
  }
});

router.use("/admin", adminRouter);

export default router;
