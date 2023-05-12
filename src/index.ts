import app from "./app";
import { initDb } from "./model/db";
import logger from "./utils/logging";

const main = async () => {
  logger.info("Initialising database. Creating/altering tables...");
  await initDb();

  logger.info("Starting app server...");
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    logger.info("App server listening for connections.");
  });
};

main();
