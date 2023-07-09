import { Role } from "../../user/permissions";
import { FrontEndFeatureFlags } from "../../utils/feature-flags";

export default interface ProfileResponse {
  profile: {
    id: string;
    name: string;
    roles: Role[];
  };
  frontEndFeatureFlags: FrontEndFeatureFlags;
}
