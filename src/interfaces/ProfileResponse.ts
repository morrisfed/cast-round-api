import { Permission } from "../user/permissions";
import { UserType } from "./UserInfo";

export default interface ProfileResponse {
  profile: {
    id: string;
    name: string;
    type: UserType;
    permissions: Permission[];
  };
}
