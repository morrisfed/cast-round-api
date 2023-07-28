export type ModelMotionStatus =
  | "draft"
  | "proxy"
  | "open"
  | "closed"
  | "cancelled"
  | "discarded";

export interface ModelMotion {
  id: number;
  eventId: number;
  status: ModelMotionStatus;
  title: string;
  description: string;
}

export interface ModelBuildableMotion extends Omit<ModelMotion, "id"> {}

export interface ModelMotionUpdates
  extends Partial<Omit<ModelBuildableMotion, "eventId">> {}
