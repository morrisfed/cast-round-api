import * as t from "io-ts";

import { Model } from "sequelize";

export const DataValuesFromFromModel = new t.Type<any, any, unknown>(
  "ObjectFromModel",
  t.UnknownRecord.is,
  (input, context) => {
    if (input instanceof Model) {
      return t.success(input.dataValues);
    }
    return t.failure(input, context);
  },
  t.identity
);
