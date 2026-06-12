import React, { useEffect, useRef } from "react";
import { LyricSection } from "../types";

interface LyricCanvasProps {
  lyricSections: LyricSection[];
  currentTimeSeconds: number;
  onLineClick?: (timestamp: number) => void;
}

export const LyricCanvas: React.FC<LyricCanvasProps> = ({
  lyricSections,
  currentTimeSeconds,
  onLineClick,
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Automatically scroll to active lyrics as song progresses (karaoke-style visual focus)
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const activeElement = activeLineRef.current;
      const container = containerRef.current;
      
      const elementOffset = activeElement.offsetTop;
      const elementHeight = activeElement.offsetHeight;
      const containerHeight = container.offsetHeight;
      
      container.scrollTo({
        top: elementOffset - containerHeight / 2 + elementHeight / 2,
        behavior: "smooth",
      });
    }
  }, [currentTimeSeconds]);

  // Check if a specific timestamp matches the active line being played
  const isLineActive = (
    sectionIdx: number,
    lineIdx: number,
    globalTimestamps: number[]
  ) => {
    const elapsed = currentTimeSeconds;
    // Map section index + line index back to flattened chronological indices across all lines
    const lineStart = globalTimestamps[lineIdx];
    
    // Find absolute next global timestamp to set active time boundary
    let nextStart = 9999;
    
    // Scan later lines in same section
    if (lineIdx < globalTimestamps.length - 1) {
      nextStart = globalTimestamps[lineIdx + 1];
    } else {
      // Look at starting timestamp of subsequent sections
      let foundNext = false;
      for (let s = sectionIdx + 1; s < lyricSections.length; s++) {
        if (lyricSections[s].timestamps && lyricSections[s].timestamps.length > 0) {
          nextStart = lyricSections[s].timestamps[0];
          foundNext = true;
          break;
        }
      }
      if (!foundNext) {
        nextStart = lineStart + 8; // Default 8 second duration for last line
      }
    }
    
    return elapsed >= lineStart && elapsed < nextStart;
  };

  return (
    <div
      id="bronze_frame_container"
      className="relative rounded-2xl border-4 border-[#C5A880] bg-[#1a1512] shadow-2xl overflow-hidden max-w-2xl mx-auto"
      style={{ boxShadow: "0 10px 40px -10px rgba(197, 168, 128, 0.3)" }}
    >
      {/* Decorative filigree and design accents inside the bronze frame */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#C5A880]/40 rounded-tl pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#C5A880]/40 rounded-tr pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#C5A880]/40 rounded-bl pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#C5A880]/40 rounded-br pointer-events-none"></div>

      {/* Header of lyric container */}
      <div className="border-b border-[#C5A880]/20 bg-[#251e19] px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[#C5A880] text-sm font-mono tracking-widest uppercase">📜 Lyric Canvas</span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]/40"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]/10"></span>
        </div>
      </div>

      {/* Main scrollable body */}
      <div
        ref={containerRef}
        className="h-[360px] overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-[#C5A880]/15 scrollbar-track-transparent scroll-smooth"
      >
        {lyricSections && lyricSections.length > 0 ? (
          lyricSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono tracking-widest text-[#C5A880] uppercase bg-[#2e241e] px-2.5 py-0.5 rounded border border-[#C5A880]/20">
                  {section.sectionName}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#C5A880]/30 to-transparent"></div>
              </div>

              {/* Verse lines */}
              <div className="space-y-4 pl-2">
                {section.lines.map((line, lIdx) => {
                  const stamp = section.timestamps[lIdx] ?? 0;
                  const active = isLineActive(sIdx, lIdx, section.timestamps);
                  const chord = section.chords[lIdx] || "";

                  return (
                    <div
                      key={lIdx}
                      ref={active ? activeLineRef : null}
                      id={`lyric-line-${sIdx}-${lIdx}`}
                      onClick={() => onLineClick && onLineClick(stamp)}
                      className={`group relative py-1 px-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        active
                          ? "bg-[#2d2218] border-l-2 border-[#D4AF37] shadow-lg scale-[1.02]"
                          : "hover:bg-[#1f1915]/50 border-l-2 border-transparent"
                      }`}
                    >
                      {/* Guitar Chord Indicator sits elegant above the current line lyrics */}
                      {chord && (
                        <div className="h-6 flex items-end">
                          <span
                            className={`font-mono text-xs font-semibold tracking-wider px-1.5 py-0.5 rounded transition-all duration-300 ${
                              active
                                ? "text-[#D4AF37] bg-[#433122] scale-110"
                                : "text-[#C5A880]/50 group-hover:text-[#C5A880]/80"
                            }`}
                          >
                            {chord}
                          </span>
                        </div>
                      )}

                      {/* Actual Lyric Text */}
                      <p
                        className={`font-sans leading-relaxed tracking-wide transition-all duration-300 text-sm md:text-base ${
                          active
                            ? "text-white font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                            : "text-[#ffffff]/60 group-hover:text-[#ffffff]/85"
                        }`}
                      >
                        {line}
                      </p>

                      {/* Small hover hint for timeline jump */}
                      <span className="absolute right-3 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-mono text-[#C5A880]/40">
                        Jump to {Math.floor(stamp / 60)}:{(stamp % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 font-mono text-sm">
            Strumming up the lyrics... Stand by
          </div>
        )}
      </div>

      {/* Footer statistics context decoration */}
      <div className="bg-[#15110e] px-6 py-2 border-t border-[#C5A880]/10 flex justify-between items-center text-[10px] font-mono text-[#C5A880]/40">
        <span>TUNING: STANDARD EADGBE</span>
        <span>ACID: ACTIVE FREQUENCY</span>
      </div>
    </div>
  );
};
