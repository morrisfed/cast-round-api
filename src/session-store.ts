import session from "express-session";
import connectSessionSequelize from "connect-session-sequelize";
import sequelize from "./model/db";

const SequelizeStore = connectSessionSequelize(session.Store);
const sequelizeStore = new SequelizeStore({
  db: sequelize,
});
sequelizeStore.sync();

export default sequelizeStore;
