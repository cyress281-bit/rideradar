import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, ImagePlus, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

export default function DirectMessageChat({ friend, user }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const bottomRef = useRef(null);
  const photoInputRef = useRef(null);

  const conversationId = [user.email, friend.email].sort().join("|");

  const { data: messages = [] } = useQuery({
    queryKey: ["direct-messages", conversationId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: conversationId }, "created_date", 100),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["direct-messages", conversationId] });
      }
    });
    return unsub;
  }, [conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async (overrides = {}) => {
    const msgText = overrides.text ?? text.trim();
    if (!msgText && !overrides.photo_url) return;
    if (sending) return;
    setSending(true);
    await base44.entities.DirectMessage.create({
      conversation_id: conversationId,
      sender_email: user.email,
      sender_username: user.username || user.email.split("@")[0],
      recipient_email: friend.email,
      text: msgText,
      photo_url: overrides.photo_url ?? undefined,
    });
    if (!overrides.photo_url) setText("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["direct-messages", conversationId] });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await sendMessage({ text: "📷 Photo", photo_url: file_url });
    setUploadingPhoto(false);
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-background rounded-2xl border border-border overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_email === user.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"
                }`}>
                  <p className="text-sm leading-snug">{msg.text}</p>
                  {msg.photo_url && (
                    <a href={msg.photo_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                      <img src={msg.photo_url} alt="photo" className="rounded-lg max-w-full max-h-40 object-cover" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex gap-2">
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors"
          >
            {uploadingPhoto ? <Loader className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <ImagePlus className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-secondary border-border flex-1 text-sm h-9"
            maxLength={280}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!text.trim() || sending}
            size="icon"
            className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}