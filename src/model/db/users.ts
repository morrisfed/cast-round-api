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
  AccountUserDetails,
  DelegateUserDetails,
  DelegateUserType,
  User,
  UserSource,
} from "../../interfaces/UserInfo";
import { MembershipWorksUserType } from "../../membership-works/MembershipWorksTypes";

export class PersistedUser
  extends Model<
    InferAttributes<PersistedUser>,
    InferCreationAttributes<PersistedUser>
  >
  implements User
{
  declare id: string;

  declare enabled: boolean;

  declare source: UserSource;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare account?: AccountUserDetails;

  declare delegate?: DelegateUserDetails;

  declare createAccount: HasOneCreateAssociationMixin<PersistedAccount>;

  declare createDelegate: HasOneCreateAssociationMixin<PersistedDelegate>;
}

export class PersistedAccount
  extends Model<
    InferAttributes<PersistedAccount>,
    InferCreationAttributes<PersistedAccount>
  >
  implements AccountUserDetails
{
  declare name: string;

  declare contactName: string | null;

  declare type: MembershipWorksUserType;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare userId: NonAttribute<string>;

  declare delegates: NonAttribute<PersistedDelegate[]>;

  declare createDelegate: HasManyCreateAssociationMixin<PersistedDelegate>;
}

export class PersistedDelegate
  extends Model<
    InferAttributes<PersistedDelegate>,
    InferCreationAttributes<PersistedDelegate>
  >
  implements DelegateUserDetails
{
  declare label: string;

  declare type: DelegateUserType;

  declare delegateForUserId: CreationOptional<string>;

  declare createdByUserId: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare createdBy: NonAttribute<PersistedUser>;

  declare delegateFor: NonAttribute<PersistedAccount>;

  declare setDelegateFor: HasOneSetAssociationMixin<PersistedAccount, string>;
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
      delegateForUserId: { type: DataTypes.STRING, allowNull: true },
      createdByUserId: { type: DataTypes.STRING, allowNull: false },
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
  initAccount(sequelize);
  initDelegate(sequelize);

  PersistedUser.hasOne(PersistedAccount, {
    as: "account",
    foreignKey: { allowNull: false, field: "userId", name: "userId" },
  });
  PersistedAccount.belongsTo(PersistedUser, {
    as: "user",
    foreignKey: { allowNull: false, field: "userId", name: "userId" },
  });

  PersistedUser.hasOne(PersistedDelegate, {
    as: "delegate",
    foreignKey: { allowNull: false, field: "userId", name: "userId" },
  });
  PersistedDelegate.belongsTo(PersistedUser, {
    as: "user",
    foreignKey: { allowNull: false, field: "userId", name: "userId" },
  });

  PersistedUser.hasMany(PersistedDelegate, {
    as: "createdDelegates",
    foreignKey: {
      allowNull: false,
      field: "createdByUserId",
      name: "createdByUserId",
    },
  });
  PersistedDelegate.belongsTo(PersistedUser, {
    as: "createdBy",
    foreignKey: {
      allowNull: false,
      field: "createdByUserId",
      name: "createdByUserId",
    },
  });

  PersistedAccount.hasMany(PersistedDelegate, {
    as: "delegates",
    sourceKey: "userId",
    foreignKey: {
      allowNull: true,
      field: "delegateForUserId",
      name: "delegateForUserId",
    },
  });
  PersistedDelegate.belongsTo(PersistedAccount, {
    as: "delegateFor",
    targetKey: "userId",
    foreignKey: {
      allowNull: true,
      field: "delegateForUserId",
      name: "delegateForUserId",
    },
  });
};
