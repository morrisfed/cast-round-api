import { Sequelize, Transaction } from "sequelize";
import env from "../../utils/env";
import { init as initUserInfo } from "./UserInfo";

const sequelize = new Sequelize(
  env.MYSQL_DATABASE,
  env.MYSQL_USER,
  env.MYSQL_PASSWORD,
  {
    dialect: "mysql",
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    logging: false,
  }
);

initUserInfo(sequelize);

export const createDbTransaction = () => sequelize.transaction();
export const commitDbTransaction = (t: Transaction) => t.commit();
export const rollbackDbTransaction = (t: Transaction) => t.rollback();
export default sequelize;
