import { RoomKind } from "@/wss/types";

export const asChatRoomId = (
  roomId: number,
  kind: RoomKind = "direct",
) => (kind === "group" ? `group-chat:${roomId}` : `chat:${roomId}`);
