/* eslint max-classes-per-file: ["error", 3] */

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

import { DbMotionVoteAudit } from "./interfaces/db-motion-vote-audit";

export class PersistedMotionVoteAudit
  extends Model<
    InferAttributes<PersistedMotionVoteAudit>,
    InferCreationAttributes<PersistedMotionVoteAudit>
  >
  implements DbMotionVoteAudit
{
  declare voteId: number;

  declare submissionId: string;

  declare motionId: number;

  declare responseCode: string;

  declare votes: number;

  declare advancedVote: boolean;

  declare accountUserId: string;

  declare accountUserName: string;

  declare accountUserContact: string;

  declare accountUserType: string;

  declare submittedByUserId: string;

  declare submittedByUserType: string;

  declare submittedByUserName: string;

  declare replacedPreviousVotes: string;

  declare submittedAt: Date;
}

const initMotionVoteAuditModel = (sequelize: Sequelize) =>
  PersistedMotionVoteAudit.init(
    {
      voteId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      submissionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      motionId: { type: DataTypes.INTEGER, allowNull: false },

      responseCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      votes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      advancedVote: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },

      accountUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountUserName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountUserContact: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountUserType: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      submittedByUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      submittedByUserType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      submittedByUserName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      replacedPreviousVotes: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "MotionVoteAudit",
    }
  );

export const initMotionVoteAudit = (sequelize: Sequelize) => {
  initMotionVoteAuditModel(sequelize);
};
