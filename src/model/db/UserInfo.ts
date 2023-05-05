/* eslint max-classes-per-file: ["error", 3] */

import {
  CreationOptional,
  DataTypes,
  HasOneCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import {
  AccountUserInfo,
  DelegateUserInfo,
  DelegateUserType,
  UserInfo,
  UserSource,
} from "../../interfaces/UserInfo";
import { MembershipWorksUserType } from "../../membership-works/MembershipWorksTypes";

export class PersistedCommonUserInfo
  extends Model<
    InferAttributes<PersistedCommonUserInfo>,
    InferCreationAttributes<PersistedCommonUserInfo>
  >
  implements UserInfo
{
  declare id: string;

  declare enabled: boolean;

  declare source: UserSource;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare account?: AccountUserInfo;

  declare delegate?: DelegateUserInfo;

  declare createAccount: HasOneCreateAssociationMixin<PersistedAccount>;

  declare createDelegate: HasOneCreateAssociationMixin<PersistedDelegate>;
}

export class PersistedAccount
  extends Model<
    InferAttributes<PersistedAccount>,
    InferCreationAttributes<PersistedAccount>
  >
  implements AccountUserInfo
{
  declare name: string;

  declare contactName: string | null;

  declare type: MembershipWorksUserType;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export class PersistedDelegate
  extends Model<
    InferAttributes<PersistedDelegate>,
    InferCreationAttributes<PersistedDelegate>
  >
  implements DelegateUserInfo
{
  declare label: string;

  declare type: DelegateUserType;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare createdBy: NonAttribute<PersistedCommonUserInfo>;
}

export const initDelegate = (sequelize: Sequelize) =>
  PersistedDelegate.init(
    {
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Delegate",
    }
  );

export const initAccount = (sequelize: Sequelize) =>
  PersistedAccount.init(
    {
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
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Account",
    }
  );

const initCommonUserInfo = (sequelize: Sequelize) =>
  PersistedCommonUserInfo.init(
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
      modelName: "UserInfo",
    }
  );

export const initUser = (sequelize: Sequelize) => {
  initCommonUserInfo(sequelize);
  initAccount(sequelize);
  initDelegate(sequelize);

  PersistedCommonUserInfo.hasOne(PersistedAccount, {
    as: "account",
    foreignKey: { allowNull: false },
  });
  PersistedAccount.belongsTo(PersistedCommonUserInfo);

  PersistedCommonUserInfo.hasOne(PersistedDelegate, {
    as: "delegate",
    foreignKey: { allowNull: false },
  });
  PersistedDelegate.belongsTo(PersistedCommonUserInfo);

  PersistedDelegate.belongsTo(PersistedCommonUserInfo, {
    as: "createdBy",
    foreignKey: { allowNull: false },
  });
};
