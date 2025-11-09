import { useEffect, useState } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
}

const VoiceWaveform = ({ isActive }: VoiceWaveformProps) => {
  const [bars] = useState(Array.from({ length: 40 }, (_, i) => i));

  return (
    <div className="flex items-center justify-center h-32 gap-1">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-1 rounded-full transition-all duration-150 ${
            isActive
              ? "bg-voice-active animate-pulse-slow"
              : "bg-muted"
          }`}
          style={{
            height: isActive 
              ? `${Math.random() * 60 + 20}%`
              : "20%",
            animationDelay: `${bar * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
