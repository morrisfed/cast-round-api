export type MotionStatus =
  | "draft"
  | "proxy"
  | "open"
  | "closed"
  | "cancelled"
  | "abandoned";

export interface Motion {
  id: number;
  eventId: number;
  status: MotionStatus;
  title: string;
  description: string;
}

export interface BuildableMotion extends Omit<Motion, "id"> {}

export interface MotionUpdates
  extends Partial<Omit<BuildableMotion, "eventId">> {}
