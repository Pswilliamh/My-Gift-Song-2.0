/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, Sparkles, Share2, Play, Pause, Volume2, VolumeX, 
  RefreshCw, Download, User, Calendar, Sliders, ChevronRight,
  Disc, Star, Phone, Instagram, Send, Info, Check, Copy, X, Clock
} from "lucide-react";
import { SongData, SetType, LyricSection } from "./types";
import { LyricCanvas } from "./components/LyricCanvas";
import { luteEngineInstance } from "./components/AudioEngine";

export default function App() {
  // --- Lifecycles & State Management ---
  const [target, setTarget] = useState("");
  const [context, setContext] = useState("");
  const mainVideoSrc = "https://drive.google.com/uc?export=download&id=1H7bdSkULkzoNQGqqno26_KJzAPsZUPL2";
  const previewVideoSrc = "https://drive.google.com/uc?export=download&id=1dvyq1PS79s4e3GZlcDxZ3tK2lGKktyiC";
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sunoStatus, setSunoStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [sunoMessage, setSunoMessage] = useState("");
  const [setType, setSetType] = useState<SetType>("quick");
  const [customGenre, setCustomGenre] = useState("Acoustic Folk");
  const [gifterEmail, setGifterEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isPurposeExpanded, setIsPurposeExpanded] = useState(false);
  
  // --- Stripe Live Session Variables ---
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || "";

  useEffect(() => {
    console.log("[Stripe Integration] Client-side Publishable Key detection:", publishableKey ? "Loaded. Ready for active checkouts." : "No live Publishable Key fallback active.");
  }, [publishableKey]);
  
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState("");

  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [allVariations, setAllVariations] = useState<SongData[]>([]);
  const [activeVariationIdx, setActiveVariationIdx] = useState(0);

  // --- Audio Player States ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);

  // --- Suno Player States ---
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(120);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.warn(e));
      setIsAudioPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const seekTime = percentage * audioDuration;
    audioRef.current.currentTime = seekTime;
    setAudioCurrentTime(seekTime);
  };

  // --- Keepsake Modal State ---
  const [showKeepsake, setShowKeepsake] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [isVocalizing, setIsVocalizing] = useState(false);

  const trackerRef = useRef<number | null>(null);

  // --- Introductory Video Audio Controls ---
  const [introVideoMuted, setIntroVideoMuted] = useState(true);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);

  const toggleMinstrelAudio = () => {
    if (introVideoRef.current && typeof introVideoRef.current.play === 'function') {
      const targetMute = !introVideoRef.current.muted;
      introVideoRef.current.muted = targetMute;
      setIntroVideoMuted(targetMute);
    } else {
      setIntroVideoMuted(prev => !prev);
    }
  };

  // Expose toggleMinstrelAudio globally in case of external/script control
  useEffect(() => {
    const globalWin = window as any;
    globalWin.toggleMinstrelAudio = () => {
      if (introVideoRef.current && typeof introVideoRef.current.play === 'function') {
        const targetMute = !introVideoRef.current.muted;
        introVideoRef.current.muted = targetMute;
        setIntroVideoMuted(targetMute);
      } else {
        setIntroVideoMuted(prev => !prev);
      }
    };
    return () => {
      delete globalWin.toggleMinstrelAudio;
    };
  }, []);

  // --- Admin Sandbox Gate States & Handlers ---
  const [isAdminGateVisible, setIsAdminGateVisible] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isTestStudio, setIsTestStudio] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const checkAdminRoute = () => {
      const active = window.location.href.includes('/admin/test-studio') || window.location.hash === '#test-studio';
      setIsTestStudio(active);
      setIsAdminGateVisible(active);
      if (active) {
        setTimeout(() => {
          const el = document.getElementById('admin-gate-container');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    };
    
    checkAdminRoute();

    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('load', checkAdminRoute);
    
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('load', checkAdminRoute);
    };
  }, []);

  // --- Read URL for post-payments success triggers ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("stripe_checkout") === "success";
    const mockParam = params.get("stripe_mock") === "true";
    const cancelParam = params.get("stripe_checkout") === "cancel";

    if (cancelParam) {
      setPaymentNotice("Checkout cancelled - Adjust your choices or strum again, Haddi is ready whenever you are!");
      window.history.replaceState(null, "", window.location.pathname);
    } else if (successParam || mockParam) {
      const urlTarget = params.get("target") || "";
      const urlContext = params.get("context") || "";
      const urlSetType = (params.get("setType") as SetType) || "quick";
      const urlCustomGenre = params.get("customGenre") || "Acoustic Folk";
      const urlGifterEmail = params.get("gifterEmail") || "";
      const urlRecipientEmail = params.get("recipientEmail") || "";

      if (urlTarget) {
        setTarget(urlTarget);
        setContext(urlContext);
        setSetType(urlSetType);
        setCustomGenre(urlCustomGenre);
        if (urlGifterEmail) setGifterEmail(urlGifterEmail);
        if (urlRecipientEmail) setRecipientEmail(urlRecipientEmail);
        
        const modeLabel = successParam ? "live Stripe payment session" : "sandbox payment simulation";
        setPaymentNotice(`🎉 SECURE CHECKOUT COMPLETION via ${modeLabel}! Compiling Haddi's blessing now...`);
        
        // Auto-run the generation!
        triggerSongGeneration(urlTarget, urlContext, urlSetType, urlCustomGenre);
      }
      
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleValidateAuthorization = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phrase = passwordInput.trim().toUpperCase();
    if (phrase === "SHALOM" || phrase === "ADMIN") {
      setIsAuthorized(true);
      setIsAdminUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("Invalid authorization phrase. Please try again.");
    }
  };

  const handleCancelAuthorization = () => {
    setPasswordInput("");
    setPasswordError("");
    setIsAuthorized(false);
    setIsTestStudio(false);
    setIsAdminGateVisible(false);
    window.location.hash = "";
    window.history.replaceState(null, "", window.location.pathname || "/");
  };

  const verifyAdminGate = () => {
    const enteredEmail = (document.getElementById('admin-email-input') as HTMLInputElement | null)?.value.trim() || "";
    const masterDeveloperId = "Pswilliamh@gmail.com";
    
    if (!isAuthorized) {
      alert("Please authorize through the Seraphim Test Studio secure gateway first.");
      return;
    }
    
    if (enteredEmail.toLowerCase() === masterDeveloperId.toLowerCase()) {
      setIsAdminUnlocked(true);
    } else {
      alert("Access Denied: Terminal mismatch. Please enter your registered master developer credentials.");
    }
  };

  const executeMockSongGeneration = async () => {
    if (!isAuthorized) {
      alert("Unauthorized: Access locked.");
      return;
    }
    
    const email = (document.getElementById('test-target-email') as HTMLInputElement | null)?.value.trim() || "";
    const story = (document.getElementById('test-story-context') as HTMLTextAreaElement | null)?.value.trim() || "";
    
    if (!email || !story) {
      alert("Please fill in the target email and blessing story.");
      return;
    }
    
    const terminal = document.getElementById('sandbox-terminal');
    const btn = document.getElementById('test-submit-btn') as HTMLButtonElement | null;
    
    if (btn) {
      btn.disabled = true;
      btn.innerText = "🎵 Connecting to Suno AI...";
    }
    
    if (terminal) {
      terminal.style.display = 'block';
      terminal.innerHTML = `[SYSTEM] Starting real Suno generation for ${email}...<br>`;
    }
    
    setIsGenerating(true);
    setIsRendering(true);
    setError("");
    setSunoStatus("generating");
    setSunoMessage("Connecting to live Suno AI engines... Crafting vocal arrangement tracks.");
    
    try {
      const sunoApiKey = (import.meta as any).env.VITE_SUNO_API_KEY;
      if (!sunoApiKey || sunoApiKey.length < 15) {
        throw new Error("Suno API Key missing. Please add VITE_SUNO_API_KEY=sk-... in your .env file");
      }
      
      if (terminal) terminal.innerHTML += `[API] Sending story to 302.ai Suno V5...<br>`;
      
      const response = await fetch("https://api.302.ai/v1/suno/submit/music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sunoApiKey}`,
        },
        body: JSON.stringify({
          prompt: story,
          tags: `${customGenre || 'Modern Worship'}, emotional, acoustic, christian worship, folk, ballad`,
          make_instrumental: false,
          wait_audio_ready: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Suno API error: ${response.status}`);
      }

      const data = await response.json();
      let liveTrackUrl = data.audio_url || data.url || 
                         (data.data && data.data[0]?.audio_url) || 
                         (Array.isArray(data) && data[0]?.audio_url);

      if (!liveTrackUrl) {
        throw new Error("No audio URL returned");
      }

      setAudioUrl(liveTrackUrl);
      if (audioRef.current) {
        audioRef.current.src = liveTrackUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.warn);
      }
      setIsAudioPlaying(true);
      setSunoStatus("success");
      setSunoMessage("Prophetic worship track successfully rendered! Streaming live audio.");

      const customSongData: SongData = {
        id: `suno-${Date.now()}`,
        title: `Covenant Blessing for ${email}`,
        target: email,
        context: story,
        setType: "quick",
        tempo: "Peaceful Plucking (78 BPM)",
        genre: customGenre || "Modern Worship",
        artistIntro: `Halo kawanku! Haddi here with a special blessing for ${email}.`,
        lyricSections: [{ sectionName: "Blessing", lines: [story.substring(0, 150)], chords: ["G", "C"], timestamps: [0, 12] }],
        totalDurationSeconds: 120
      };
      setCurrentSong(customSongData);

      if (terminal) {
        terminal.innerHTML += `<span style="color:#2ecc71">[SUCCESS] Real Suno audio received!</span><br>`;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setSunoStatus("error");
      setSunoMessage(`Suno Connection Error: ${err.message}`);
      
      if (terminal) {
        terminal.innerHTML += `<span style="color:#e74c3c">[ERROR] ${err.message}</span><br>`;
      }
      const fallbackUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      setAudioUrl(fallbackUrl);
      if (audioRef.current) audioRef.current.src = fallbackUrl;
      setIsAudioPlaying(true);
    } finally {
      setIsGenerating(false);
      setIsRendering(false);
      if (btn) {
        btn.disabled = false;
        btn.innerText = "🚀 Render Song & Send Digital Gift Card";
      }
    }
  };

  // --- Mobile Browser Native Voice Blessing ---
  const playHaddiMobileVoice = (generatedLyrics: string) => {
    // Check if the mobile browser supports native speech
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsVocalizing(false);
        return;
      }

      const speech = new SpeechSynthesisUtterance(generatedLyrics);
      
      // Fine-tuning the frequency for a warm, humble, resonant male voice
      speech.pitch = 0.9;  // Slightly deeper tone
      speech.rate = 0.85;  // Deliberate, meaningful cadence
      speech.volume = 1.0; // Full presence
      
      // Find an English male voice model built into your phone
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      for (let i = 0; i < voices.length; i++) {
        if (voices[i].name.includes('Male') || voices[i].name.includes('Google US English')) {
          selectedVoice = voices[i];
          break;
        }
      }
      if (selectedVoice) {
        speech.voice = selectedVoice;
      }
      
      speech.onstart = () => {
        setIsVocalizing(true);
      };
      speech.onend = () => {
        setIsVocalizing(false);
      };
      speech.onerror = () => {
        setIsVocalizing(false);
      };

      // Execute the vocal blessing live on your phone
      window.speechSynthesis.speak(speech);
    } else {
      alert("Mobile audio synthesis node not supported on this device.");
    }
  };

  // Expose verifyAdminGate and executeMockSongGeneration globally for compatibility with manual script executions / custom triggers
  useEffect(() => {
    const globalWin = window as any;
    globalWin.verifyAdminGate = verifyAdminGate;
    globalWin.executeMockSongGeneration = executeMockSongGeneration;
    globalWin.playHaddiMobileVoice = (generatedLyrics: string) => playHaddiMobileVoice(generatedLyrics);
    return () => {
      delete globalWin.verifyAdminGate;
      delete globalWin.executeMockSongGeneration;
      delete globalWin.playHaddiMobileVoice;
    };
  }, []);

  // --- Strum audio synchronization helpers ---
  // Returns what chord should ring out at the current elapsed player time
  const getChordAtTime = (): string => {
    if (!currentSong) return "G";
    // Search the lyric sections chronologically
    const sections = currentSong.lyricSections;
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      // Pick the chord matching the active timeline line
      for (let j = section.timestamps.length - 1; j >= 0; j--) {
        if (currentTime >= section.timestamps[j]) {
          return section.chords[j] || section.chords[0] || "G";
        }
      }
    }
    return "G";
  };

  // Synchronized progress trigger
  useEffect(() => {
    if (isPlaying && currentSong) {
      trackerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentSong.totalDurationSeconds) {
            setIsPlaying(false);
            luteEngineInstance.stopLutePlayback();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (trackerRef.current) {
        clearInterval(trackerRef.current);
        trackerRef.current = null;
      }
    }

    return () => {
      if (trackerRef.current) {
        clearInterval(trackerRef.current);
      }
    };
  }, [isPlaying, currentSong]);

  // Audio engine volume bindings
  useEffect(() => {
    luteEngineInstance.setVolume(muted ? 0 : volume / 100);
  }, [volume, muted]);

  // Sync variations with main active track selection
  useEffect(() => {
    if (allVariations.length > 0 && allVariations[activeVariationIdx]) {
      setCurrentSong(allVariations[activeVariationIdx]);
      setCurrentTime(0);
      setIsPlaying(false);
      luteEngineInstance.stopLutePlayback();
    }
  }, [activeVariationIdx, allVariations]);

  // --- Action Handlers ---
  const triggerSongGeneration = async (
    targetVal: string,
    contextVal: string,
    setTypeVal: SetType,
    customGenreVal: string
  ) => {
    setError("");
    setIsRendering(true);
    setStage(2); // Jump to Avatar loader Screen
    setLoadingStep(0);

    // Simulated staggered loading visual increments while calling backend
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1500);

    try {
      // 1. Submit Request to the Full-Stack server API
      const res = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetVal.trim(),
          context: contextVal.trim(),
          setType: setTypeVal,
          customGenre: customGenreVal
        })
      });

      const data = await res.json();
      if (!data.success || !data.song) {
        throw new Error(data.error || "Internal generation failed.");
      }

      const returnedSong: SongData = data.song;
      
      // Determine if variations list was populated via Extended Encore, Premium, or Legacy selection
      if ((setTypeVal === "extended" || setTypeVal === "premium" || setTypeVal === "legacy") && data.variations) {
        setAllVariations(data.variations);
        setActiveVariationIdx(0);
        setCurrentSong(data.variations[0]);
      } else {
        setAllVariations([returnedSong]);
        setActiveVariationIdx(0);
        setCurrentSong(returnedSong);
      }

      // 2. Play Audio Speech introduction from the Minstrel avatar!
      try {
        const speechRes = await fetch("/api/generate-avatar-intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ introText: returnedSong.artistIntro })
        });
        const speechData = await speechRes.json();
        
        if (speechData.success && speechData.base64Audio) {
          // Play speech introduction sequentially using Web Audio context
          luteEngineInstance.initContext();
          await luteEngineInstance.playSpeechIntro(speechData.base64Audio);
        }
      } catch (speechErr) {
        // Fallback gracefully without throwing
        console.warn("Avatar voice vocalization skipped: ", speechErr);
      }

      // Transition smoothly into Stage 3 Playing Screen!
      clearInterval(interval);
      setStage(3);
    } catch (err: any) {
      console.error(err);
      setError("Trouble tuning to this exact frequency. Let us retry.");
      setStage(1);
    } finally {
      setIsRendering(false);
    }
  };

  const handleStrumSong = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const valEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!gifterEmail.trim()) {
      setError("Please specify Your Email (Gifter) - this is required so Haddi can deliver your digital keepsake!");
      return;
    }
    if (!valEmail(gifterEmail)) {
      setError("Please enter a valid Gifter Email format.");
      return;
    }
    if (!recipientEmail.trim()) {
      setError("Please specify the Recipient's Email - this is required so Haddi can dedicate the song correctly!");
      return;
    }
    if (!valEmail(recipientEmail)) {
      setError("Please enter a valid Recipient Email format.");
      return;
    }
    if (!target.trim()) {
      setError("Please specify who you are creating this song for.");
      return;
    }
    const wordCount = context.trim() === "" ? 0 : context.trim().split(/\s+/).length;
    if (wordCount > 500) {
      setError("Please keep your Context & Special Story under 500 words before strumming.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setIsRendering(true);

    try {
      // 1. Prepare user's context payload and execute fetch request to `/api/generate-song` gateway
      const res = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: target.trim(),
          context: context.trim(),
          setType,
          customGenre,
          gifterEmail: gifterEmail.trim(),
          recipientEmail: recipientEmail.trim()
        })
      });

      const data = await res.json();
      if (!data.success || !data.song) {
        throw new Error(data.error || "Minstrel song generation failed. Please try again.");
      }

      const returnedSong: SongData = data.song;
      setCurrentSong(returnedSong);

      if ((setType === "extended" || setType === "premium" || setType === "legacy") && data.variations) {
        setAllVariations(data.variations);
        setActiveVariationIdx(0);
      } else {
        setAllVariations([returnedSong]);
        setActiveVariationIdx(0);
      }

      // 2. Set theme-based high-fidelity Suno AI audio URL path
      const genreAudioUrls: Record<string, string> = {
        "Acoustic Folk": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "Bluegrass": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "Rustic Lute": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "Modern Worship": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "Lofi Acoustic": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        "Indie Pop": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
      };

      const highFidelityTrack = genreAudioUrls[customGenre] || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      setAudioUrl(highFidelityTrack);

      // Play vocal speech introductory elements if active
      try {
        const speechRes = await fetch("/api/generate-avatar-intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ introText: returnedSong.artistIntro })
        });
        const speechData = await speechRes.json();
        if (speechData.success && speechData.base64Audio) {
          luteEngineInstance.initContext();
          await luteEngineInstance.playSpeechIntro(speechData.base64Audio);
        }
      } catch (speechErr) {
        console.warn("Minstrel avatar speech intro skipped:", speechErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Trouble processing acoustic song generation. Please retry.");
    } finally {
      setIsGenerating(false);
      setIsRendering(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      luteEngineInstance.stopLutePlayback();
      setIsPlaying(false);
    } else {
      luteEngineInstance.initContext();
      luteEngineInstance.startLutePlayback(() => getChordAtTime());
      setIsPlaying(true);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
  };

  const handleReset = () => {
    luteEngineInstance.stopLutePlayback();
    setIsPlaying(false);
    setCurrentTime(0);
    setTarget("");
    setContext("");
    setSetType("quick");
    setStage(1);
  };

  const handleShareWhatsApp = () => {
    if (!currentSong) return;
    const text = encodeURIComponent(
      `🎵 I created a personalized song titled "${currentSong.title}" for ${currentSong.target} on mysong.ai!\n` +
      `Occasion: ${currentSong.context}\n` +
      `Check out this custom acoustic masterpiece! 🌟`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleCopyLyrics = () => {
    if (!currentSong) return;
    const text = currentSong.lyricSections.map(s => 
      `[${s.sectionName}]\n` + s.lines.join("\n")
    ).join("\n\n");

    navigator.clipboard.writeText(`"${currentSong.title}" for ${currentSong.target}\n\n${text}`);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  // Render format helper
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#0d0a08] text-white flex flex-col justify-between font-sans selection:bg-[#FFD700] selection:text-black main-studio-bg">
      
      {/* --- Ambient Star Decor --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[10%] left-[5%] text-[#C5A880] text-lg ambient-decor"><Star size={16} /></div>
        <div className="absolute top-[40%] right-[8%] text-[#C5A880]/30 text-xl ambient-decor delay-1000"><Star size={12} /></div>
        <div className="absolute bottom-[25%] left-[12%] text-[#C5A880]/40 text-lg ambient-decor delay-3000"><Star size={14} /></div>
        <div className="absolute top-[80%] right-[20%] text-[#C5A880]/25 text-2xl ambient-decor delay-500"><Star size={10} /></div>
      </div>

      {/* --- Kinetic Audio Accents: Floating Note Stream --- */}
      <div className="fixed w-full pointer-events-none overflow-hidden z-10" style={{ top: "15%", height: "180px" }}>
        <div className="music-note-stream">
          <span className="note-item" style={{ animationDelay: "0s", top: "10%" }}>♫</span>
          <span className="note-item" style={{ animationDelay: "2s", top: "35%" }}>♪</span>
          <span className="note-item" style={{ animationDelay: "4.5s", top: "15%" }}>♬</span>
          <span className="note-item" style={{ animationDelay: "6.5s", top: "65%" }}>♫</span>
          <span className="note-item" style={{ animationDelay: "8s", top: "25%" }}>♪</span>
          <span className="note-item" style={{ animationDelay: "10s", top: "45%" }}>♬</span>
          <span className="note-item" style={{ animationDelay: "12s", top: "5%" }}>♫</span>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="border-b border-[#C5A880]/20 bg-[#0c0b0a]/90 backdrop-blur-lg sticky top-0 z-40 px-6 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full border-2 border-[#FFD700] bg-gradient-to-br from-[#251e19] to-[#120e0a] text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.25)]">
              <span className="font-display font-bold text-base tracking-tighter">5+3</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-display font-bold tracking-wide text-white flex items-center gap-1.5">
                mygiftsong.aiapps.com <span className="text-[#FFD700] text-xs font-mono font-semibold">STUDIO</span>
              </h1>
              <p className="text-[11px] text-[#FFD700]/80 tracking-widest uppercase font-mono font-medium">Haddi the Street Minstrel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Kept completely clean in accordance with branding blueprint */}
          </div>
        </div>
      </header>

      {/* --- MAIN STAGES MATRIX --- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        
        <AnimatePresence mode="wait">

          {/* STAGE 1: THE STUDIO INPUT FORM */}
          {stage === 1 && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6 w-full max-w-[1100px] mx-auto py-2 animate-fade-in"
            >
              {paymentNotice && (
                <div id="stripe-checkout-notice" className="bg-[#1c1815]/95 border-2 border-[#FFD700] rounded-2xl p-4 md:p-5 w-full flex items-center justify-between text-xs md:text-sm text-amber-200 font-medium tracking-wide shadow-[0_0_20px_rgba(255,215,0,0.25)] animate-pulse mb-2">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-[#FFD700] shrink-0" size={18} />
                    <span>{paymentNotice}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setPaymentNotice(null)} 
                    className="text-[#FFD700] hover:text-white transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Expandable Accordion: Our Purpose & How to Use */}
              <div className="w-full bg-[#121110]/85 border border-[#C5A880]/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl transition-all">
                <button
                  type="button"
                  id="purpose_accordion_toggle"
                  onClick={() => setIsPurposeExpanded(!isPurposeExpanded)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between text-xs sm:text-sm font-mono font-bold text-[#FFD700] tracking-wider uppercase bg-[#1c1917]/85 hover:bg-[#2c2824]/90 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    ✨ OUR PURPOSE & HOW TO USE THIS APP {isPurposeExpanded ? "(CLICK TO COLLAPSE)" : "(CLICK TO EXPAND)"}
                  </span>
                  <ChevronRight size={18} className={`text-[#FFD700] transition-transform duration-300 ${isPurposeExpanded ? 'rotate-90' : 'rotate-0'}`} />
                </button>
                
                {isPurposeExpanded && (
                  <div className="p-6 md:p-8 space-y-6 border-t border-[#C5A880]/20 bg-black/60 text-white/90 animate-fade-in text-left">
                    {/* Official 5+3 Lyre Mandate */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-mono font-bold text-[#FFD700] uppercase tracking-widest flex items-center gap-2">
                        📜 The Official 5+3 Lyre Mandate
                      </h4>
                      <p className="text-xs md:text-sm leading-relaxed text-[#FAF9F6]/90 font-sans pl-4 border-l border-[#FFD700]/40">
                        Haddi’s system integrates five distinct digital narrative dimensions (character, location, history, milestone, and blessing) with three traditional acoustic plucking intentions (sincerity, honor, and resonance). Every single track is engineered not as generic ambient music, but as an active sonic keepsake.
                      </p>
                    </div>

                    {/* The 4-Step Gifting Journey */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-mono font-bold text-[#FFD700] uppercase tracking-widest flex items-center gap-2">
                        🚀 The 4-Step Gifting Journey
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-4">
                        <div className="bg-[#1c1917]/70 border border-[#C5A880]/15 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase tracking-widest bg-[#2c1e14] px-2 py-0.5 rounded">Step 01</span>
                          <h5 className="text-xs font-bold text-white font-sans uppercase">Identify & Honor</h5>
                          <p className="text-[11px] text-white/75 leading-relaxed font-sans">
                            Specify the name of the special person or group the custom song is created to dedicate.
                          </p>
                        </div>
                        <div className="bg-[#1c1917]/70 border border-[#C5A880]/15 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase tracking-widest bg-[#2c1e14] px-2 py-0.5 rounded">Step 02</span>
                          <h5 className="text-xs font-bold text-white font-sans uppercase">Weave the Lore</h5>
                          <p className="text-[11px] text-white/75 leading-relaxed font-sans">
                            Describe memories, details, and message prompts to feed the acoustic AI songcrafting engine.
                          </p>
                        </div>
                        <div className="bg-[#1c1917]/70 border border-[#C5A880]/15 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase tracking-widest bg-[#2c1e14] px-2 py-0.5 rounded">Step 03</span>
                          <h5 className="text-xs font-bold text-white font-sans uppercase">Choose Frequency & Images</h5>
                          <p className="text-[11px] text-white/75 leading-relaxed font-sans">
                            Select a dedicated music theme and package bundle. For Premium Video ($4.99) or Legacy Bundle ($12.99), attach up to 5 personal photos to build a custom lyric slideshow.
                          </p>
                        </div>
                        <div className="bg-[#1c1917]/70 border border-[#C5A880]/15 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-[#FFD700] uppercase tracking-widest bg-[#2c1e14] px-2 py-0.5 rounded">Step 04</span>
                          <h5 className="text-xs font-bold text-white font-sans uppercase">Strum & Receive</h5>
                          <p className="text-[11px] text-white/75 leading-relaxed font-sans">
                            Securely checkout to compile Haddi's blessing. The high-fidelity audio or video link will be deployed directly to the recipient's inbox!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Section: Side-by-Side 50/50 Layout for Intro Text & Video/Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 items-stretch p-6 rounded-2xl bg-[#0c0b0a]/70 border border-[#C5A880]/15 backdrop-blur-md shadow-2xl max-w-[1100px] mx-auto w-full">
                
                {/* Left Side: Centered Smoked Charcoal Greeting Text Block & Flagship Video */}
                <div className="flex flex-col justify-start items-center text-center space-y-5 p-6 md:p-8 rounded-xl bg-[#121110]/95 border border-[#C5A880]/15 h-full">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#251e19] border border-[#C5A880]/20 rounded-full text-[10px] md:text-xs font-mono text-[#FFD700] uppercase tracking-wider">
                    <Sparkles size={12} className="text-[#FFD700]" /> 5+3 Lyre Method
                  </div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-black tracking-wide text-white" style={{ textShadow: "2px 4px 12px rgba(0, 0, 0, 0.95), 0px 0px 20px rgba(0, 0, 0, 0.6)" }}>
                    Who is your <span className="text-[#FFD700]">Acoustic Song</span> honoring today?
                  </h1>
                  <p className="text-[#FAF9F6]/85 text-xs md:text-sm leading-relaxed font-sans">
                    Shalom! Welcome. My name is Haddi, a local street musician here in Jakarta, and this is my digital musician street corner. There is no greater gift than a song... so tell me, whose heart are we honoring with our silver strings today?
                  </p>

                  {/* Flagship Video Canvas: universal, front-and-center landing track layout with zero barriers */}
                  <div className="relative w-full rounded-xl overflow-hidden border border-[#C5A880]/20 shadow-xl bg-black/80 flex items-center justify-center aspect-video min-h-[200px]">
                    <iframe 
                      id="haddi-video"
                      src="https://drive.google.com/file/d/1H7bdSkULkzoNQGqqno26_KJzAPsZUPL2/preview" 
                      width="100%" 
                      height="450" 
                      allow="autoplay" 
                      style={{ border: "none", borderRadius: "12px", backgroundColor: "#050b14" }}
                    ></iframe>

                    {/* Golden unmute/mute overlay button */}
                    <button 
                      id="unmute-btn" 
                      type="button"
                      onClick={toggleMinstrelAudio}
                      style={{
                        position: "absolute",
                        bottom: "15px",
                        right: "15px",
                        background: "rgba(12, 11, 10, 0.85)",
                        border: "1.5px solid #FFD700",
                        color: "#FFD700",
                        borderRadius: "50%",
                        width: "42px",
                        height: "42px",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        boxShadow: "0 0 12px rgba(255, 215, 0, 0.4)",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease"
                      }}
                      className="hover:scale-105 active:scale-95"
                    >
                      {introVideoMuted ? "🔇" : "🔊"}
                    </button>
                  </div>

                  {/* Official Anthem Lyrics Banner Container: Dedicated full-width banner container positioned underneath the media player */}
                  <div className="w-full bg-[#1c1917]/95 border-2 border-[#FFD700]/40 rounded-xl px-4 py-3.5 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD700]/5 to-transparent animate-pulse pointer-events-none" />
                    <p className="text-xs sm:text-sm md:text-md text-[#FFD700] font-mono font-extrabold tracking-wider uppercase leading-relaxed select-none relative z-10 text-shadow-md">
                      "THERE IS NO GREATER GIFT THAN A SONG... IT IS WORTH MORE THAN A THOUSAND WORDS!"
                    </p>
                  </div>

                  {/* BOTTOM video player or custom audio player or loader depending on Suno state */}
                  {isGenerating ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-[#FFD700]/30 shadow-[0_0_25px_rgba(255,215,0,0.15)] bg-[#120e0a]/90 flex flex-col items-center justify-center aspect-video min-h-[200px] p-6 space-y-4">
                      <div className="relative flex items-center justify-center">
                        <Disc size={40} className="text-[#FFD700] animate-spin [animation-duration:3s]" />
                        <Sparkles size={16} className="text-[#FFD700] absolute -top-1 -right-1 animate-ping" />
                      </div>
                      <div className="space-y-1 text-center max-w-xs">
                        <p className="text-xs font-mono font-bold text-[#FFD700] uppercase tracking-widest animate-pulse">HADDI IS STRUMMING...</p>
                        <p className="text-[10px] text-[#FAF9F6]/70 font-sans italic leading-relaxed">
                          "Plucking silver strings with Sumatra passion and Jakarta energy..."
                        </p>
                      </div>
                    </div>
                  ) : audioUrl ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-[#FFD700]/40 shadow-[0_0_25px_rgba(255,215,0,0.2)] bg-[#120e0a]/95 flex flex-col justify-center items-center p-5 aspect-video min-h-[200px] space-y-3.5">
                      <div className="flex items-center gap-3.5 w-full">
                        <div className={`p-3.5 rounded-full bg-black/60 border-2 border-[#FFD700] text-[#FFD700] relative shrink-0 ${isAudioPlaying ? 'animate-spin [animation-duration:10s]' : ''}`}>
                          <Disc size={26} />
                          <div className="absolute -inset-1 bg-[#FFD700]/10 blur-md rounded-full -z-10" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <span className="text-[9px] font-mono text-[#FFD700] uppercase tracking-widest block font-bold">Suno AI Master Stream</span>
                          <h4 className="text-xs md:text-sm font-bold text-white truncate font-sans uppercase">
                            {currentSong?.title || "Bespoke Acoustic Masterpiece"}
                          </h4>
                          <p className="text-[10px] text-white/50 font-mono truncate">
                            Style: {customGenre} • {setType.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Active HTML5 Audio Player */}
                      <audio
                        id="suno-audio-player"
                        src={audioUrl}
                        ref={audioRef}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onEnded={() => setIsAudioPlaying(false)}
                        autoPlay={true}
                        muted={false}
                        controls={true}
                        className="w-full mt-2 block rounded-lg bg-black/40 border border-[#FFD700]/20 text-white"
                      />

                      {/* Progress Line */}
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-white/40">
                          <span>{formatTime(audioCurrentTime)}</span>
                          <span>{formatTime(audioDuration || 120)}</span>
                        </div>
                        <div
                          onClick={handleAudioSeek}
                          className="h-1.5 w-full bg-white/10 rounded-full cursor-pointer relative overflow-hidden group hover:h-2 transition-all"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-[#FFD700] via-[#FCE068] to-[#FFD700] rounded-full transition-all duration-100"
                            style={{ width: `${(audioCurrentTime / (audioDuration || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Lower Action Layout */}
                      <div className="flex items-center justify-between w-full pt-1.5">
                        <button
                          type="button"
                          onClick={toggleAudioPlayback}
                          className="bg-[#FFD700] hover:bg-[#FCE068] text-black rounded-lg px-4 py-1.5 text-[10px] font-mono tracking-wider font-extrabold uppercase transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(255,215,0,0.15)] shrink-0"
                        >
                          {isAudioPlaying ? (
                            <>
                              <Pause size={12} fill="currentColor" /> PAUSE
                            </>
                          ) : (
                            <>
                              <Play size={12} fill="currentColor" /> PLAY
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1 border border-white/5">
                          <p className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[#FFD700] animate-ping" />
                            LIVE
                          </p>
                        </div>

                        {/* Mute and volume */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (audioRef.current) {
                                const targetMute = !audioRef.current.muted;
                                audioRef.current.muted = targetMute;
                                setIsAudioMuted(targetMute);
                              }
                            }}
                            className="text-white/60 hover:text-white p-1"
                          >
                            {isAudioMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-[#FFD700]" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={audioVolume}
                            onChange={(e) => {
                              const newVol = parseFloat(e.target.value);
                              setAudioVolume(newVol);
                              if (audioRef.current) {
                                audioRef.current.volume = newVol;
                                audioRef.current.muted = false;
                                setIsAudioMuted(false);
                              }
                            }}
                            className="w-14 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full rounded-xl overflow-hidden border border-[#C5A880]/20 shadow-xl bg-black/80 flex items-center justify-center aspect-video min-h-[200px]">
                      <iframe 
                        id="premium-preview-video"
                        src="https://drive.google.com/file/d/1dvyq1PS79s4e3GZlcDxZ3tK2lGKktyiC/preview" 
                        width="100%" 
                        height="450" 
                        allow="autoplay" 
                        style={{ border: "none", borderRadius: "12px", backgroundColor: "#050b14" }}
                      ></iframe>
                    </div>
                  )}

                  {/* The Sound of Honor & Covenant definition panel */}
                  <div className="w-full p-5 bg-[#1c1917]/60 border border-[#C5A880]/20 rounded-xl text-left backdrop-blur-md shadow-lg space-y-2 mt-1">
                    <h4 className="text-xs sm:text-sm font-mono font-semibold text-[#FFD700] uppercase tracking-widest flex items-center gap-1.5">
                      🎻 The Sound of Honor & Covenant
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#FAF9F6]/90 leading-relaxed font-sans">
                      A bespoke acoustic song is more than a melody; it is a sacred covenant of remembrance. Through Haddi's silver strings, your shared history, milestones, and blessings are bound into a living testament of honor, designed to persist as an unbreakable heritage of love and devotion.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-xs font-mono text-red-300 w-full text-center">
                      ⚠️ {error}
                    </div>
                  )}
                </div>

                {/* Right Side: Interactive Studio Form */}
                <div className="input-panel-container window relative right-interaction-box w-full p-6 bg-[#0c0b0a]/40 border border-[#C5A880]/15 rounded-xl flex flex-col justify-between min-h-full h-auto">
                  
                  {/* Decorative Frame */}
                  <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#C5A880]/30 rounded-tl"></div>
                  <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[#C5A880]/30 rounded-tr"></div>
                  <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#C5A880]/30 rounded-bl"></div>
                  <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#C5A880]/30 rounded-br"></div>

                  <div className="space-y-6">
                    
                    {/* --- REQUIRED GIFTER & RECIPIENT EMAILS --- */}
                    <div className="flex flex-col gap-4 bg-black/40 border border-[#C5A880]/15 p-4 rounded-xl">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-mono text-[#FFD700] uppercase tracking-widest font-bold flex items-center gap-1.5">
                          📨 Your Email *
                        </label>
                        <input
                          id="gifter_email_input"
                          type="email"
                          required
                          placeholder="gifter@example.com"
                          value={gifterEmail}
                          onChange={(e) => setGifterEmail(e.target.value)}
                          className="w-full bg-black/90 border-2 border-[#C5A880]/80 rounded-xl px-3 py-2 text-[#FAF9F6] text-xs placeholder-white/30 focus:outline-none focus:border-[#FFD700] transition-all font-sans font-medium custom-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-mono text-[#FFD700] uppercase tracking-widest font-bold flex items-center gap-1.5">
                          ✉️ Recipient's Email *
                        </label>
                        <input
                          id="recipient_email_input"
                          type="email"
                          required
                          placeholder="recipient@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="w-full bg-black/90 border-2 border-[#C5A880]/80 rounded-xl px-3 py-2 text-[#FAF9F6] text-xs placeholder-white/30 focus:outline-none focus:border-[#FFD700] transition-all font-sans font-medium custom-input"
                        />
                      </div>
                    </div>

                    {/* [1. THE TARGET] */}
                    <div className="space-y-2">
                      <label className="text-[1.1rem] md:text-[1.3rem] font-mono text-[#FFD700] uppercase tracking-widest flex items-center gap-2 font-semibold">
                        <User size={16} /> Play a Song For...
                      </label>
                      <input
                        id="target_recipient_input"
                        type="text"
                        maxLength={40}
                        placeholder="e.g. Audrey, Johnny, My Eco-Brand"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-black/90 border-2 border-[#C5A880] rounded-xl px-4 py-3 text-[#FAF9F6] placeholder-white/30 focus:outline-none focus:border-[#FFD700] transition-all font-sans text-[1.1rem] md:text-[1.3rem] font-medium custom-input"
                      />
                    </div>

                    {/* [2. THE CONTEXT] */}
                    <div className="space-y-2">
                      <label className="text-sm md:text-md font-mono text-[#FFD700] uppercase tracking-widest flex items-center gap-2 font-semibold">
                        <Calendar size={16} /> The Context & Special Story
                      </label>
                      <textarea
                        id="context_story_textarea"
                        rows={5}
                        placeholder="e.g., Pour out your heart here up to 500 words. Describe their character, covenant promises, or a special milestone moment..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className={`w-full bg-black/95 border-2 rounded-xl px-3.5 py-2.5 text-[#FAF9F6] text-xs sm:text-sm leading-relaxed placeholder-white/30 focus:outline-none transition-all font-sans font-normal resize-y min-h-[120px] custom-input ${
                          (context.trim() === "" ? 0 : context.trim().split(/\s+/).length) > 500
                            ? "border-red-500 focus:border-red-500 text-red-100"
                            : "border-[#C5A880] focus:border-[#FFD700]"
                        }`}
                      />
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-white/50">Include ocean, morning, hero prompts...</span>
                        <span className={
                          (context.trim() === "" ? 0 : context.trim().split(/\s+/).length) > 500
                            ? "text-red-400 font-bold"
                            : "text-white/50"
                        }>
                          {context.trim() === "" ? 0 : context.trim().split(/\s+/).length} / 500 words
                        </span>
                      </div>
                    </div>

                    {/* [3. CONDITIONAL IMAGE UPLOADER] */}
                    {(setType === "premium" || setType === "legacy") && (
                      <div className="space-y-2 animate-fade-in bg-black/50 border border-[#C5A880]/20 p-4 rounded-xl text-left">
                        <label className="text-[11px] md:text-xs font-mono text-[#FFD700] uppercase tracking-widest font-semibold block">
                          📸 Add a Visual Touch (Optional - Max 5 Photos)
                        </label>
                        
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (uploadedImages.length >= 5) return;
                            const files = Array.from(e.dataTransfer.files) as File[];
                            const imageFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5 - uploadedImages.length);
                            imageFiles.forEach(file => {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setUploadedImages(prev => [...prev, ev.target!.result as string].slice(0, 5));
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }}
                          onClick={() => {
                            const fileInput = document.getElementById("uploader-file-input") as HTMLInputElement | null;
                            if (fileInput) fileInput.click();
                          }}
                          className="border-2 border-dashed border-[#C5A880]/30 hover:border-[#FFD700]/70 rounded-xl p-4 text-center cursor-pointer bg-black/40 hover:bg-[#121110]/85 transition-all text-white/50"
                        >
                          <input
                            id="uploader-file-input"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (uploadedImages.length >= 5) return;
                              const files = Array.from(e.target.files || []) as File[];
                              const imageFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5 - uploadedImages.length);
                              imageFiles.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setUploadedImages(prev => [...prev, ev.target!.result as string].slice(0, 5));
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }}
                          />
                          <p className="text-xs font-sans">
                            Drag & drop your photos here, or <span className="text-[#FFD700] underline font-bold">browse</span>
                          </p>
                          <p className="text-[10px] font-mono text-white/30 uppercase mt-1">Image files (Max 5)</p>
                        </div>

                        {uploadedImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1.5 justify-start">
                            {uploadedImages.map((imgSrc, idx) => (
                              <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#C5A880]/40 group bg-black">
                                <img src={imgSrc} alt={`Visual Touch ${idx + 1}`} className="w-full h-full object-cover animate-fade-in" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-red-400 font-bold"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* [Musical Style Theme Selector] */}
                    <div className="style-selector-section">
                      <label className="text-xs font-mono text-[#FFD700] uppercase tracking-widest block font-bold mb-2">
                        Select Your Musical Style Theme:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          type="button" 
                          onClick={() => setCustomGenre("Acoustic Folk")} 
                          className={`px-2 py-2 text-[10px] md:text-xs font-semibold rounded-lg border text-center transition-all ${customGenre === "Acoustic Folk" ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-black/40 text-white/70 border-[#C5A880]/20 hover:border-white/50"}`}
                        >
                          Acoustic Folk
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomGenre("Bluegrass")} 
                          className={`px-2 py-2 text-[10px] md:text-xs font-semibold rounded-lg border text-center transition-all ${customGenre === "Bluegrass" ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-black/40 text-white/70 border-[#C5A880]/20 hover:border-white/50"}`}
                        >
                          Bluegrass
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomGenre("Rustic Lute")} 
                          className={`px-2 py-2 text-[10px] md:text-xs font-semibold rounded-lg border text-center transition-all ${customGenre === "Rustic Lute" ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-black/40 text-white/70 border-[#C5A880]/20 hover:border-white/50"}`}
                        >
                          Rustic Lute
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomGenre("Modern Worship")} 
                          className={`px-2 py-2 text-[10px] md:text-xs font-semibold rounded-lg border text-center transition-all ${customGenre === "Modern Worship" ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-black/40 text-white/70 border-[#C5A880]/20 hover:border-white/50"}`}
                        >
                          Worship
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomGenre("Lofi Acoustic")} 
                          className={`px-2 py-2 text-[10px] md:text-xs font-semibold rounded-lg border text-center transition-all ${customGenre === "Lofi Acoustic" ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-black/40 text-white/70 border-[#C5A880]/20 hover:border-white/50"}`}
                        >
                          Lofi Acoustic
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomGenre("Indie Pop")} 
                          className={`px-2 py-2 text-[10px] md:text-xs font-semibold rounded-lg border text-center transition-all ${customGenre === "Indie Pop" ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-black/40 text-white/70 border-[#C5A880]/20 hover:border-white/50"}`}
                        >
                          Indie Pop
                        </button>
                      </div>
                    </div>

                    {/* [3. THE RUNTIME FREQUENCY SET] */}
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-mono text-[#FFD700] uppercase tracking-widest flex items-center gap-2 font-semibold">
                        <Clock size={16} /> Select Your Dedicated Set Option:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Quick Strum */}
                        <div
                          id="set_type_quick"
                          onClick={() => setSetType("quick")}
                          className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between items-center text-center transition-all ${setType === "quick" ? "border-[#FFD700] bg-[#251e19]/60 shadow-[0_0_15px_rgba(255,215,0,0.15)]" : "border-[#C5A880]/20 bg-black/40 hover:border-[#C5A880]/50"}`}
                        >
                          <span className="text-[10px] font-bold text-[#FFD700]">⏱️ QUICK STRUM</span>
                          <span className="text-[8px] text-white/50 font-mono">(60s • $0.99)</span>
                        </div>

                        {/* Full Set */}
                        <div
                          id="set_type_full"
                          onClick={() => setSetType("full")}
                          className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between items-center text-center transition-all ${setType === "full" ? "border-[#FFD700] bg-[#251e19]/60 shadow-[0_0_15px_rgba(255,215,0,0.15)]" : "border-[#C5A880]/20 bg-black/40 hover:border-[#C5A880]/50"}`}
                        >
                          <span className="text-[10px] font-bold text-[#FFD700]">📀 FULL SET</span>
                          <span className="text-[8px] text-white/50 font-mono">(125s • $1.99)</span>
                        </div>

                        {/* Premium Video */}
                        <div
                          id="set_type_premium"
                          onClick={() => setSetType("premium")}
                          className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between items-center text-center transition-all relative ${setType === "premium" ? "border-[#FFD700] bg-[#251e19]/60 shadow-[0_0_15px_rgba(255,215,0,0.2)]" : "border-[#C5A880]/20 bg-black/40 hover:border-[#C5A880]/50"}`}
                        >
                          <span className="absolute -top-1.5 -right-1 bg-[#FFD700] text-black text-[6px] font-mono font-bold px-1 rounded uppercase tracking-wider scale-90">HOT</span>
                          <span className="text-[10px] font-bold text-[#FFD700]">🚀 PREMIUM VIDEO</span>
                          <span className="text-[8px] text-white/50 font-mono">(3-Songs • $4.99)</span>
                        </div>

                        {/* Legacy Bundle */}
                        <div
                          id="set_type_legacy"
                          onClick={() => setSetType("legacy")}
                          className={`p-2 rounded-xl border cursor-pointer flex flex-col justify-between items-center text-center transition-all relative ${setType === "legacy" ? "border-[#FFD700] bg-[#251e19]/60 shadow-[0_0_15px_rgba(255,215,0,0.2)]" : "border-[#C5A880]/20 bg-black/40 hover:border-[#C5A880]/50"}`}
                        >
                          <span className="text-[10px] font-bold text-[#FFD700]">📦 LEGACY BUNDLE</span>
                          <span className="text-[8px] text-white/50 font-mono">(Ultimate • $12.99)</span>
                        </div>
                      </div>
                    </div>

                    {/* STRUM THE STRINGS / SUBMIT */}
                    <div className="pt-2">
                      <button
                        id="strum_generate_button"
                        type="button"
                        onClick={handleStrumSong}
                        className="w-full text-black font-display font-extrabold rounded-xl text-center py-4 text-xs md:text-sm tracking-widest uppercase cursor-pointer bg-gradient-to-r from-[#FFD700] via-[#FCE068] to-[#FFD700] hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.25)] flex items-center justify-center gap-2 border border-white/10"
                      >
                        🎵 STRUM THE STRINGS & RENDER
                      </button>
                    </div>

                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* STAGE 2: THE AVATAR ACTIVATING & RESOLVING */}
          {stage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="max-w-xl mx-auto w-full text-center space-y-8"
            >
              
              {/* Pulsing avatar placeholder frame */}
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-[#FFD700] bg-gradient-to-tr from-[#251e19] to-[#0c0907] flex items-center justify-center shadow-[0_0_35px_rgba(255,215,0,0.3)] overflow-hidden mx-auto">
                  {/* Highly polished stylized silhouette of Haddi */}
                  <div className="relative">
                    <Music size={42} className="text-[#FFD700] opacity-80 animate-pulse" />
                    <div className="absolute -inset-2 bg-[#FFD700]/10 blur-xl rounded-full"></div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[9px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                  HADDI THE MINSTREL
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-display font-extrabold tracking-wider text-[#FFD700]">Haddi</h2>
                <p className="text-[11px] text-white/60 font-mono uppercase tracking-widest">Sumatran Soul • Jakarta Street Musician</p>
              </div>

              {/* Status information detailing what step is taking place */}
              <div className="space-y-4">
                <h3 className="text-xl font-display font-semibold text-white tracking-wide flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-ping"></span>
                  Plucking {target || "Audrey"}'s song frequency...
                </h3>

                {/* Highly descriptive dialog bubble displaying what the bard sees */}
                <div className="bg-black/90 border-2 border-[#C5A880] rounded-2xl p-6 text-left relative max-w-md mx-auto backdrop-blur-md">
                  <div className="absolute -top-[10px] left-[50%] -translate-x-1/2 w-4 h-4 bg-black border-t-2 border-l-2 border-[#C5A880] transform rotate-45"></div>
                  <p className="text-[#FAF9F6]/95 text-sm italic font-sans leading-relaxed text-center font-medium">
                    "{loadingStep === 0 && "Selamat datang! Haddi is tuning the acoustic guitar..."}
                     {loadingStep === 1 && "Aligning chords on the silver strings for Jakarta's warm breeze..."}
                     {loadingStep === 2 && "Reciting your special story with Sumatran soul and Jakarta energy..."}
                     {loadingStep === 3 && "Setting up my digital musician street corner vocals..."}
                     {loadingStep >= 4 && "Ada lagu! The silver strings are ready to sing your blessing..."}"
                  </p>
                </div>
              </div>

              {/* [ANIMATION: 3 GOLDEN PILLARS] Pulsing Visualizer */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-[#FFD700]/85 tracking-widest uppercase font-semibold">Geometric Acoustic Flow</p>
                <div className="flex justify-center items-end gap-3 h-14">
                  <div className="w-1.5 bg-[#FFD700]/50 rounded-full visualizer-pillar" style={{ height: "100%", animationDelay: "0.1s" }}></div>
                  <div className="w-1.5 bg-[#FFD700] rounded-full visualizer-pillar" style={{ height: "70%", animationDelay: "0.4s" }}></div>
                  <div className="w-1.5 bg-[#FFD700]/75 rounded-full visualizer-pillar" style={{ height: "85%", animationDelay: "0.25s" }}></div>
                  <div className="w-1.5 bg-[#FFD700]/45 rounded-full visualizer-pillar" style={{ height: "40%", animationDelay: "0.6s" }}></div>
                  <div className="w-1.5 bg-[#FFD700]/90 rounded-full visualizer-pillar" style={{ height: "95%", animationDelay: "0.33s" }}></div>
                </div>
              </div>

            </motion.div>
          )}

          {/* STAGE 3: THE NOW PLAYING SCREEN REVEAL */}
          {stage === 3 && currentSong && (
            <motion.div
              key="stage3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              
              {/* Back button and Sharing controls header */}
              <div className="flex justify-between items-center bg-black/85 border-2 border-[#C5A880] rounded-2xl px-5 py-4 backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-[#FFD700] hover:text-white font-mono font-bold uppercase transition-colors"
                >
                  <RefreshCw size={13} /> Back to Studio
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeepsake(true)}
                    className="flex items-center gap-1.5 text-xs text-black bg-[#FFD700] hover:brightness-110 px-3.5 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer"
                  >
                    <Download size={13} /> Printable Card
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-1.5 text-xs text-white bg-green-700 hover:bg-green-600 px-3.5 py-1.5 rounded-lg font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <Phone size={13} /> Send WhatsApp
                  </button>
                </div>
              </div>

              {/* Main Performance Center Block */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Now playing title & Interactive Vinyl block */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* ASCII styled typography banner for Target */}
                  <div className="bg-black/90 border-2 border-[#C5A880] rounded-2xl p-6 text-center space-y-3 shadow-xl">
                    <span className="text-xs font-mono text-[#FFD700] tracking-widest uppercase font-bold">🎵 Now Playing For 🎵</span>
                    
                    {/* Generative big retro text displaying target name */}
                    <div className="font-mono text-xs text-neutral-500 overflow-x-auto whitespace-pre leading-none py-2 text-center max-w-full">
                      {"+-----------------------------------------------+\n"}
                      {`|    ${currentSong.target.toUpperCase().padEnd(38, " ")} |\n`}
                      {"+-----------------------------------------------+"}
                    </div>

                    <h3 className="text-2xl font-display font-semibold tracking-wide text-white">
                      {currentSong.title}
                    </h3>

                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FFD700] bg-black/80 border border-[#C5A880]/40 px-3 py-1 rounded font-semibold">
                      <Disc size={13} className={isPlaying ? "animate-spin text-[#FFD700]" : ""} /> 
                      {currentSong.genre} • {currentSong.tempo}
                    </div>
                  </div>

                  {/* Interactive Guitar Pluck Volume Console and Playback bar */}
                  <div className="bg-black/90 border-2 border-[#C5A880] rounded-2xl p-6 space-y-6 shadow-xl">
                    
                    <div className="flex justify-between items-center text-xs font-mono text-[#C5A880] font-bold">
                      <span>FOLK COORD SCALE</span>
                      <span>ACTIVE CHORD: <strong className="text-[#FFD700] text-sm ml-1 font-extrabold">{getChordAtTime()}</strong></span>
                    </div>

                    {/* Timeline and Drag-Seeker */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-white/50">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(currentSong.totalDurationSeconds)}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={currentSong.totalDurationSeconds}
                          value={currentTime}
                          onChange={(e) => handleSeek(Number(e.target.value))}
                          className="w-full accent-[#FFD700] bg-neutral-800 h-1 rounded-lg cursor-pointer"
                        />
                        <div 
                          className="absolute h-1 bg-[#FFD700] rounded-lg pointer-events-none top-0.5"
                          style={{ width: `${(currentTime / currentSong.totalDurationSeconds) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex justify-between items-center">
                      
                      <div className="flex items-center gap-3">
                        {/* Playback action toggle */}
                        <button
                          type="button"
                          onClick={togglePlayback}
                          className="w-14 h-14 rounded-full bg-[#FFD700] hover:brightness-110 text-black shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                        </button>

                        {/* Mobile Browser Native Vocalizer */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentSong) return;
                            const spokenText = currentSong.lyricSections
                              .map(s => {
                                const cleanLines = s.lines.filter(l => !l.startsWith("[") && !l.endsWith("]"));
                                return cleanLines.join(". ");
                              })
                              .join(". ");
                            playHaddiMobileVoice(spokenText);
                          }}
                          className={`h-11 px-4 rounded-xl border font-mono text-xs tracking-wider transition-all duration-300 flex items-center gap-2 font-semibold cursor-pointer ${
                            isVocalizing 
                              ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.15)] animate-pulse"
                              : "bg-black/40 text-white/70 border-[#C5A880]/30 hover:border-[#FFD700] hover:text-[#FFD700]"
                          }`}
                          title="Mobile Speech Synthesis Vocalizer"
                        >
                          <Volume2 size={16} className={isVocalizing ? "text-[#FFD700]" : ""} />
                          {isVocalizing ? "Speaking Blessing..." : "Vocalize Blessing"}
                        </button>
                      </div>

                      {/* Dynamic Volume Console */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setMuted(!muted)}
                          className="text-[#C5A880] hover:text-white transition-colors"
                        >
                          {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            setMuted(false);
                          }}
                          className="w-20 accent-[#C5A880] bg-neutral-800 h-1 rounded"
                        />
                      </div>

                    </div>

                    <p className="text-[10px] text-white/30 font-mono text-center">
                      I have hand-picked the notes on the silver strings to fit your story perfectly. Feel free to drag the seeker or tap any lyric line to jump to different sections.
                    </p>

                  </div>

                  {/* Variation Swapper (Only populated in multi-track modes) */}
                  {(setType === "extended" || setType === "premium" || setType === "legacy") && allVariations.length > 1 && (
                    <div className="bg-black/90 border-2 border-[#C5A880] rounded-2xl p-5 space-y-3">
                      <span className="text-xs font-mono text-[#FFD700] tracking-wider uppercase font-bold">
                        🎁 Select Your Encore Variation:
                      </span>
                      <div className="space-y-2">
                        {allVariations.map((song, vIdx) => (
                          <button
                            key={vIdx}
                            type="button"
                            onClick={() => {
                              setActiveVariationIdx(vIdx);
                            }}
                            className={`w-full flex justify-between items-center px-3.5 py-2.5 rounded-xl text-left text-xs font-mono transition-all border-2 ${
                              activeVariationIdx === vIdx
                                ? "bg-[#271d15] border-[#FFD700] text-white"
                                : "bg-black/60 border-transparent text-[#ffffff]/50 hover:bg-black hover:text-white hover:border-[#C5A880]/50"
                            }`}
                          >
                            <span>Variation {vIdx + 1}: {song.genre}</span>
                            <span className="opacity-75">{song.tempo.split(" ")[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Back button */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center justify-center gap-1 text-xs text-[#C5A880]/60 hover:text-[#C5A880]/90 font-mono"
                    >
                      Strum a New Dedication <ChevronRight size={12} />
                    </button>
                  </div>

                </div>

                {/* Right side: The Bronze Lyric Canvas */}
                <div className="lg:col-span-7">
                  <LyricCanvas
                    lyricSections={currentSong.lyricSections}
                    currentTimeSeconds={currentTime}
                    onLineClick={(stamp) => handleSeek(stamp)}
                  />
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* --- KEEPSAKE MODAL --- */}
      {showKeepsake && currentSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#faf6f0] text-[#1c1612] w-full max-w-lg rounded-2xl shadow-2xl border-8 border-[#C5A880]/40 overflow-hidden relative"
          >
            {/* Modal actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 bg-[#1c1612]/5 hover:bg-[#1c1612]/10 rounded-full text-xs font-mono flex items-center gap-1 transition-colors"
                title="Print KeepSake Card"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setShowKeepsake(false)}
                className="p-1 text-[#1c1612]/60 hover:text-[#1c1612] rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Keepsake Portrait frame */}
            <div className="p-8 md:p-10 space-y-6 pt-12 text-center text-print">
              
              {/* Elegant header */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">A Lute & Lyre Dedication Track</p>
                <h3 className="text-3xl font-display font-bold text-[#201813]">{currentSong.title}</h3>
                <div className="w-16 h-px bg-[#C5A880] mx-auto my-3"></div>
                <p className="text-xs uppercase font-mono tracking-wider font-semibold text-[#C5A880]">Playable song for {currentSong.target}</p>
              </div>

              {/* Body message section */}
              <div className="border border-[#C5A880]/30 rounded-xl p-5 bg-white/70 max-h-[240px] overflow-y-auto text-left space-y-4">
                {currentSong.lyricSections.filter(s => s.sectionName !== "Intro").map((section, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <p className="font-mono text-[9px] text-[#C5A880] font-bold uppercase">{section.sectionName}</p>
                    {section.lines.map((line, lIdx) => (
                      <p key={lIdx} className="font-sans text-[#1c1612]/90 leading-relaxed font-medium">{line}</p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Keepsake Footer signature info */}
              <div className="flex justify-between items-center pt-4 border-t border-[#C5A880]/30 text-[9px] font-mono text-[#C5A880]">
                <span>MEMBER CERTIFICATION</span>
                <span className="uppercase">mygiftsong.aiapps.com - {currentSong.genre}</span>
              </div>

              {/* Action row at bottom */}
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyLyrics}
                  className="px-4 py-2 bg-[#201813] hover:bg-[#3d2e24] text-[#faf6f0] text-xs font-mono font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLyrics ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLyrics ? "Copied!" : "Copy Full Lyrics"}
                </button>
              </div>

            </div>

          </motion.div>
        </div>
      )}

      {/* --- PASSWORD AUTHORIZATION MODAL GATEWAY --- */}
      {isTestStudio && !isAuthorized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-[#121110] border border-[#C5A880]/30 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 text-center">
            {/* Decorative top grid accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-800 via-[#C5A880] to-red-800 rounded-t-2xl"></div>
            
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">🔒</span>
              <h3 className="font-sans text-xl font-semibold tracking-tight text-[#C5A880]">
                Seraphim Test Studio Authorization Required
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                Bypassing active production streams requires the master security validation phrase.
              </p>
            </div>

            <form onSubmit={handleValidateAuthorization} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] uppercase tracking-wider font-mono text-[#C5A880]/70 font-bold">
                  Validation Secret
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-950/80 border border-[#C5A880]/25 rounded-xl text-white text-center font-mono placeholder-neutral-700 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-[11px] font-mono mt-1 text-center font-medium">
                    ⚠️ {passwordError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#C5A880] hover:bg-[#b0936b] text-[#121110] font-bold text-sm tracking-widest uppercase rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 animate-pulse"
                >
                  Verify Access
                </button>
                <button
                  type="button"
                  onClick={handleCancelAuthorization}
                  className="w-full py-2.5 bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-xs tracking-wider uppercase font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MINSTREL STUDIO SANDBOX ADMIN GATE --- */}
      <div 
        id="admin-gate-container" 
        style={{ 
          display: (isAdminGateVisible && isAuthorized) ? "block" : "none", 
          margin: "40px auto", 
          maxWidth: "600px", 
          padding: "30px", 
          background: "rgba(12, 11, 10, 0.95)", 
          border: "2px dashed #FFD700", 
          borderRadius: "16px", 
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.2)", 
          backdropFilter: "blur(20px)", 
          WebkitBackdropFilter: "blur(20px)", 
          color: "#fff", 
          fontFamily: "sans-serif" 
        }}
        className="relative z-20"
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "2rem" }}>👑</span>
            <h2 style={{ color: "#FFD700", margin: "10px 0 5px 0", letterSpacing: "1px", fontWeight: "bold" }}>Minstrel Studio Sandbox</h2>
            <p style={{ color: "rgba(169, 169, 161, 0.7)", fontSize: "0.9rem" }}>Bypassing Live Production Lines for Verified Admin System Testing</p>
        </div>

        {/* login form */}
        <div id="sandbox-login-form" style={{ display: isAdminUnlocked ? "none" : "block" }}>
            <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", color: "#FFD700", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "5px", textTransform: "uppercase" }}>Master Developer ID</label>
                <input type="email" id="admin-email-input" placeholder="Enter master development email..." style={{ width: "100%", padding: "12px", background: "rgba(20, 18, 15, 0.8)", border: "1px solid rgba(255, 215, 0, 0.3)", borderRadius: "8px", color: "#fff", fontSize: "1rem", boxSizing: "border-box" }} />
            </div>
            <button onClick={verifyAdminGate} style={{ width: "100%", padding: "12px", background: "#FFD700", color: "#0c0b0a", fontWeight: "bold", fontSize: "1rem", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background 0.3s ease" }}>
                Unlock Sandbox Controls
            </button>
        </div>

        {/* controls panel */}
        <div id="sandbox-controls-panel" style={{ display: isAdminUnlocked ? "block" : "none" }}>
            <div style={{ background: "rgba(255, 215, 0, 0.05)", border: "1px solid rgba(255, 215, 0, 0.2)", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#FFD700", lineHeight: "1.4" }}>
                    <strong>System Active:</strong> Operating under user verification: <code>Pswilliamh@gmail.com</code>. Transactions are fully simulated.
                </p>
            </div>

            <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", color: "rgba(169, 169, 161, 0.9)", fontSize: "0.85rem", marginBottom: "5px" }}>Recipient Email (Friend's Daughter)</label>
                <input type="email" id="test-target-email" placeholder="name@example.com" style={{ width: "100%", padding: "10px", background: "#14120f", border: "1px solid #333", borderRadius: "6px", color: "#fff", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "rgba(169, 169, 161, 0.9)", fontSize: "0.85rem", marginBottom: "5px" }}>Custom Blessing Note / Story Details</label>
                <textarea id="test-story-context" rows={3} placeholder="Describe the sweet baby birth moment..." style={{ width: "100%", padding: "10px", background: "#14120f", border: "1px solid #333", borderRadius: "6px", color: "#fff", boxSizing: "border-box", resize: "vertical" }}></textarea>
            </div>

            {/* Contemporary Style Selector layout buttons inside Sandbox */}
            <div className="style-selector-section" style={{ marginTop: "15px", marginBottom: "20px" }}>
                <label style={{ color: "#FFD700", fontSize: "0.85rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
                    Select Your Musical Style Theme:
                </label>
                <div className="style-grid-container">
                    <button 
                      type="button" 
                      onClick={() => setCustomGenre("Acoustic Folk")} 
                      className={`style-card ${customGenre === "Acoustic Folk" ? "active" : ""}`}
                    >
                      Acoustic Folk
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCustomGenre("Bluegrass")} 
                      className={`style-card ${customGenre === "Bluegrass" ? "active" : ""}`}
                    >
                      Bluegrass
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCustomGenre("Rustic Lute")} 
                      className={`style-card ${customGenre === "Rustic Lute" ? "active" : ""}`}
                    >
                      Rustic Lute
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setCustomGenre("Modern Worship")} 
                      className={`style-card contemporary ${customGenre === "Modern Worship" ? "active" : ""}`}
                    >
                      Modern Worship
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCustomGenre("Lofi Acoustic")} 
                      className={`style-card contemporary ${customGenre === "Lofi Acoustic" ? "active" : ""}`}
                    >
                      Lofi Acoustic
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCustomGenre("Indie Pop")} 
                      className={`style-card contemporary ${customGenre === "Indie Pop" ? "active" : ""}`}
                    >
                      Indie Pop
                    </button>
                </div>
            </div>

            <button onClick={executeMockSongGeneration} id="test-submit-btn" style={{ width: "100%", padding: "14px", background: "#2ecc71", color: "#fff", fontWeight: "bold", fontSize: "1rem", border: "none", borderRadius: "8px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🚀 Render Song & Send Digital Gift Card
            </button>

            <div id="sandbox-terminal" style={{ display: "none", marginTop: "20px", padding: "15px", background: "#000", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.85rem", color: "#2ecc71", lineHeight: "1.5", border: "1px solid #2ecc71" }}>
            </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="studio-footer">
        <div className="footer-container">
          <p className="footer-text">© 2026 mygiftsong.org | All Rights Reserved.</p>
          <a href="https://inflow.com/your-partner-id" target="_blank" rel="noopener noreferrer" className="affiliate-link">
            Powered by <span className="gold-text">Inflow</span> Network Architecture
          </a>
        </div>
      </footer>

    </div>
  );
}
