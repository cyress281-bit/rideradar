import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Calendar, Clock, MapPin, UserPlus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function FriendsRidesTab({ friendships, user }) {
  const queryClient = useQueryClient();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [joining, setJoining] = useState({});

  // Get unique friend emails
  const friends = friendships.map((f) => (f.user_email === user.email ? f.friend_email : f.user_email));

  // Fetch rides created by all friends
  const { data: friendRides = [] } = useQuery({
    queryKey: ["friends-rides", friends.join(",")],
    queryFn: async () => {
      if (friends.length === 0) return [];
      const results = await Promise.all(
        friends.map((email) =>
          base44.entities.Ride.filter({ host_email: email, status: { $in: ["meetup", "active"] } }, "-created_date", 20)
        )
      );
      return results.flat();
    },
    enabled: friends.length > 0,
    refetchInterval: 15000,
  });

  // Fetch user's participations to check if already joined
  const { data: userParticipations = [] } = useQuery({
    queryKey: ["user-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  const userParticipationRideIds = new Set(userParticipations.map((p) => p.ride_id));

  const handleJoinRide = async (ride) => {
    if (joining[ride.id] || userParticipationRideIds.has(ride.id)) return;
    setJoining((prev) => ({ ...prev, [ride.id]: true }));
    const username = user.username || user.email?.split("@")[0] || "rider";
    await base44.entities.RideParticipant.create({
      ride_id: ride.id,
      user_email: user.email,
      username,
      status: "approved",
      role: "rider",
    });
    await base44.entities.Ride.update(ride.id, { rider_count: (ride.rider_count || 1) + 1 });
    setJoining((prev) => ({ ...prev, [ride.id]: false }));
    queryClient.invalidateQueries({ queryKey: ["user-participations"] });
    queryClient.invalidateQueries({ queryKey: ["friends-rides"] });
  };

  const ridesToDisplay = selectedFriend
    ? friendRides.filter((r) => r.host_email === selectedFriend)
    : friendRides.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Friends list */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-semibold px-2">Select a friend</p>
        <div className="flex gap-2 overflow-x-auto pb-2 px-2">
          {friends.length === 0 ? (
            <p className="text-xs text-muted-foreground">No friends yet</p>
          ) : (
            friends.map((friendEmail) => {
              const isSelected = selectedFriend === friendEmail;
              return (
                <button
                  key={friendEmail}
                  onClick={() => setSelectedFriend(isSelected ? null : friendEmail)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isSelected
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary/60"
                  }`}
                >
                  @{friendEmail.split("@")[0]}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Rides list */}
      <div>
        {ridesToDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">
              {selectedFriend ? "No upcoming rides from this friend" : "No upcoming rides from friends"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ridesToDisplay.map((ride, i) => {
              const isJoined = userParticipationRideIds.has(ride.id);
              const startTime = new Date(ride.start_time);
              const timeLabel = formatDistanceToNow(startTime, { addSuffix: true });

              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-border rounded-xl bg-secondary/30 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{ride.title}</p>
                      <p className="text-[10px] text-muted-foreground">@{ride.host_username}</p>
                    </div>
                    {ride.status === "active" && (
                      <span className="relative flex h-2 w-2 flex-shrink-0 mt-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {ride.rider_count || 1}
                    </span>
                  </div>

                  <button
                    onClick={() => handleJoinRide(ride)}
                    disabled={joining[ride.id] || isJoined}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border ${
                      isJoined
                        ? "bg-green-500/15 text-green-400 border-green-500/20"
                        : "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25"
                    }`}
                  >
                    {isJoined ? (
                      <><Check className="w-3 h-3" /> Joined</>
                    ) : joining[ride.id] ? (
                      "Joining..."
                    ) : (
                      <><UserPlus className="w-3 h-3" /> Join Ride</>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}