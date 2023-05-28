import { cleanEnv, port, str, url } from "envalid";
import { config } from "dotenv";

config();

const validateEnv = () =>
  cleanEnv(process.env, {
    NODE_ENV: str(),
    MYSQL_HOST: str(),
    MYSQL_PORT: port(),
    MYSQL_DATABASE: str(),
    MYSQL_USER: str(),
    MYSQL_PASSWORD: str(),

    MW_OAUTH2_CLIENT_ID: str(),
    MW_OAUTH2_CLIENT_SECRET: str(),
    MW_OAUTH2_CALLBACK_URL: url(),

    SESSION_SECRET: str(),

    ADMIN_MW_LABEL_ID: str(),
  });

export default validateEnv();
