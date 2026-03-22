import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RideCard from "../components/rides/RideCard";
import CreateRideButton from "../components/rides/CreateRideButton";
import EventCalendar from "../components/rides/EventCalendar";
import EventRSVPCard from "../components/rides/EventRSVPCard";

export default function Rides() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allRides = [], refetch: refetchRides } = useQuery({
    queryKey: ["all-rides"],
    queryFn: () => base44.entities.Ride.list("-created_date", 100),
  });

  const { scrollContainerRef, handlers } = usePullToRefresh(() => refetchRides());

  const { data: myParticipations = [] } = useQuery({
    queryKey: ["my-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myRideIds = new Set(myParticipations.map((p) => p.ride_id));
  const myRides = allRides.filter((r) => r.host_email === user?.email || myRideIds.has(r.id));

  const activeRides = allRides.filter((r) => r.status === "active" || r.status === "meetup");
  const pastRides = allRides.filter((r) => r.status === "completed" || r.status === "cancelled");
  const plannedEvents = allRides.filter((r) => r.ride_type === "planned_event");

  // Get RSVPs for planned events
  const { data: allParticipants = [] } = useQuery({
    queryKey: ["event-participants", plannedEvents.map(e => e.id).join(",")],
    queryFn: async () => {
      if (plannedEvents.length === 0) return [];
      const results = await Promise.all(
        plannedEvents.map((e) => base44.entities.RideParticipant.filter({ ride_id: e.id }))
      );
      return results.flat();
    },
    enabled: plannedEvents.length > 0,
  });

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen pb-24"
      {...handlers}
    >
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-lg font-bold">Rides</h1>
        <p className="text-xs text-muted-foreground">Browse or manage your rides</p>
      </div>

      <Tabs defaultValue="active" className="px-5">
        <TabsList className="w-full bg-secondary/60 p-1 rounded-xl mb-4">
          <TabsTrigger value="active" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card">
            Active ({activeRides.length})
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
          {activeRides.length === 0 ? (
            <EmptyState text="No active rides right now" />
          ) : (
            <div className="space-y-3">
              {activeRides.map((r, i) => <RideCard key={r.id} ride={r} index={i} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events">
          <div className="space-y-4">
            <EventCalendar plannedEvents={plannedEvents} onSelectDate={setSelectedDate} selectedDate={selectedDate} />
            {plannedEvents.length === 0 ? (
              <EmptyState text="No planned events scheduled" />
            ) : (
              <div className="space-y-3">
                {plannedEvents
                  .filter((e) => !selectedDate || new Date(e.start_time).toDateString() === selectedDate.toDateString())
                  .map((e) => {
                    const participant = allParticipants.find(
                      (p) => p.ride_id === e.id && p.user_email === user?.email
                    );
                    return (
                      <EventRSVPCard
                        key={e.id}
                        event={e}
                        user={user}
                        myStatus={participant?.status}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine">
          {myRides.length === 0 ? (
            <EmptyState text="You haven't joined any rides yet" />
          ) : (
            <div className="space-y-3">
              {myRides.map((r, i) => <RideCard key={r.id} ride={r} index={i} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastRides.length === 0 ? (
            <EmptyState text="No past rides" />
          ) : (
            <div className="space-y-3">
              {pastRides.map((r, i) => <RideCard key={r.id} ride={r} index={i} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateRideButton />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-secondary/30 rounded-2xl p-8 text-center border border-dashed border-border">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}