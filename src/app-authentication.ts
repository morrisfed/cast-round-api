import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import express from "express";
import passport from "passport";
import OAuth2Strategy, {
  VerifyFunction as Oauth2VerifyFunction,
  VerifyCallback as Oauth2VerifyCallback,
} from "passport-oauth2";
import UniqueTokenStrategy from "passport-unique-token";
import { VerifyFunction as UniqueTokenVerifyFunction } from "passport-unique-token/dist/strategy";

import env from "./utils/env";
import getMwUser from "./membership-works";
import { MembershipWorksUser } from "./interfaces/User";

const mwUserToUser = (mwUser: MembershipWorksUser): Express.User => ({
  id: mwUser.account_id,
  name: `${mwUser.name} (${mwUser.contact_name})`,
  type: mwUser.type,
  authVia: "membership-works",
});

const mwVerifyFunction: Oauth2VerifyFunction = async (
  accessToken: string,
  _refreshToken: string,
  _profile: any,
  verified: Oauth2VerifyCallback
) => {
  const getUserTask = pipe(
    getMwUser(accessToken),
    TE.map(mwUserToUser),
    TE.fold(
      (e) => T.of(verified(e)),
      (user) => T.of(verified(null, user))
    )
  );

  getUserTask();
};

const delegateVerifyFunction: UniqueTokenVerifyFunction = async (
  token,
  done
) => {
  const user = {
    id: token,
    name: "Delegate 1",
    membership: "Group Delegate",
    authVia: "Delegate",
  };

  done(null, user);
};

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "/loginmw/",
      tokenURL: "https://api.membershipworks.com/v2/oauth2/token",
      clientID: env.MW_OAUTH2_CLIENT_ID,
      clientSecret: env.MW_OAUTH2_CLIENT_SECRET,
      callbackURL: env.MW_OAUTH2_CALLBACK_URL,
    },
    mwVerifyFunction
  )
);

passport.use(
  new UniqueTokenStrategy(
    {
      tokenQuery: "delegate",
    },
    delegateVerifyFunction
  )
);

passport.serializeUser((user, cb) => {
  process.nextTick(() =>
    cb(null, {
      id: user.id,
      name: user.name,
      type: user.type,
      authVia: user.authVia,
    })
  );
});

passport.deserializeUser((user: Express.User, cb) => {
  process.nextTick(() => cb(null, user));
});

const authRoute = express.Router();
authRoute.get("/api/auth/mw", passport.authenticate("oauth2"));
authRoute.get(
  "/api/auth/mw/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  (_req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);
authRoute.get("/api/auth/delegate", passport.authenticate("token"));

export const isAuthByMw = (req: express.Request) =>
  req.user?.authVia === "membership-works";

authRoute.post("/api/auth/logout", (req, res, next) => {
  const isMwAuth = isAuthByMw(req);
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    if (isMwAuth) {
      return res.redirect("/logoutmw/");
    }
    return res.redirect("/");
  });
});

export default [passport.session(), authRoute];
