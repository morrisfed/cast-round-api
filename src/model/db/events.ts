/* eslint max-classes-per-file: ["error", 3] */

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { DbMotion } from "./interfaces/db-motions";
import { DbEvent } from "./interfaces/db-events";

export class PersistedEvent
  extends Model<
    InferAttributes<PersistedEvent>,
    InferCreationAttributes<PersistedEvent>
  >
  implements DbEvent
{
  declare id: NonAttribute<number>;

  declare name: string;

  declare description: string;

  declare fromDate: Date;

  declare toDate: Date;

  declare motions?: DbMotion[];
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
