import React, { useEffect, useState } from "react";
import { getAppSettings } from "@/lib/appSettings";

export default function AppBranding({ className = "" }) {
  const [settings, setSettings] = useState({ name: "RideRadar", logo_url: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className={`h-8 w-24 bg-secondary/40 rounded-lg animate-pulse ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {settings.logo_url && (
        <img
          src={settings.logo_url}
          alt={settings.name}
          className="w-6 h-6 rounded-lg object-cover"
        />
      )}
      <span className="font-bold text-sm">{settings.name}</span>
    </div>
  );
}