import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import OAuth2Strategy, {
  VerifyFunction as Oauth2VerifyFunction,
  VerifyCallback as Oauth2VerifyCallback,
} from "passport-oauth2";
import UniqueTokenStrategy from "passport-unique-token";
import { VerifyFunction as UniqueTokenVerifyFunction } from "passport-unique-token/dist/strategy";
import nocache from "nocache";

import { URLSearchParams } from "url";

import env from "../utils/env";
import { fetchUserInfoForMwAccessToken } from "../membership-works/mwUserInfo";
import { importUsers } from "../user/importUsers";
import { User as AppUser } from "../interfaces/UserInfo";
import {
  isMwProfileParseError,
  isMwUnrecognisedMembershipType,
} from "../membership-works/fetchMwUserProfile";
import { getUser } from "../user/userInfo";

declare global {
  namespace Express {
    interface User extends AppUser {
      authVia: "membership-works" | "delegate";
    }
  }
}

type SessionUser = { id: string; authVia: Express.User["authVia"] };

const userInfoToExpressUser =
  (authVia: Express.User["authVia"]) =>
  (userInfo: AppUser): Express.User => ({
    ...userInfo,
    authVia,
  });

const mwVerifyFunction: Oauth2VerifyFunction = async (
  accessToken: string,
  _refreshToken: string,
  _profile: any,
  verified: Oauth2VerifyCallback
) => {
  const getUserTask = pipe(
    fetchUserInfoForMwAccessToken(accessToken),
    TE.chainFirstW((userInfo) => importUsers([userInfo])),
    TE.map(userInfoToExpressUser("membership-works")),
    TE.mapLeft((e) =>
      isMwProfileParseError(e)
        ? new Error("mw-profile-parse-error", { cause: e })
        : e
    ),
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

passport.serializeUser<SessionUser>((user, done) =>
  done(null, { id: user.id, authVia: user.authVia })
);

passport.deserializeUser<SessionUser>(({ id, authVia }, done) => {
  const deserializeUserTask = pipe(
    getUser(id),
    TE.map(userInfoToExpressUser(authVia)),
    TE.fold(
      (err) => T.of(done(err)),
      (results) => T.of(done(null, results))
    )
  );

  deserializeUserTask();
});

const authRoute = express.Router();
authRoute.use(nocache());
authRoute.get("/api/auth/mw", passport.authenticate("oauth2"));
authRoute.get(
  "/api/auth/mw/callback",
  passport.authenticate("oauth2"),
  (_req: Request, res: Response) => {
    res.redirect("/");
  },
  (err: any, req: Request, res: Response, next: NextFunction) => {
    const cause = err?.cause;
    if (isMwProfileParseError(cause)) {
      const parseErrorCause = cause.cause;
      if (isMwUnrecognisedMembershipType(parseErrorCause)) {
        const msg = `Unrecognised membership type ID ${parseErrorCause.deckId} for member ${cause.name} with account ID ${cause.accountId}.`;
        const searchParams = new URLSearchParams();
        searchParams.append("error", "login-failed");
        searchParams.append("errorMessage", msg);
        res.redirect(`/?${searchParams.toString()}`);
      } else {
        res.redirect("/?error=login-failed");
      }
    } else {
      next(err);
    }
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

export const authenticationRequestHandlers = [
  passport.session({ pauseStream: true }),
  authRoute,
];
