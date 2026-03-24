import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ fallback = "/" }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all select-none"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}