interface EventTellorResponse {
  tellorUserId: string;
  tellorUserLoginPath: string;
  eventId: number;
  label: string;
}

export interface EventTellorsResponse {
  tellors: EventTellorResponse[];
}

export interface CreateEventTellorRequest {
  eventId: number;
  label: string;
}

export type CreateEventTellorResponse = EventTellorResponse;
