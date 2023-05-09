import { UserType } from "../../interfaces/UserInfo";
import { Permission } from "../../user/permissions";

export default interface ProfileResponse {
  profile: {
    id: string;
    name: string;
    type: UserType;
    permissions: Permission[];
  };
}
