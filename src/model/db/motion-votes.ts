/* eslint max-classes-per-file: ["error", 3] */

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

import { DbMotionVote } from "./interfaces/db-motion-votes";

export class PersistedMotionVote
  extends Model<
    InferAttributes<PersistedMotionVote>,
    InferCreationAttributes<PersistedMotionVote>
  >
  implements DbMotionVote
{
  declare id: CreationOptional<number>;

  declare motionId: number;

  declare onBehalfOfUserId: string;

  declare submittedByUserId: string;

  declare responseCode: string;

  declare votes: number;

  declare proxy: boolean;
}

const initMotionVoteModel = (sequelize: Sequelize) =>
  PersistedMotionVote.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      motionId: { type: DataTypes.INTEGER, allowNull: false },
      onBehalfOfUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      submittedByUserId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      responseCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      votes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      proxy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "MotionVote",
    }
  );

export const initMotionVote = (sequelize: Sequelize) => {
  initMotionVoteModel(sequelize);
};
