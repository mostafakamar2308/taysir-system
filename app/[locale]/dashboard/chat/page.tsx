import { user } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ChatLayout } from "@/components/dashboard/chat/chatLayout";
import { getChatsForUser } from "@/actions/chat";

export default async function ChatPage() {
  const currentUser = await user();
  if (!currentUser) redirect("/login");

  const chatsRes = await getChatsForUser(currentUser.id, currentUser.role);
  if (!chatsRes.ok) notFound();

  return <ChatLayout chats={chatsRes.data} currentUser={currentUser} />;
}
