import React, { useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useTabNavigation } from "@/context/TabNavigationContext";

export default function DirectMessageThread({ contact, messages, user, onBack }) {
  const { goBack } = useTabNavigation();
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Mark messages as read
  useEffect(() => {
    const unreadMessages = messages.filter(
      m => m.recipient_email === user?.email && !m.read
    );
    unreadMessages.forEach(async (msg) => {
      await base44.entities.DirectMessage.update(msg.id, { read: true });
    });
    if (unreadMessages.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["direct-messages"] });
    }
  }, [messages, user?.email, queryClient]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <button
          onClick={() => goBack()}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-bold">@{contact.username}</p>
          <p className="text-[10px] text-muted-foreground">{contact.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ overscrollBehavior: 'none' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_email === user?.email ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                  msg.sender_email === user?.email
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-foreground border border-border/50"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}