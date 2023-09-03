import { ModelRole } from "../../model/interfaces/model-roles";
import { FrontEndFeatureFlags } from "../../utils/feature-flags";

export default interface ProfileResponse {
  profile: {
    id: string;
    name: string;
    roles: ModelRole[];
    groupDelegateInfo?: {
      delegateForGroupId: string;
      delegateForGroupName: string;
      delegateForEventId: number;
    };
    tellorInfo?: {
      tellorForEventId: number;
    };
    clerkInfo?: {
      clerkForEventId: number;
    };
  };
  frontEndFeatureFlags: FrontEndFeatureFlags;
}
