import * as t from "io-ts";

import { ModelAccountUserDetails, ModelLinkUserDetails } from "./model-users";

export const ModelEventGroupDelegate = t.strict({
  eventId: t.number,
  delegateUserId: t.string,
  delegateForUserId: t.string,
});
export type ModelEventGroupDelegate = t.TypeOf<typeof ModelEventGroupDelegate>;

export const ModelEventGroupDelegateWithDelegateUserDelgateFor = t.strict({
  delegateUser: ModelLinkUserDetails,
  delegateFor: ModelAccountUserDetails,

  eventId: t.number,
  delegateUserId: t.string,
  delegateForUserId: t.string,
});
export type ModelEventGroupDelegateWithDelegateUserDelgateFor = t.TypeOf<
  typeof ModelEventGroupDelegateWithDelegateUserDelgateFor
>;

export interface ModelBuildableEventGroupDelegate
  extends Omit<
    ModelEventGroupDelegateWithDelegateUserDelgateFor,
    "event" | "delegateUser" | "delegateFor"
  > {}
