export interface Event {
  id: number;
  name: string;
  description: string;
  fromDate: Date;
  toDate: Date;
}

export interface BuildableEvent extends Omit<Event, "id"> {}
