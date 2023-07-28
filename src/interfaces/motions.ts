import {
  ModelMotion,
  ModelMotionStatus,
} from "../model/interfaces/model-motions";

export type MotionStatus = ModelMotionStatus;

export interface Motion extends ModelMotion {}

export interface BuildableMotion extends Omit<Motion, "id" | "status"> {}

export interface MotionUpdates
  extends Partial<Omit<BuildableMotion, "eventId">> {}
