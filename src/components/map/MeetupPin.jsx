import React, { memo, useEffect, useMemo, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { describeRideDistance } from "@/lib/mapMarkerA11y";

function createMeetupIcon(checkedIn, total, isStartingSoon) {
  const bgColor = isStartingSoon ? "rgb(var(--marker-amber))" : "rgb(var(--marker-blue))";
  const glowColor = isStartingSoon ? "var(--marker-amber-glow)" : "var(--marker-blue-glow)";
  const borderColor = isStartingSoon ? "rgb(var(--marker-amber-border))" : "rgb(var(--marker-blue-border))";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position:relative;width:44px;height:44px">
        <div style="position:absolute;inset:0;border-radius:50%;background:${bgColor};opacity:0.2;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;transform:scale(1.4)" aria-hidden="true"></div>
        <div style="width:44px;height:44px;background:${bgColor};border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid ${borderColor};box-shadow:0 0 18px ${glowColor};position:relative;flex-direction:column" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${total > 0 ? `<div style="position:absolute;top:-6px;right:-6px;background:rgb(0,240,50);color:#000;border-radius:999px;font-size:11px;font-weight:800;padding:1px 5px;border:2px solid #000;min-width:16px;text-align:center">${checkedIn}/${total}</div>` : ""}
        </div>
      </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

const MeetupPin = memo(
  function MeetupPin({ ride, participants, onClick, userPosition }) {
    const markerRef = useRef(null);
    const approved = participants.filter((participant) => participant.status === "approved");
    const checkedIn = participants.filter((participant) => participant.status === "approved" && participant.checked_in).length;
    const startTime = new Date(ride.start_time);
    const minsUntil = (startTime - Date.now()) / 60000;
    const isStartingSoon = minsUntil <= 30 && minsUntil > -5;
    const proximityLabel = describeRideDistance(userPosition, ride.meetup_lat, ride.meetup_lng);
    const accessibleLabel = `${ride.title}. ${isStartingSoon ? "Meetup starting soon" : "Meetup open"}. ${checkedIn} of ${approved.length} approved riders checked in.${proximityLabel ? ` ${proximityLabel}.` : ""}`;

    const handlers = useMemo(() => ({ click: onClick }), [onClick]);
    const icon = useMemo(() => createMeetupIcon(checkedIn, approved.length, isStartingSoon), [checkedIn, approved.length, isStartingSoon]);

    useEffect(() => {
      const markerElement = markerRef.current?.getElement();
      if (!markerElement) return;
      markerElement.setAttribute("role", "button");
      markerElement.setAttribute("tabindex", "0");
      markerElement.setAttribute("aria-label", accessibleLabel);
    }, [accessibleLabel]);

    return (
      <Marker
        ref={markerRef}
        position={[ride.meetup_lat, ride.meetup_lng]}
        icon={icon}
        eventHandlers={handlers}
        alt={accessibleLabel}
      />
    );
  },
  (prevProps, nextProps) => {
    const prevCheckedIn = prevProps.participants.filter((participant) => participant.checked_in).length;
    const nextCheckedIn = nextProps.participants.filter((participant) => participant.checked_in).length;

    return (
      prevProps.ride.id === nextProps.ride.id &&
      prevProps.participants.length === nextProps.participants.length &&
      prevCheckedIn === nextCheckedIn &&
      prevProps.onClick === nextProps.onClick &&
      prevProps.userPosition?.lat === nextProps.userPosition?.lat &&
      prevProps.userPosition?.lng === nextProps.userPosition?.lng
    );
  }
);

MeetupPin.displayName = "MeetupPin";

export default MeetupPin;