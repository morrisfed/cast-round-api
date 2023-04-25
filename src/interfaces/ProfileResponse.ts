import { UserType } from "./User";

export default interface ProfileResponse {
  profile: {
    id: string;
    name: string;
    type: UserType;
  };
}
