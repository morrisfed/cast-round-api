import { Sequelize, Transaction } from "sequelize";
import env from "../../utils/env";
import {
  PersistedAccountUserDetails,
  PersistedLinkUserDetails,
  PersistedUser,
  initUser,
} from "./users";
import { PersistedEvent, initEvent } from "./events";
import { PersistedMotion, initMotion } from "./motions";
import {
  PersistedEventGroupDelegate,
  initEventGroupDelegate,
} from "./event-group-delegates";
import { PersistedEventTellor, initEventTellor } from "./event-tellors";
import { PersistedMotionVote, initMotionVote } from "./motion-votes";
import { PersistedEventClerk, initEventClerk } from "./event-clerks";

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
  initMotion(sequelize);
  initMotionVote(sequelize);
  initEventGroupDelegate(sequelize);
  initEventTellor(sequelize);
  initEventClerk(sequelize);

  PersistedEvent.belongsToMany(PersistedUser, {
    through: "UserEvent",
    as: "assignedUsers",
  });
  PersistedUser.belongsToMany(PersistedEvent, {
    through: "UserEvent",
    as: "assignedEvents",
  });

  PersistedEvent.hasMany(PersistedMotion, {
    as: "motions",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });
  PersistedMotion.belongsTo(PersistedEvent, {
    as: "event",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });

  PersistedEvent.hasMany(PersistedEventGroupDelegate, {
    as: "groupDelegates",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });
  PersistedEventGroupDelegate.belongsTo(PersistedEvent, {
    as: "event",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });

  PersistedEvent.hasMany(PersistedEventTellor, {
    as: "tellors",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });
  PersistedEventTellor.belongsTo(PersistedEvent, {
    as: "event",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });

  PersistedEvent.hasMany(PersistedEventClerk, {
    as: "clerks",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });
  PersistedEventClerk.belongsTo(PersistedEvent, {
    as: "event",
    foreignKey: { allowNull: false, field: "eventId", name: "eventId" },
  });

  PersistedLinkUserDetails.hasMany(PersistedEventGroupDelegate, {
    as: "groupDelegateEvents",
    foreignKey: {
      allowNull: false,
      field: "delegateUserId",
      name: "delegateUserId",
    },
    sourceKey: "id",
  });
  PersistedEventGroupDelegate.belongsTo(PersistedLinkUserDetails, {
    as: "delegateUser",
    foreignKey: {
      allowNull: false,
      field: "delegateUserId",
      name: "delegateUserId",
    },
    targetKey: "id",
  });

  PersistedLinkUserDetails.hasMany(PersistedEventTellor, {
    as: "tellorEvents",
    foreignKey: {
      allowNull: false,
      field: "tellorUserId",
      name: "tellorUserId",
    },
    sourceKey: "id",
  });
  PersistedEventTellor.belongsTo(PersistedLinkUserDetails, {
    as: "tellorUser",
    foreignKey: {
      allowNull: false,
      field: "tellorUserId",
      name: "tellorUserId",
    },
    targetKey: "id",
  });

  PersistedLinkUserDetails.hasMany(PersistedEventClerk, {
    as: "clerkEvents",
    foreignKey: {
      allowNull: false,
      field: "clerkUserId",
      name: "clerkUserId",
    },
    sourceKey: "id",
  });
  PersistedEventClerk.belongsTo(PersistedLinkUserDetails, {
    as: "clerkUser",
    foreignKey: {
      allowNull: false,
      field: "clerkUserId",
      name: "clerkUserId",
    },
    targetKey: "id",
  });

  PersistedAccountUserDetails.hasMany(PersistedEventGroupDelegate, {
    as: "eventDelegates",
    foreignKey: {
      allowNull: false,
      field: "delegateForUserId",
      name: "delegateForUserId",
    },
    sourceKey: "id",
  });
  PersistedEventGroupDelegate.belongsTo(PersistedAccountUserDetails, {
    as: "delegateFor",
    foreignKey: {
      allowNull: false,
      field: "delegateForUserId",
      name: "delegateForUserId",
    },
    targetKey: "id",
  });

  PersistedMotion.hasMany(PersistedMotionVote, {
    as: "votes",
    foreignKey: { allowNull: false, field: "motionId", name: "motionId" },
    sourceKey: "id",
  });
  PersistedMotionVote.belongsTo(PersistedMotion, {
    as: "motion",
    foreignKey: { allowNull: false, field: "motionId", name: "motionId" },
    targetKey: "id",
  });

  await sequelize.sync({ alter: true });
};

export const createDbTransaction = () => sequelize.transaction();
export const commitDbTransaction = (t: Transaction) => t.commit();
export const rollbackDbTransaction = (t: Transaction) => t.rollback();
export default sequelize;
