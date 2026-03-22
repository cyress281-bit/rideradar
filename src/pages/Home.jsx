import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import HomeHeader from "../components/home/HomeHeader";
import StatsBar from "../components/home/StatsBar";
import MiniMap from "../components/home/MiniMap";
import RideSection from "../components/home/RideSection";
import RidePreviewCard from "../components/rides/RidePreviewCard";
import CreateRideButton from "../components/rides/CreateRideButton";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rides = [], refetch: refetchRides } = useQuery({
    queryKey: ["rides-home"],
    queryFn: () => base44.entities.Ride.filter(
      { status: { $in: ["meetup", "active"] } },
      "-created_date",
      50
    ),
  });

  const { scrollContainerRef, progress, isRefreshing, handlers } = usePullToRefresh(() => refetchRides());

  const activeRides = rides.filter((r) => r.status === "active");
  const meetupRides = rides.filter((r) => r.status === "meetup");
  const allVisibleRides = [...activeRides, ...meetupRides];

  // Estimate total riders on grid from ride data
  const totalRiders = rides.reduce((acc, r) => acc + (r.rider_count || 1), 0);

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen relative"
      {...handlers}
    >
      {/* Pull-to-refresh indicator */}
      {progress > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
            style={{
              rotate: progress * 360,
              opacity: progress,
            }}
          />
        </div>
      )}
      <HomeHeader username={user?.username} />
      <StatsBar
        totalRiders={totalRiders}
        activeRides={activeRides.length}
        meetups={meetupRides.length}
      />
      <MiniMap rides={allVisibleRides} />

      <div className="px-5 py-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Riding Now */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              <h2 className="text-sm font-bold">Riding Now</h2>
              {activeRides.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto bg-primary/10 px-2 py-0.5 rounded-full">{activeRides.length}</span>
              )}
            </div>
            {activeRides.length === 0 ? (
              <div className="bg-secondary/40 rounded-lg p-4 text-center border border-border/50 h-28 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No active rides right now</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeRides.map((ride, i) => (
                  <RidePreviewCard key={ride.id} ride={ride} index={i} user={user} />
                ))}
              </div>
            )}
          </div>

          {/* Happening Soon */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              <h2 className="text-sm font-bold">Happening Soon</h2>
              {meetupRides.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto bg-blue-500/10 px-2 py-0.5 rounded-full">{meetupRides.length}</span>
              )}
            </div>
            {meetupRides.length === 0 ? (
              <div className="bg-secondary/40 rounded-lg p-4 text-center border border-border/50 h-28 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No upcoming meetups</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {meetupRides.map((ride, i) => (
                  <RidePreviewCard key={ride.id} ride={ride} index={i} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-24" />
      <CreateRideButton />
    </div>
  );
}