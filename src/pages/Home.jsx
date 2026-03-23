import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import HomeHeader from "../components/home/HomeHeader";
import StatsBar from "../components/home/StatsBar";
import MiniMap from "../components/home/MiniMap";
import RidePreviewCard from "../components/rides/RidePreviewCard";
import CreateRideButton from "../components/rides/CreateRideButton";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        console.log("User fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ["rides-home"],
    queryFn: () => base44.entities.Ride.filter(
      { status: { $in: ["meetup", "active"] } },
      "-created_date",
      50
    ),
    enabled: !loading,
  });

  const activeRides = rides.filter((r) => r.status === "active");
  const meetupRides = rides.filter((r) => r.status === "meetup");
  const allVisibleRides = [...activeRides, ...meetupRides];

  // Estimate total riders on grid from ride data
  const totalRiders = rides.reduce((acc, r) => acc + (r.rider_count || 1), 0);

  if (loading || ridesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-muted-foreground">Loading RideRadar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HomeHeader username={user?.username} user={user} />
      <StatsBar
        totalRiders={totalRiders}
        activeRides={activeRides.length}
        meetups={meetupRides.length}
      />
      <MiniMap rides={allVisibleRides} />

      <div className="px-5 py-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Riding Now */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <h2 className="text-xs font-semibold tracking-tight">Riding Now</h2>
              {activeRides.length > 0 && (
                <span className="text-[10px] text-muted-foreground ml-auto">{activeRides.length}</span>
              )}
            </div>
            {activeRides.length === 0 ? (
              <div className="bg-secondary/30 rounded-xl p-4 text-center border border-dashed border-border h-28 flex items-center justify-center">
                <p className="text-[11px] text-muted-foreground">No active rides right now. Start one!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRides.map((ride, i) => (
                  <RidePreviewCard key={ride.id} ride={ride} index={i} user={user} />
                ))}
              </div>
            )}
          </div>

          {/* Happening Soon */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <h2 className="text-xs font-semibold tracking-tight">Happening Soon</h2>
              {meetupRides.length > 0 && (
                <span className="text-[10px] text-muted-foreground ml-auto">{meetupRides.length}</span>
              )}
            </div>
            {meetupRides.length === 0 ? (
              <div className="bg-secondary/30 rounded-xl p-4 text-center border border-dashed border-border h-28 flex items-center justify-center">
                <p className="text-[11px] text-muted-foreground">No upcoming meetups. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
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