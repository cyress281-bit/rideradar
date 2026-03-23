import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import HomeHeader from "../components/home/HomeHeader";
import StatsBar from "../components/home/StatsBar";
import MiniMap from "../components/home/MiniMap";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VirtualizedRideList from "../components/rides/VirtualizedRideList";
import EventCalendar from "../components/rides/EventCalendar";
import EventRSVPCard from "../components/rides/EventRSVPCard";


export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const [selectedDate, setSelectedDate] = useState(null);

  const { data: allRides = [], refetch: refetchRides } = useQuery({
    queryKey: ["rides-home"],
    queryFn: () => base44.entities.Ride.list("-created_date", 100),
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ["my-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myRideIds = new Set(myParticipations.map((p) => p.ride_id));
  const myRides = allRides.filter((r) => r.host_email === user?.email || myRideIds.has(r.id));
  const plannedEvents = allRides.filter((r) => r.ride_type === "planned_event");
  const pastRides = allRides.filter((r) => r.status === "completed" || r.status === "cancelled");

  const { data: allParticipants = [] } = useQuery({
    queryKey: ["event-participants", plannedEvents.map(e => e.id).join(",")],
    queryFn: async () => {
      if (plannedEvents.length === 0) return [];
      const results = await Promise.all(plannedEvents.map((e) => base44.entities.RideParticipant.filter({ ride_id: e.id })));
      return results.flat();
    },
    enabled: plannedEvents.length > 0,
  });

  const { scrollContainerRef, progress, isRefreshing, handlers } = usePullToRefresh(() => refetchRides());

  const activeRides = allRides.filter((r) => r.status === "active");
  const meetupRides = allRides.filter((r) => r.status === "meetup");
  const allVisibleRides = [...activeRides, ...meetupRides];

  const totalRiders = allRides.reduce((acc, r) => acc + (r.rider_count || 1), 0);

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

      {/* Rides Section */}
      <div className="px-5 pb-6">
        <h2 className="text-sm font-bold mb-3">All Rides</h2>
        <Tabs defaultValue="active">
          <TabsList className="w-full bg-secondary/60 p-1 rounded-xl mb-4">
            <TabsTrigger value="active" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card">
              Active ({allVisibleRides.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card">
              Events ({plannedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card">
              My Rides ({myRides.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card">
              Past ({pastRides.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <VirtualizedRideList rides={allVisibleRides} emptyText="No active rides right now" />
          </TabsContent>
          <TabsContent value="events">
            <div className="space-y-4">
              <EventCalendar plannedEvents={plannedEvents} onSelectDate={setSelectedDate} selectedDate={selectedDate} />
              {plannedEvents.length === 0 ? (
                <div className="bg-secondary/30 rounded-2xl p-8 text-center border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No planned events scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plannedEvents
                    .filter((e) => !selectedDate || new Date(e.start_time).toDateString() === selectedDate.toDateString())
                    .map((e) => {
                      const participant = allParticipants.find((p) => p.ride_id === e.id && p.user_email === user?.email);
                      return <EventRSVPCard key={e.id} event={e} user={user} myStatus={participant?.status} />;
                    })}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="mine">
            <VirtualizedRideList rides={myRides} emptyText="You haven't joined any rides yet" />
          </TabsContent>
          <TabsContent value="past">
            <VirtualizedRideList rides={pastRides} emptyText="No past rides" />
          </TabsContent>
        </Tabs>
      </div>

      <div className="h-24" />
    </div>
  );
}