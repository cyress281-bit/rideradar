import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RideCard from "../components/rides/RideCard";
import CreateRideButton from "../components/rides/CreateRideButton";

export default function Rides() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.Ride.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["all-rides"] });
    });
    return unsub;
  }, [queryClient]);

  const { data: allRides = [] } = useQuery({
    queryKey: ["all-rides"],
    queryFn: () => base44.entities.Ride.list("-created_date", 100),
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ["my-participations", user?.email],
    queryFn: () => base44.entities.RideParticipant.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myRideIds = new Set(myParticipations.map((p) => p.ride_id));
  const myRides = allRides.filter((r) => r.host_email === user?.email || myRideIds.has(r.id));

  const activeRides = allRides.filter((r) => r.status === "active" || r.status === "meetup");
  const pastRides = allRides.filter((r) => r.status === "completed" || r.status === "cancelled");

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-lg font-bold">Rides</h1>
        <p className="text-xs text-muted-foreground">Browse or manage your rides</p>
      </div>

      <Tabs defaultValue="active" className="px-5">
        <TabsList className="w-full bg-secondary/60 p-1 rounded-xl mb-4">
          <TabsTrigger value="active" className="flex-1 rounded-lg text-xs data-[state=active]:bg-card">
            Active ({activeRides.length})
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