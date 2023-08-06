import * as t from "io-ts";
import { MembershipWorksUserType } from "../../membership-works/MembershipWorksTypes";

const ModelUserSource = t.union([t.literal("account"), t.literal("link")]);

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

export const ModelLinkUserDetailsNoExpansion = t.strict({
  id: t.string,
  label: t.string,
  type: LinkUserType,
  linkForUserId: t.union([t.string, t.undefined, t.null]),
  createdByUserId: t.union([t.string, t.undefined]),
});
export type ModelLinkUserDetailsNoExpansion = t.TypeOf<
  typeof ModelLinkUserDetailsNoExpansion
>;

export const ModelAccountUser = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("account"),
  account: ModelAccountUserDetails,
});
export type ModelAccountUser = t.TypeOf<typeof ModelAccountUser>;

export const ModelLinkUserNoExpansion = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("link"),
});
export type ModelLinkUserNoExpansion = t.TypeOf<
  typeof ModelLinkUserNoExpansion
>;

export const ModelUserNoExpansion = t.exact(
  t.type({
    id: t.string,
    enabled: t.boolean,
    source: ModelUserSource,
  })
);

export const ModelUser = t.union([ModelAccountUser, ModelLinkUserNoExpansion]);
export type ModelUser = t.TypeOf<typeof ModelUser>;

export const ModelLinkUserDetails = t.strict({
  id: t.string,
  label: t.string,
  type: LinkUserType,
  linkForUserId: t.string,
  createdByUserId: t.string,
});
export type ModelLinkUserDetails = t.TypeOf<typeof ModelLinkUserDetails>;

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

export const ModelLinkUser = t.strict({
  id: t.string,
  enabled: t.boolean,
  source: t.literal("link"),
  link: ModelLinkUserDetails,
});
export type ModelLinkUser = t.TypeOf<typeof ModelLinkUser>;

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
  extends Omit<ModelAccountUser, "account"> {
  account: ModelBuildableAccountUserDetails;
}

export interface ModelAccountUserDetailsUpdates
  extends Partial<Omit<ModelAccountUserDetails, "id">> {}
export interface ModelAccountUserUpdates
  extends Partial<Omit<ModelAccountUser, "id" | "account">> {
  account: ModelAccountUserDetailsUpdates;
}

export interface ModelBuildableLinkUser extends Omit<ModelLinkUser, "link"> {
  link: ModelBuildableLinkUserDetails;
}
