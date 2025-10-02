export enum WSEventType {
  ERROR = -1,
  PING = 0,
  PONG = 1,
  RefreshEvent = 2,
}

// Base interface for all WebSocket events
export interface WSEventBase {
  type: WSEventType;
  timestamp?: number;
}

export interface WSErrorEvent extends WSEventBase {
  type: WSEventType.ERROR;
  error: string;
}

export interface WSPingEvent extends WSEventBase {
  type: WSEventType.PING;
}

export interface WSPongEvent extends WSEventBase {
  type: WSEventType.PONG;
}

export interface WSRefreshEvent extends WSEventBase {
  type: WSEventType.RefreshEvent;
}

// Union type for all possible WebSocket events
export type WSEvent = WSRefreshEvent | WSPingEvent | WSPongEvent;
