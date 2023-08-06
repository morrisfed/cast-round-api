export interface DbAccountUserDetails {
  id: string;
  name: string;
  contactName: string | null;
  type: string;
  isAdmin: boolean;
}

export interface DbLinkUserDetailsNoExpansion {
  id: string;
  label: string;
  type: string;

  linkForUserId?: string;
  createdByUserId?: string;
}

export interface DbLinkUserDetails extends DbLinkUserDetailsNoExpansion {
  createdBy: DbUser;
  linkFor: DbAccountUserDetails;
}

export interface DbUser {
  id: string;
  enabled: boolean;
  source: string;

  account?: DbAccountUserDetails;
  link?: DbLinkUserDetailsNoExpansion;
}
