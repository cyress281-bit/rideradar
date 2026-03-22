import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import HomeHeader from "../components/home/HomeHeader";
import StatsBar from "../components/home/StatsBar";
import MiniMap from "../components/home/MiniMap";
import RideSection from "../components/home/RideSection";
import CreateRideButton from "../components/rides/CreateRideButton";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rides = [] } = useQuery({
    queryKey: ["rides-home"],
    queryFn: () => base44.entities.Ride.filter(
      { status: { $in: ["meetup", "active"] } },
      "-created_date",
      50
    ),
  });

  const activeRides = rides.filter((r) => r.status === "active");
  const meetupRides = rides.filter((r) => r.status === "meetup");
  const allVisibleRides = [...activeRides, ...meetupRides];

  // Estimate total riders on grid from ride data
  const totalRiders = rides.reduce((acc, r) => acc + (r.rider_count || 1), 0);

  return (
    <div className="min-h-screen">
      <HomeHeader username={user?.username} />
      <StatsBar
        totalRiders={totalRiders}
        activeRides={activeRides.length}
        meetups={meetupRides.length}
      />
      <MiniMap rides={allVisibleRides} />

      <RideSection
        title="🔴 Riding Now"
        rides={activeRides}
        emptyText="No active rides right now. Start one!"
      />
      <RideSection
        title="📍 Happening Soon"
        rides={meetupRides}
        emptyText="No upcoming meetups. Be the first!"
      />

      <div className="h-24" />
      <CreateRideButton />
    </div>
  );
}