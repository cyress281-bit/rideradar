import React from "react";

export default function LiveRegion({ message, politeness = "polite", atomic = true }) {
  return (
    <div
      className="sr-only"
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic={atomic}
    >
      {message}
    </div>
  );
}