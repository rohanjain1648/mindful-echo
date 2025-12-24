import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceOrbProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isLoading?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  size?: "sm" | "md" | "lg";
}

export const VoiceOrb = ({
  isListening = false,
  isSpeaking = false,
  isLoading = false,
  onStart,
  onStop,
  size = "lg",
}: VoiceOrbProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const isActive = isListening || isSpeaking;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isActive && (
        <>
          <div className="absolute rounded-full bg-primary/20 animate-voice-pulse" 
            style={{ 
              width: size === "lg" ? "180px" : size === "md" ? "140px" : "100px",
              height: size === "lg" ? "180px" : size === "md" ? "140px" : "100px",
            }} 
          />
          <div className="absolute rounded-full bg-primary/10 animate-voice-pulse" 
            style={{ 
              width: size === "lg" ? "220px" : size === "md" ? "170px" : "120px",
              height: size === "lg" ? "220px" : size === "md" ? "170px" : "120px",
              animationDelay: "0.5s" 
            }} 
          />
        </>
      )}

      {/* Voice waves when speaking */}
      {isSpeaking && (
        <div className="absolute flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary-foreground/80 rounded-full animate-voice-wave"
              style={{
                height: size === "lg" ? "40px" : size === "md" ? "30px" : "20px",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main orb button */}
      <button
        onClick={isActive ? onStop : onStart}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          rounded-full gradient-hero shadow-glow
          flex items-center justify-center
          transition-all duration-300
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          relative z-10
        `}
      >
        {isLoading ? (
          <Loader2 className={`${iconSize[size]} text-primary-foreground animate-spin`} />
        ) : isListening ? (
          <MicOff className={`${iconSize[size]} text-primary-foreground`} />
        ) : (
          <Mic className={`${iconSize[size]} text-primary-foreground`} />
        )}
      </button>

      {/* Status indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-sm font-medium text-muted-foreground">
          {isLoading ? "Connecting..." : isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to start"}
        </span>
      </div>
    </div>
  );
};
