import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatLayout } from "@/components/dashboard/chat/chatLayout";
import { getChatsForUser } from "@/actions/chat";

export default async function ChatPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");

  const chats = await getChatsForUser(currentUser.id, currentUser.role);

  return <ChatLayout chats={chats} currentUser={currentUser} />;
}
