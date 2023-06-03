import { Role } from "../../user/permissions";

export default interface ProfileResponse {
  profile: {
    id: string;
    name: string;
    roles: Role[];
  };
}
