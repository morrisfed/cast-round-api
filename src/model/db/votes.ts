/* eslint max-classes-per-file: ["error", 3] */

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import { Vote, VoteStatus } from "../../interfaces/votes";

export class PersistedVote
  extends Model<
    InferAttributes<PersistedVote>,
    InferCreationAttributes<PersistedVote>
  >
  implements Vote
{
  declare title: string;

  declare description: string;

  declare status: VoteStatus;
}

const initVoteModel = (sequelize: Sequelize) =>
  PersistedVote.init(
    {
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
      modelName: "Vote",
    }
  );

export const initVote = (sequelize: Sequelize) => {
  initVoteModel(sequelize);
};
