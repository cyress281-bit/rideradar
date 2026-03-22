import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { VariableSizeList as List } from "react-window";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useTabNavigation } from "@/context/TabNavigationContext";

function MessageRow({ index, style, data }) {
  const message = data.messages[index];
  const isMe = message.sender_email === data.userEmail;

  return (
    <div style={{ ...style, top: style.top + 8, height: style.height - 8 }} className="px-1">
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
            isMe
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/60 text-foreground border border-border/50"
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

export default function DirectMessageThread({ contact, messages, user, onBack }) {
  const { goBack } = useTabNavigation();
  const queryClient = useQueryClient();
  const listRef = useRef(null);
  const [listHeight, setListHeight] = useState(() => Math.max(window.innerHeight - 290, 280));

  useEffect(() => {
    const unreadMessages = messages.filter((message) => message.recipient_email === user?.email && !message.read);

    if (unreadMessages.length === 0) return;

    Promise.all(unreadMessages.map((message) => base44.entities.DirectMessage.update(message.id, { read: true }))).then(() => {
      queryClient.invalidateQueries({ queryKey: ["direct-messages"] });
    });
  }, [messages, user?.email, queryClient]);

  useEffect(() => {
    const handleResize = () => setListHeight(Math.max(window.innerHeight - 290, 280));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getItemSize = useCallback(
    (index) => Math.min(78 + Math.ceil((messages[index]?.text?.length || 0) / 28) * 18, 196),
    [messages]
  );

  const itemData = useMemo(() => ({ messages, userEmail: user?.email }), [messages, user?.email]);

  useEffect(() => {
    if (!listRef.current || messages.length === 0) return;
    listRef.current.resetAfterIndex(0);
    requestAnimationFrame(() => listRef.current?.scrollToItem(messages.length - 1, "end"));
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <button
          onClick={() => (onBack ? onBack() : goBack())}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 min-h-[44px] min-w-[44px]"
          aria-label={`Back from conversation with ${contact.username}`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-bold">@{contact.username}</p>
          <p className="text-[10px] text-muted-foreground">{contact.email}</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <List
          ref={listRef}
          height={listHeight}
          width="100%"
          itemCount={messages.length}
          itemData={itemData}
          itemSize={getItemSize}
          overscanCount={10}
          itemKey={(index, data) => data.messages[index].id}
          style={{ overscrollBehavior: "none" }}
        >
          {MessageRow}
        </List>
      )}
    </div>
  );
}