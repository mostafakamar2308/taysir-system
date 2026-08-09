import { ChatMessage } from "@/generated/prisma/browser";
import { Role } from "@/types/user";

export enum ClientEvent {
  JoinRoom = "room:join",
  LeaveRoom = "room:leave",
  SendMessage = "message:send",
  UpdateMessage = "message:update",
  DeleteMessage = "message:delete",
  MarkMessageAsRead = "message:mark-read",
  UserTyping = "user:typing",
}

export type RoomKind = "direct" | "group";

export enum ServerEvent {
  RoomMessage = "room:message",
  RoomMessageUpdated = "room:message-updated",
  RoomMessageDeleted = "room:message-deleted",
  RoomMessageRead = "room:message-read",
  UserTyping = "user:typing",
  UserOnline = "user:online",
  UserOffline = "user:offline",
}

export interface AcknowledgePayload {
  code: AcknowledgeCode;
  message?: string;
}

export enum AcknowledgeCode {
  Success = 0,
  EmptyText = 1,
  RoomNotFound = 2,
  NotMember = 3,
  NotOwner = 4,
  MessageNotFound = 5,
  Unreachable = 6,
  Unallowed = 7,
  DeleteEditTimeExpired = 8,
}

export type AcknowledgeCallback = (payload: AcknowledgePayload) => void;

// Maps for Socket.IO typed events
export interface ClientEventsMap {
  [ClientEvent.JoinRoom]: (
    data: { roomId: number; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) => void;
  [ClientEvent.LeaveRoom]: (data: { roomId: number; kind?: RoomKind }) => void;
  [ClientEvent.SendMessage]: (
    data: { roomId: number; text: string; refId: string; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) => void;
  [ClientEvent.UpdateMessage]: (
    data: { id: number; text: string; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) => void;
  [ClientEvent.DeleteMessage]: (
    data: { id: number; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) => void;
  [ClientEvent.MarkMessageAsRead]: (
    data: { id: number; kind?: RoomKind },
    callback?: AcknowledgeCallback,
  ) => void;
  [ClientEvent.UserTyping]: (data: { roomId: number; kind?: RoomKind }) => void;
}

export type FullChatMessage = ChatMessage & {
  sender: {
    id: number;
    name: string | null;
    imageUrl: string | null;
    role: Role;
  };
};

export interface ServerEventsMap {
  [ServerEvent.RoomMessage]: (payload: {
    message: FullChatMessage;
    refId?: string;
  }) => void;
  [ServerEvent.RoomMessageUpdated]: (payload: {
    message: FullChatMessage;
  }) => void;
  [ServerEvent.RoomMessageDeleted]: (payload: {
    roomId: number;
    messageId: number;
  }) => void;
  [ServerEvent.RoomMessageRead]: (payload: {
    userId: number;
    messageId: number;
    roomId: number;
  }) => void;
  [ServerEvent.UserTyping]: (payload: {
    roomId: number;
    userId: number;
  }) => void;
  [ServerEvent.UserOnline]: (payload: { userId: number }) => void;
  [ServerEvent.UserOffline]: (payload: { userId: number }) => void;
}
