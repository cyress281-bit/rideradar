import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithOptimism } from "@/hooks/useMutationWithOptimism";
import { Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import DirectMessageThread from "@/components/messages/DirectMessageThread";
import RideMessagesList from "@/components/messages/RideMessagesList";

export default function Messages() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [user, setUser] = useState(null);
   const [activeTab, setActiveTab] = useState("direct"); // "direct" | "rides"
   const [selectedContact, setSelectedContact] = useState(null);
   const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch direct messages
  const { data: directMessages = [] } = useQuery({
    queryKey: ["direct-messages", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.DirectMessage.filter(
        {
          $or: [
            { sender_email: user.email },
            { recipient_email: user.email }
          ]
        },
        "-created_date",
        200
      );
    },
    enabled: !!user?.email,
    staleTime: 30_000,
  });

  // Fetch ride messages
  const { data: userRideIds = [] } = useQuery({
    queryKey: ["user-ride-ids", user?.email],
    queryFn: () => {
      if (!user?.email) return [];
      return base44.entities.RideParticipant.filter(
        { user_email: user.email },
        "-created_date",
        100
      ).then(p => p.map(x => x.ride_id));
    },
    enabled: !!user?.email,
  });

  const { data: rideMessages = [] } = useQuery({
    queryKey: ["ride-messages", userRideIds.join(",")],
    queryFn: async () => {
      if (userRideIds.length === 0) return [];
      const results = await Promise.all(
        userRideIds.map(rideId =>
          base44.entities.RideMessage.filter({ ride_id: rideId }, "-created_date", 50)
        )
      );
      return results.flat();
    },
    enabled: userRideIds.length > 0,
    staleTime: 30_000,
  });

  // Real-time subscriptions
  useEffect(() => {
    const unsub1 = base44.entities.DirectMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["direct-messages"] });
    });
    const unsub2 = base44.entities.RideMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["ride-messages"] });
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [queryClient]);

  // Get unique conversations for direct messages
  const conversations = Array.from(
    new Map(
      directMessages.map(msg => {
        const otherEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
        const otherUsername = msg.sender_email === user?.email ? msg.recipient_username : msg.sender_username;
        const lastMsg = directMessages.find(
          m => (m.sender_email === user?.email ? m.recipient_email : m.sender_email) === otherEmail
        );
        return [otherEmail, { email: otherEmail, username: otherUsername, lastMessage: lastMsg }];
      })
    ).values()
  );

  const dmMutation = useMutationWithOptimism(
    async (messageData) => {
      const username = user.username || user.email?.split("@")[0] || "rider";
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_username: username,
        recipient_email: selectedContact.email,
        recipient_username: selectedContact.username,
        text: messageData.text,
        read: false,
      });
    },
    {
      onMutate: async (messageData) => {
        await queryClient.cancelQueries({ queryKey: ["direct-messages", user.email] });
        const previousData = queryClient.getQueryData(["direct-messages", user.email]);
        const optimisticMessage = {
          id: `optimistic-${Date.now()}`,
          sender_email: user.email,
          sender_username: user.username || user.email?.split("@")[0] || "rider",
          recipient_email: selectedContact.email,
          recipient_username: selectedContact.username,
          text: messageData.text,
          read: false,
          created_date: new Date().toISOString(),
        };
        queryClient.setQueryData(["direct-messages", user.email], (old) => [...(old || []), optimisticMessage]);
        return previousData;
      },
      onError: (err, _, previousData) => {
        if (previousData) queryClient.setQueryData(["direct-messages", user.email], previousData);
      },
    }
  );

  const handleSendDM = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !user) return;
    const messageText = newMessage;
    setNewMessage("");
    dmMutation.mutate({ text: messageText });
  };

  const unreadDMs = directMessages.filter(
    m => m.recipient_email === user?.email && !m.read
  ).length;

  return (
    <div className="min-h-screen pb-24 bg-background" style={{ overscrollBehavior: 'none' }}>
      {/* Header */}
      {!selectedContact && (
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
        <h1 className="text-lg font-bold">Messages</h1>
        <span className="text-xs text-muted-foreground">
          {activeTab === "direct" ? `${conversations.length} conversations` : `${rideMessages.length} messages`}
        </span>
      </div>

      )}

      {/* Tabs */}
      {!selectedContact && (
      <div className="flex gap-2 px-5 pt-3 border-b border-border">
        <button
          onClick={() => { setActiveTab("direct"); setSelectedContact(null); }}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "direct"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Direct Messages
          {unreadDMs > 0 && <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{unreadDMs}</span>}
        </button>
        <button
          onClick={() => { setActiveTab("rides"); setSelectedContact(null); }}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "rides"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Ride Chats
        </button>
      </div>
      )}

      {/* Content */}
      <div className="px-5 pt-3">
        {activeTab === "direct" ? (
          <>
            {selectedContact ? (
              <DirectMessageThread
                contact={selectedContact}
                messages={directMessages.filter(
                  m =>
                    (m.sender_email === user?.email && m.recipient_email === selectedContact.email) ||
                    (m.sender_email === selectedContact.email && m.recipient_email === user?.email)
                )}
                user={user}
                onBack={() => setSelectedContact(null)}
              />
            ) : (
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <motion.button
                      key={conv.email}
                      onClick={() => setSelectedContact(conv)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-full text-left p-3 rounded-xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">@{conv.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{conv.lastMessage?.text}</p>
                        </div>
                        {conv.lastMessage?.recipient_email === user?.email && !conv.lastMessage?.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            )}

            {/* DM input */}
            {selectedContact && (
              <form onSubmit={handleSendDM} className="fixed bottom-24 left-5 right-5 flex gap-2">
                <Input
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-secondary border-border"
                  disabled={dmMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={dmMutation.isPending || !newMessage.trim()}
                  size="icon"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </>
        ) : (
          <RideMessagesList messages={rideMessages} userEmail={user?.email} />
        )}
      </div>
    </div>
  );
}