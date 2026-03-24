import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Users, Plus, X, Check, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import RideChat from "@/components/rides/RideChat";
import DirectMessageChat from "@/components/messages/DirectMessageChat";
import { Input } from "@/components/ui/input";

export default function Messages() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showFriendsTab, setShowFriendsTab] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [addFeedback, setAddFeedback] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch all friendships (accepted + pending)
  const { data: friendships = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.UserFriend.filter({ user_email: user.email });
      const received = await base44.entities.UserFriend.filter({ friend_email: user.email });
      return [...sent, ...received];
    },
    enabled: !!user?.email,
  });

  const acceptedFriendships = friendships.filter((f) => f.status === "accepted");
  const friends = acceptedFriendships.map((f) => ({
    email: f.user_email === user.email ? f.friend_email : f.user_email,
  }));

  // Pending requests SENT TO the current user (they need to accept/decline)
  const pendingRequests = friendships.filter(
    (f) => f.status === "requested" && f.friend_email === user?.email
  );

  // Latest DM per friend
  const { data: latestDMs = [] } = useQuery({
    queryKey: ["latest-dms", friends.map((f) => f.email).join(",")],
    queryFn: async () => {
      if (friends.length === 0) return [];
      const results = await Promise.all(
        friends.map((f) => {
          const cid = [user.email, f.email].sort().join("|");
          return base44.entities.DirectMessage.filter({ conversation_id: cid }, "-created_date", 1);
        })
      );
      return results.flat();
    },
    enabled: friends.length > 0,
    refetchInterval: 10000,
  });

  const handleAddFriend = async () => {
    if (!searchUsername.trim()) return;
    setAddingFriend(true);
    setAddFeedback(null);
    const allUsers = await base44.entities.User.list();
    const foundUser = allUsers.find((u) => u.username?.toLowerCase() === searchUsername.trim().toLowerCase());
    if (!foundUser) {
      setAddFeedback({ type: "error", msg: "User not found" });
      setAddingFriend(false);
      return;
    }
    if (foundUser.email === user.email) {
      setAddFeedback({ type: "error", msg: "That's you!" });
      setAddingFriend(false);
      return;
    }
    // Check for any existing relationship
    const existing = friendships.find(
      (f) => f.user_email === foundUser.email || f.friend_email === foundUser.email
    );
    if (existing) {
      setAddFeedback({ type: "error", msg: existing.status === "accepted" ? "Already friends" : "Request already sent" });
      setAddingFriend(false);
      return;
    }
    await base44.entities.UserFriend.create({
      user_email: user.email,
      friend_email: foundUser.email,
      status: "requested",
    });
    setSearchUsername("");
    setAddFeedback({ type: "success", msg: `Friend request sent to @${foundUser.username}` });
    setAddingFriend(false);
    queryClient.invalidateQueries({ queryKey: ["friends", user.email] });
  };

  const handleAccept = async (friendship) => {
    await base44.entities.UserFriend.update(friendship.id, { status: "accepted" });
    queryClient.invalidateQueries({ queryKey: ["friends", user.email] });
  };

  const handleDecline = async (friendship) => {
    await base44.entities.UserFriend.delete(friendship.id);
    queryClient.invalidateQueries({ queryKey: ["friends", user.email] });
  };

  // Rides where user is a participant or host
  const { data: participations = [] } = useQuery({
    queryKey: ["my-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email, status: "approved" }),
    enabled: !!user?.email,
  });

  const { data: hostedRides = [] } = useQuery({
    queryKey: ["my-hosted-rides", user?.email],
    queryFn: () => base44.entities.Ride.filter({ host_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const participatedRideIds = participations.map((p) => p.ride_id);

  const { data: participatedRides = [] } = useQuery({
    queryKey: ["participated-rides", participatedRideIds.join(",")],
    queryFn: async () => {
      if (participatedRideIds.length === 0) return [];
      const results = await Promise.all(
        participatedRideIds.map((id) => base44.entities.Ride.filter({ id }))
      );
      return results.flat();
    },
    enabled: participatedRideIds.length > 0,
  });

  // Merge hosted + participated, dedupe by id
  const allRides = [...hostedRides, ...participatedRides].reduce((acc, r) => {
    if (!acc.find((x) => x.id === r.id)) acc.push(r);
    return acc;
  }, []).filter((r) => r.status !== "cancelled");

  // Latest message per ride for preview
  const { data: latestMessages = [] } = useQuery({
    queryKey: ["latest-messages", allRides.map((r) => r.id).join(",")],
    queryFn: async () => {
      if (allRides.length === 0) return [];
      const results = await Promise.all(
        allRides.map((r) =>
          base44.entities.RideMessage.filter({ ride_id: r.id }, "-created_date", 1)
        )
      );
      return results.flat();
    },
    enabled: allRides.length > 0,
    refetchInterval: 10000,
  });

  const getLatestMessage = (rideId) => latestMessages.find((m) => m.ride_id === rideId);

  const statusDot = (status) => {
    if (status === "active") return <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>;
    if (status === "meetup") return <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />;
    return <span className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowFriendsTab(false)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              !showFriendsTab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            Rides
          </button>
          <button
            onClick={() => setShowFriendsTab(true)}
            className={`relative text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              showFriendsTab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            Friends {friends.length > 0 && `(${friends.length})`}
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-black text-primary-foreground flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedFriend ? (
          <motion.div
            key="dm-chat"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-[calc(100vh-140px)]"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
              <button
                onClick={() => setSelectedFriend(null)}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg"
              >
                ‹
              </button>
              <div className="flex-1">
                <p className="text-sm font-bold">{selectedFriend.email}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <DirectMessageChat friend={selectedFriend} user={user} />
            </div>
          </motion.div>
        ) : showFriendsTab ? (
          <motion.div
            key="friends-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Add friend form */}
            <div className="px-5 py-4 border-b border-border space-y-2">
             <label className="text-xs text-muted-foreground font-semibold">Add by username</label>
             <div className="flex gap-2">
               <Input
                 value={searchUsername}
                 onChange={(e) => { setSearchUsername(e.target.value); setAddFeedback(null); }}
                 onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                 placeholder="username"
                 className="bg-secondary border-border flex-1 text-sm h-9"
               />
               <button
                 onClick={handleAddFriend}
                 disabled={addingFriend || !searchUsername.trim()}
                 className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
               >
                 {addingFriend ? "..." : <Plus className="w-4 h-4" />}
               </button>
             </div>
             {addFeedback && (
               <p className={`text-xs mt-1 ${addFeedback.type === "error" ? "text-destructive" : "text-primary"}`}>
                 {addFeedback.msg}
               </p>
             )}
             {/* Pending incoming requests */}
             {pendingRequests.length > 0 && (
               <div className="pt-2 space-y-2">
                 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Friend Requests</p>
                 {pendingRequests.map((req) => (
                   <div key={req.id} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                     <p className="text-xs font-semibold">{req.user_email}</p>
                     <div className="flex gap-2">
                       <button onClick={() => handleAccept(req)} className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors">
                         <Check className="w-3 h-3" /> Accept
                       </button>
                       <button onClick={() => handleDecline(req)} className="flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 px-2 py-1 rounded-lg transition-colors">
                         <X className="w-3 h-3" /> Decline
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
            </div>

            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-semibold text-muted-foreground">No friends yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add a friend to start messaging</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {friends.map((friend, i) => {
                  const latest = latestDMs.find((m) => m.recipient_email === friend.email || m.sender_email === friend.email);
                  return (
                    <motion.button
                      key={friend.email}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedFriend(friend)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{friend.email[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{friend.email}</p>
                        {latest && (
                          <p className="text-xs text-muted-foreground truncate">
                            {latest.sender_email === user.email ? "You: " : ""}
                            {latest.text}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : selectedRide ? (
          <motion.div
            key="chat"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-[calc(100vh-140px)]"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
              <button
                onClick={() => setSelectedRide(null)}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-lg"
              >
                ‹
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {statusDot(selectedRide.status)}
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{selectedRide.title}</p>
                  <p className="text-[10px] text-muted-foreground">@{selectedRide.host_username}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <RideChat
                rideId={selectedRide.id}
                user={user}
                canChat={true}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {allRides.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-semibold text-muted-foreground">No ride chats yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Join or host a ride to start chatting</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allRides.map((ride, i) => {
                  const latest = getLatestMessage(ride.id);
                  const isHost = ride.host_email === user?.email;
                  return (
                    <motion.button
                      key={ride.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedRide(ride)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
                    >
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {statusDot(ride.status)}
                          <p className="text-sm font-semibold truncate">{ride.title}</p>
                          {isHost && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">HOST</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {latest
                            ? `@${latest.username}: ${latest.photo_url && !latest.text.includes("📷") ? "📷 Photo" : latest.text}`
                            : "No messages yet"}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right flex-shrink-0">
                        {latest && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(latest.created_date), { addSuffix: false })}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 justify-end text-[10px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {ride.rider_count || 1}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}