import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import { UserInfo, UserType } from "../../interfaces/UserInfo";

class PersistedUserInfo
  extends Model<
    InferAttributes<PersistedUserInfo>,
    InferCreationAttributes<PersistedUserInfo>
  >
  implements UserInfo
{
  declare id: string;

  declare enabled: boolean;

  declare name: string;

  declare contactName: string | null;

  declare type: UserType;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;
}

export const init = (sequelize: Sequelize) =>
  PersistedUserInfo.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
      },
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
      modelName: "UserInfo",
    }
  );

export default PersistedUserInfo;
