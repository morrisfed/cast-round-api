/* eslint max-classes-per-file: ["error", 3] */

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { Event } from "../../interfaces/events";
import { Vote } from "../../interfaces/votes";

export class PersistedEvent
  extends Model<
    InferAttributes<PersistedEvent>,
    InferCreationAttributes<PersistedEvent>
  >
  implements Event
{
  declare id: NonAttribute<number>;

  declare name: string;

  declare description: string;

  declare fromDate: Date;

  declare toDate: Date;

  declare votes?: Vote[];
}

const initEventModel = (sequelize: Sequelize) =>
  PersistedEvent.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fromDate: DataTypes.DATE,
      toDate: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Event",
    }
  );

export const initEvent = (sequelize: Sequelize) => {
  initEventModel(sequelize);
};
