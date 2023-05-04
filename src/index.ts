import app from "./app";
import User from "./model/db/UserInfo";
import logger from "./utils/logging";

const main = async () => {
  logger.info("Initialising database. Creating/altering tables...");
  await User.sync({ alter: true });

  logger.info("Starting app server...");
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    logger.info("App server listening for connections.");
  });
};

main();
