/* eslint max-classes-per-file: ["error", 3] */

import {
  CreationOptional,
  DataTypes,
  HasManyCreateAssociationMixin,
  HasOneCreateAssociationMixin,
  HasOneSetAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";

import {
  DbAccountUserDetails,
  DbLinkUserDetailsExpanded,
  DbLinkUserDetails,
  DbUser,
} from "./interfaces/db-users";

export class PersistedUser
  extends Model<
    InferAttributes<PersistedUser>,
    InferCreationAttributes<PersistedUser>
  >
  implements DbUser
{
  declare id: string;

  declare enabled: boolean;

  declare source: string;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare account?: InferAttributes<PersistedAccountUserDetails>;

  declare link?: DbLinkUserDetails;

  declare createAccount: HasOneCreateAssociationMixin<PersistedAccountUserDetails>;

  declare createLink: HasOneCreateAssociationMixin<PersistedLinkUserDetails>;
}

export class PersistedAccountUserDetails
  extends Model<
    InferAttributes<PersistedAccountUserDetails>,
    InferCreationAttributes<PersistedAccountUserDetails>
  >
  implements DbAccountUserDetails
{
  declare id: string;

  declare name: string;

  declare contactName: string | null;

  declare type: string;

  declare isAdmin: boolean;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare links: NonAttribute<PersistedLinkUserDetails[]>;

  declare createLink: HasManyCreateAssociationMixin<PersistedLinkUserDetails>;
}

export class PersistedLinkUserDetails
  extends Model<
    InferAttributes<PersistedLinkUserDetails>,
    InferCreationAttributes<PersistedLinkUserDetails>
  >
  implements DbLinkUserDetailsExpanded
{
  declare id: string;

  declare label: string;

  declare type: string;

  declare linkForUserId: CreationOptional<string>;

  declare createdByUserId: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare createdBy: NonAttribute<PersistedUser>;

  declare linkFor: NonAttribute<PersistedAccountUserDetails>;

  declare setLinkFor: HasOneSetAssociationMixin<
    PersistedAccountUserDetails,
    string
  >;
}

export const initLinkUser = (sequelize: Sequelize) =>
  PersistedLinkUserDetails.init(
    {
      id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      linkForUserId: { type: DataTypes.STRING, allowNull: true },
      createdByUserId: { type: DataTypes.STRING, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "LinkUserDetails",
    }
  );

export const initAccountUser = (sequelize: Sequelize) =>
  PersistedAccountUserDetails.init(
    {
      id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactName: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "AccountUserDetails",
    }
  );

const initCommonUser = (sequelize: Sequelize) =>
  PersistedUser.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "User",
    }
  );

export const initUser = (sequelize: Sequelize) => {
  initCommonUser(sequelize);
  initAccountUser(sequelize);
  initLinkUser(sequelize);

  PersistedUser.hasOne(PersistedAccountUserDetails, {
    as: "account",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });
  PersistedAccountUserDetails.belongsTo(PersistedUser, {
    as: "user",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });

  PersistedUser.hasOne(PersistedLinkUserDetails, {
    as: "link",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });
  PersistedLinkUserDetails.belongsTo(PersistedUser, {
    as: "user",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });

  PersistedUser.hasMany(PersistedLinkUserDetails, {
    as: "createdLinks",
    foreignKey: {
      allowNull: false,
      field: "createdByUserId",
      name: "createdByUserId",
    },
  });
  PersistedLinkUserDetails.belongsTo(PersistedUser, {
    as: "createdBy",
    foreignKey: {
      allowNull: false,
      field: "createdByUserId",
      name: "createdByUserId",
    },
  });

  PersistedAccountUserDetails.hasMany(PersistedLinkUserDetails, {
    as: "links",
    sourceKey: "id",
    foreignKey: {
      allowNull: true,
      field: "linkForUserId",
      name: "linkForUserId",
    },
  });
  PersistedLinkUserDetails.belongsTo(PersistedAccountUserDetails, {
    as: "linkFor",
    targetKey: "id",
    foreignKey: {
      allowNull: true,
      field: "linkForUserId",
      name: "linkForUserId",
    },
  });
};
