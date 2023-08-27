export interface DbAccountUserDetails {
  id: string;
  name: string;
  contactName: string | null;
  type: string;
  isAdmin: boolean;
}

export interface DbLinkUserDetails {
  id: string;
  label: string;
  type: string;
  info: string;

  createdByUserId?: string;
}

export interface DbLinkUserDetailsExpanded extends DbLinkUserDetails {
  createdBy: DbUser;
  linkFor: DbAccountUserDetails;
}

export interface DbUser {
  id: string;
  enabled: boolean;
  source: string;

  account?: DbAccountUserDetails;
  link?: DbLinkUserDetails;
}
