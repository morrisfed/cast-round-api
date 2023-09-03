/* eslint max-classes-per-file: ["error", 3] */

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { DbEventTellor } from "./interfaces/db-event-tellors";
import { DbEventClerk } from "./interfaces/db-event-clerk";

export class PersistedEventClerk
  extends Model<
    InferAttributes<PersistedEventClerk>,
    InferCreationAttributes<PersistedEventClerk>
  >
  implements DbEventClerk
{
  declare event: NonAttribute<DbEventTellor["event"]>;

  declare clerkUser: NonAttribute<DbEventTellor["tellorUser"]>;

  declare eventId: CreationOptional<number>;

  declare clerkUserId: CreationOptional<string>;
}

const initEventClerkModel = (sequelize: Sequelize) =>
  PersistedEventClerk.init(
    {
      eventId: { type: DataTypes.INTEGER, allowNull: false },
      clerkUserId: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "EventClerk",
    }
  );

export const initEventClerk = (sequelize: Sequelize) => {
  initEventClerkModel(sequelize);
};
