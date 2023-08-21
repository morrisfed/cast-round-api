import * as t from "io-ts";
import { MembershipWorksUserType } from "../../membership-works/MembershipWorksTypes";

// const ModelUserSource = t.union([t.literal("account"), t.literal("link")]);

const LinkUserType = t.union([
  t.literal("group-delegate"),
  t.literal("tellor"),
]);

export const ModelAccountUserDetails = t.strict({
  id: t.string,
  name: t.string,
  contactName: t.union([t.string, t.null]),
  type: MembershipWorksUserType,
  isAdmin: t.boolean,
});
export type ModelAccountUserDetails = t.TypeOf<typeof ModelAccountUserDetails>;

export const ModelLinkUserDetails = t.strict({
  id: t.string,
  label: t.string,
  type: LinkUserType,
  linkForUserId: t.union([t.string, t.undefined, t.null]),
  createdByUserId: t.string,
});
export type ModelLinkUserDetails = t.TypeOf<typeof ModelLinkUserDetails>;

export const ModelAccountUser = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("account"),
});
export type ModelAccountUser = t.TypeOf<typeof ModelAccountUser>;

export const ModelLinkUser = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("link"),
});
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

export const ModelAccountUserWithDetails = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("account"),
  account: ModelAccountUserDetails,
});
export type ModelAccountUserWithDetails = t.TypeOf<
  typeof ModelAccountUserWithDetails
>;

export const ModelLinkUserWithDetails = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("link"),
  link: ModelLinkUserDetails,
});
export type ModelLinkUserWithDetails = t.TypeOf<
  typeof ModelLinkUserWithDetails
>;

export const ModelLinkUserDetailsWithCreatedBy = t.strict({
  label: t.string,
  createdBy: ModelUser,
  type: LinkUserType,
});
export type ModelLinkUserDetailsWithCreatedBy = t.TypeOf<
  typeof ModelLinkUserDetailsWithCreatedBy
>;

interface ModelBuildableAccountUserDetails extends ModelAccountUserDetails {}

export interface ModelBuildableLinkUserDetails {
  id: string;
  label: string;
  type: string;

  linkForUserId?: string;
  createdByUserId: string;
}

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
