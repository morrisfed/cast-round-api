import app from "./app";
import {
  PersistedAccount,
  PersistedUser,
  PersistedDelegate,
} from "./model/db/users";
import logger from "./utils/logging";

const main = async () => {
  logger.info("Initialising database. Creating/altering tables...");
  await PersistedUser.sync({ alter: true });
  await PersistedAccount.sync({ alter: true });
  await PersistedDelegate.sync({ alter: true });

  logger.info("Starting app server...");
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    logger.info("App server listening for connections.");
  });
};

main();
