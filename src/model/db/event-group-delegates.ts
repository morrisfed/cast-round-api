/* eslint max-classes-per-file: ["error", 3] */

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { Event, EventGroupDelegate } from "../../interfaces/events";

export class PersistedEventGroupDelegate
  extends Model<
    InferAttributes<PersistedEventGroupDelegate>,
    InferCreationAttributes<PersistedEventGroupDelegate>
  >
  implements EventGroupDelegate
{
  declare event: NonAttribute<Event>;

  declare delegateUser: NonAttribute<EventGroupDelegate["delegateUser"]>;

  declare delegateFor: NonAttribute<EventGroupDelegate["delegateFor"]>;

  declare eventId: CreationOptional<number>;

  declare delegateUserId: CreationOptional<string>;

  declare delegateForUserId: CreationOptional<string>;
}

const initEventGroupDelegateModel = (sequelize: Sequelize) =>
  PersistedEventGroupDelegate.init(
    {
      eventId: { type: DataTypes.INTEGER, allowNull: false },
      delegateUserId: { type: DataTypes.STRING, allowNull: false },
      delegateForUserId: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "EventGroupDelegate",
    }
  );

export const initEventGroupDelegate = (sequelize: Sequelize) => {
  initEventGroupDelegateModel(sequelize);
};
