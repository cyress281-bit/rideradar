import React, { lazy, Suspense, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { mapTileLayerProps } from "@/lib/mapTileConfig";

const MeetupPin = lazy(() => import("@/components/map/MeetupPin"));
const ActiveRiderDot = lazy(() => import("@/components/map/ActiveRiderDot"));
const ActiveRidePin = lazy(() => import("@/components/map/ActiveRidePin"));
const RideRoutePolyline = lazy(() => import("@/components/map/RideRoutePolyline"));
const MarkerClusterGroup = lazy(() => import("@/components/map/MarkerClusterGroup"));

function MapAutoCenter({ rides }) {
  const map = useMap();
  const centered = useRef(false);

  useEffect(() => {
    if (!centered.current && rides.length > 0) {
      map.setView([rides[0].meetup_lat, rides[0].meetup_lng], 12, { animate: true });
      centered.current = true;
    }
  }, [map, rides]);

  return null;
}

export default function LiveGridMap({
  rides,
  clusterMarkers,
  meetupRides,
  activeRides,
  allParticipants,
  trackPoints,
  riderLocations,
  showOtherRiders,
  user,
  onSelectRide,
}) {
  return (
    <MapContainer
      center={[34.05, -118.25]}
      zoom={11}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer {...mapTileLayerProps} />
      <MapAutoCenter rides={rides} />

      <Suspense fallback={null}>
        <MarkerClusterGroup markers={clusterMarkers} />

        {meetupRides.map((ride) => (
          <MeetupPin
            key={ride.id}
            ride={ride}
            participants={allParticipants.filter((p) => p.ride_id === ride.id)}
            onClick={() => onSelectRide(ride)}
          />
        ))}

        {activeRides.map((ride) => (
          <RideRoutePolyline
            key={`route-${ride.id}`}
            trackPoints={trackPoints.filter((tp) => tp.ride_id === ride.id)}
            rideStatus={ride.status}
          />
        ))}

        {activeRides.map((ride) => (
          <ActiveRidePin
            key={`pin-${ride.id}`}
            ride={ride}
            onClick={() => onSelectRide(ride)}
          />
        ))}

        {showOtherRiders && activeRides.map((ride) =>
          riderLocations
            .filter((location) => location.ride_id === ride.id && location.is_active)
            .map((location) => (
              <ActiveRiderDot
                key={location.id}
                location={location}
                isCurrentUser={location.user_email === user?.email}
              />
            ))
        )}
      </Suspense>
    </MapContainer>
  );
}