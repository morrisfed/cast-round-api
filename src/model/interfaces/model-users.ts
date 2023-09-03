import * as t from "io-ts";
import { JsonFromString } from "io-ts-types";
import { MembershipWorksUserType } from "../../membership-works/MembershipWorksTypes";
import { DataValuesFromFromModel } from "../db/interfaces/persisted";
import { ModelRole } from "./model-roles";

export const ModelAccountUserDetails = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    name: t.string,
    contactName: t.union([t.string, t.null]),
    type: MembershipWorksUserType,
    isAdmin: t.boolean,
  })
);
export type ModelAccountUserDetails = t.TypeOf<typeof ModelAccountUserDetails>;

const ModelLinkUserGroupDelegateInfoSchema1 = t.strict({
  infoSchemaVersion: t.literal(1),
  delegateForGroupId: t.string,
  delegateForGroupName: t.string,
  delegateForRoles: t.array(ModelRole),
  delegateForEventId: t.number,
});
const ModelLinkUserGroupDelegateInfo = ModelLinkUserGroupDelegateInfoSchema1;
export type ModelLinkUserGroupDelegateInfo = t.TypeOf<
  typeof ModelLinkUserGroupDelegateInfo
>;

const ModelLinkUserGroupDelegateInfoFromString = t.string.pipe(
  JsonFromString.pipe(ModelLinkUserGroupDelegateInfo)
);

const ModelLinkUserTellorInfoSchema1 = t.strict({
  infoSchemaVersion: t.literal(1),
  tellorForEventId: t.number,
});
const ModelLinkUserTellorInfo = ModelLinkUserTellorInfoSchema1;
export type ModelLinkUserTellorInfo = t.TypeOf<typeof ModelLinkUserTellorInfo>;

const ModelLinkUserTellorInfoFromString = t.string.pipe(
  JsonFromString.pipe(ModelLinkUserTellorInfo)
);

const ModelLinkUserClerkInfoSchema1 = t.strict({
  infoSchemaVersion: t.literal(1),
  clerkForEventId: t.number,
});
const ModelLinkUserClerkInfo = ModelLinkUserClerkInfoSchema1;
export type ModelLinkUserClerkInfo = t.TypeOf<typeof ModelLinkUserClerkInfo>;

const ModelLinkUserClerkInfoFromString = t.string.pipe(
  JsonFromString.pipe(ModelLinkUserClerkInfo)
);

export const ModelLinkUserGroupDelegateDetails = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    label: t.string,
    type: t.literal("group-delegate"),
    info: ModelLinkUserGroupDelegateInfoFromString,
    createdByUserId: t.string,
  })
);
export type ModelLinkUserGroupDelegateDetails = t.TypeOf<
  typeof ModelLinkUserGroupDelegateDetails
>;

export const ModelLinkUserTellorDetails = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    label: t.string,
    type: t.literal("tellor"),
    info: ModelLinkUserTellorInfoFromString,
    createdByUserId: t.string,
  })
);
export type ModelLinkUserTellorDetails = t.TypeOf<
  typeof ModelLinkUserTellorDetails
>;

export const ModelLinkUserClerkDetails = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    label: t.string,
    type: t.literal("clerk"),
    info: ModelLinkUserClerkInfoFromString,
    createdByUserId: t.string,
  })
);
export type ModelLinkUserClerkDetails = t.TypeOf<
  typeof ModelLinkUserClerkDetails
>;

export const ModelLinkUserDetails = t.union([
  ModelLinkUserGroupDelegateDetails,
  ModelLinkUserTellorDetails,
  ModelLinkUserClerkDetails,
]);
export type ModelLinkUserDetails = t.TypeOf<typeof ModelLinkUserDetails>;

export const ModelAccountUser = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("account"),
});
export type ModelAccountUser = t.TypeOf<typeof ModelAccountUser>;

export const ModelLinkUser = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    enabled: t.boolean,
    source: t.literal("link"),
  })
);
export type ModelLinkUser = t.TypeOf<typeof ModelLinkUser>;

export const ModelUser = t.union([ModelAccountUser, ModelLinkUser]);
export type ModelUser = t.TypeOf<typeof ModelUser>;

export const ModelAccountUserDetailsWithLinks = t.strict({
  id: t.string,
  name: t.string,
  contactName: t.string,
  type: MembershipWorksUserType,
  isAdmin: t.boolean,
  links: t.array(ModelLinkUserDetails),
});
type ModelAccountUserDetailsWithLinks = t.TypeOf<
  typeof ModelAccountUserDetailsWithLinks
>;

export const ModelAccountUserWithLinks = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("account"),
  account: ModelAccountUserDetailsWithLinks,
});
export type ModelAccountUserWithLinks = t.TypeOf<
  typeof ModelAccountUserWithLinks
>;

export const ModelAccountUserWithDetails = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    enabled: t.boolean,
    source: t.literal("account"),
    account: ModelAccountUserDetails,
  })
);
export type ModelAccountUserWithDetails = t.TypeOf<
  typeof ModelAccountUserWithDetails
>;

export const ModelLinkUserWithDetails = DataValuesFromFromModel.pipe(
  t.strict({
    id: t.string,
    enabled: t.boolean,
    source: t.literal("link"),
    link: ModelLinkUserDetails,
  })
);
export type ModelLinkUserWithDetails = t.TypeOf<
  typeof ModelLinkUserWithDetails
>;

const ModelLinkUserGroupDelegateDetailsWithCreatedBy = t.strict({
  label: t.string,
  createdBy: ModelUser,
  type: t.literal("group-delegate"),
  info: ModelLinkUserGroupDelegateInfoFromString,
});

const ModelLinkUserTellorDetailsWithCreatedBy = t.strict({
  label: t.string,
  createdBy: ModelUser,
  type: t.literal("tellor"),
  info: ModelLinkUserTellorInfoFromString,
});

export const ModelLinkUserDetailsWithCreatedBy = t.union([
  ModelLinkUserGroupDelegateDetailsWithCreatedBy,
  ModelLinkUserTellorDetailsWithCreatedBy,
]);
export type ModelLinkUserDetailsWithCreatedBy = t.TypeOf<
  typeof ModelLinkUserDetailsWithCreatedBy
>;

interface ModelBuildableAccountUserDetails extends ModelAccountUserDetails {}

export const ModelBuildableLinkUserDetails = ModelLinkUserDetails;
export type ModelBuildableLinkUserDetails = t.TypeOf<
  typeof ModelBuildableLinkUserDetails
>;

export interface ModelBuildableAccountUser
  extends Omit<ModelAccountUserWithDetails, "account"> {
  account: ModelBuildableAccountUserDetails;
}

export interface ModelAccountUserDetailsUpdates
  extends Partial<Omit<ModelAccountUserDetails, "id">> {}
export interface ModelAccountUserWithDetailsUpdates
  extends Partial<Omit<ModelAccountUserWithDetails, "id" | "account">> {
  account: ModelAccountUserDetailsUpdates;
}

export interface ModelBuildableLinkUser
  extends Omit<ModelLinkUserWithDetails, "link"> {
  link: ModelBuildableLinkUserDetails;
}
