/* eslint max-classes-per-file: ["error", 3] */

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { Motion, MotionStatus } from "../../interfaces/motions";

export class PersistedMotion
  extends Model<
    InferAttributes<PersistedMotion>,
    InferCreationAttributes<PersistedMotion>
  >
  implements Motion
{
  declare id: NonAttribute<number>;

  declare eventId: number;

  declare title: string;

  declare description: string;

  declare status: MotionStatus;
}

const initMotionModel = (sequelize: Sequelize) =>
  PersistedMotion.init(
    {
      eventId: { type: DataTypes.INTEGER, allowNull: false },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Motion",
    }
  );

export const initMotion = (sequelize: Sequelize) => {
  initMotionModel(sequelize);
};
