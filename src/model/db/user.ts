import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import { User, UserType } from "../../interfaces/User";

class PersistedUser
  extends Model<
    InferAttributes<PersistedUser>,
    InferCreationAttributes<PersistedUser>
  >
  implements User
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
      modelName: "User",
    }
  );

export default PersistedUser;
