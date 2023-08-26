import { ModelMotionVote } from "../model/interfaces/model-motion-votes";
import {
  ModelMotion,
  ModelMotionStatus,
} from "../model/interfaces/model-motions";

export type MotionStatus = ModelMotionStatus;

export interface Motion extends ModelMotion {}

export interface MotionWithOptionalVotes extends Motion {
  votes?: readonly ModelMotionVote[];
}

export interface BuildableMotion extends Omit<Motion, "id" | "status"> {}

export interface MotionUpdates
  extends Partial<Omit<BuildableMotion, "eventId">> {}
