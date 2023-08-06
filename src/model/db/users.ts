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
  DbLinkUserDetails,
  DbLinkUserDetailsNoExpansion,
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

  declare account?: InferAttributes<PersistedAccountUser>;

  declare link?: DbLinkUserDetailsNoExpansion;

  declare createAccount: HasOneCreateAssociationMixin<PersistedAccountUser>;

  declare createLink: HasOneCreateAssociationMixin<PersistedLinkUser>;
}

export class PersistedAccountUser
  extends Model<
    InferAttributes<PersistedAccountUser>,
    InferCreationAttributes<PersistedAccountUser>
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

  declare links: NonAttribute<PersistedLinkUser[]>;

  declare createLink: HasManyCreateAssociationMixin<PersistedLinkUser>;
}

export class PersistedLinkUser
  extends Model<
    InferAttributes<PersistedLinkUser>,
    InferCreationAttributes<PersistedLinkUser>
  >
  implements DbLinkUserDetails
{
  declare id: string;

  declare label: string;

  declare type: string;

  declare linkForUserId: CreationOptional<string>;

  declare createdByUserId: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare createdBy: NonAttribute<PersistedUser>;

  declare linkFor: NonAttribute<PersistedAccountUser>;

  declare setLinkFor: HasOneSetAssociationMixin<PersistedAccountUser, string>;
}

export const initLinkUser = (sequelize: Sequelize) =>
  PersistedLinkUser.init(
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
      modelName: "LinkUser",
    }
  );

export const initAccountUser = (sequelize: Sequelize) =>
  PersistedAccountUser.init(
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
      modelName: "AccountUser",
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

  PersistedUser.hasOne(PersistedAccountUser, {
    as: "account",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });
  PersistedAccountUser.belongsTo(PersistedUser, {
    as: "user",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });

  PersistedUser.hasOne(PersistedLinkUser, {
    as: "link",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });
  PersistedLinkUser.belongsTo(PersistedUser, {
    as: "user",
    foreignKey: { allowNull: false, field: "id", name: "id" },
  });

  PersistedUser.hasMany(PersistedLinkUser, {
    as: "createdLinks",
    foreignKey: {
      allowNull: false,
      field: "createdByUserId",
      name: "createdByUserId",
    },
  });
  PersistedLinkUser.belongsTo(PersistedUser, {
    as: "createdBy",
    foreignKey: {
      allowNull: false,
      field: "createdByUserId",
      name: "createdByUserId",
    },
  });

  PersistedAccountUser.hasMany(PersistedLinkUser, {
    as: "links",
    sourceKey: "id",
    foreignKey: {
      allowNull: true,
      field: "linkForUserId",
      name: "linkForUserId",
    },
  });
  PersistedLinkUser.belongsTo(PersistedAccountUser, {
    as: "linkFor",
    targetKey: "id",
    foreignKey: {
      allowNull: true,
      field: "linkForUserId",
      name: "linkForUserId",
    },
  });
};
