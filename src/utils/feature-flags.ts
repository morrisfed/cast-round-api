import env from "./env";

export type FrontEndFeatureFlag =
  | "feature.ui.eventgroupdelegates"
  | "feature.ui.eventtellors";

export type FrontEndFeatureFlags = Record<FrontEndFeatureFlag, boolean>;

const frontEndFeatureFlags: FrontEndFeatureFlags = {
  "feature.ui.eventgroupdelegates": env.FEATURE_UI_EVENT_GROUP_DELEGATES,
  "feature.ui.eventtellors": env.FEATURE_UI_EVENT_TELLORS,
};

export const getFrontEndFeatureFlags = (): FrontEndFeatureFlags => ({
  "feature.ui.eventgroupdelegates":
    frontEndFeatureFlags["feature.ui.eventgroupdelegates"],
  "feature.ui.eventtellors": frontEndFeatureFlags["feature.ui.eventtellors"],
});

export const getFrontEndFeatureFlag = (flag: FrontEndFeatureFlag) =>
  frontEndFeatureFlags[flag];
