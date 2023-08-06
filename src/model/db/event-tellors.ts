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

export class PersistedEventTellor
  extends Model<
    InferAttributes<PersistedEventTellor>,
    InferCreationAttributes<PersistedEventTellor>
  >
  implements DbEventTellor
{
  declare event: NonAttribute<DbEventTellor["event"]>;

  declare tellorUser: NonAttribute<DbEventTellor["tellorUser"]>;

  declare eventId: CreationOptional<number>;

  declare tellorUserId: CreationOptional<string>;
}

const initEventTellorModel = (sequelize: Sequelize) =>
  PersistedEventTellor.init(
    {
      eventId: { type: DataTypes.INTEGER, allowNull: false },
      tellorUserId: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "EventTellor",
    }
  );

export const initEventTellor = (sequelize: Sequelize) => {
  initEventTellorModel(sequelize);
};
