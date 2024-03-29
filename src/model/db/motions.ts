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
import { DbMotionVote } from "./interfaces/db-motion-votes";

export class PersistedMotion
  extends Model<
    InferAttributes<PersistedMotion>,
    InferCreationAttributes<PersistedMotion>
  >
  implements DbMotion
{
  declare id: NonAttribute<number>;

  declare sequence: number;

  declare eventId: number;

  declare title: string;

  declare description: string;

  declare status: string;

  declare voteDefinition: string;

  declare votes?: DbMotionVote[];
}

const initMotionModel = (sequelize: Sequelize) =>
  PersistedMotion.init(
    {
      eventId: { type: DataTypes.INTEGER, allowNull: false },
      sequence: { type: DataTypes.INTEGER, allowNull: false },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(4000),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      voteDefinition: {
        type: DataTypes.STRING(4000),
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
