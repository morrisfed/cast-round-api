import { Sequelize, Transaction } from "sequelize";
import env from "../../utils/env";
import { PersistedUser, initUser } from "./users";
import { PersistedEvent, initEvent } from "./events";
import { PersistedVote, initVote } from "./votes";

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

export const initDb = async () => {
  initUser(sequelize);
  initEvent(sequelize);
  initVote(sequelize);

  PersistedEvent.belongsToMany(PersistedUser, {
    through: "UserEvent",
    as: "assignedUsers",
  });
  PersistedUser.belongsToMany(PersistedEvent, {
    through: "UserEvent",
    as: "assignedEvents",
  });

  PersistedEvent.hasMany(PersistedVote, {
    as: "votes",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });
  PersistedVote.belongsTo(PersistedEvent, {
    as: "event",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });

  await sequelize.sync({ alter: true });
};

export const createDbTransaction = () => sequelize.transaction();
export const commitDbTransaction = (t: Transaction) => t.commit();
export const rollbackDbTransaction = (t: Transaction) => t.rollback();
export default sequelize;
