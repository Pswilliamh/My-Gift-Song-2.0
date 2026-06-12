export type SetType = "quick" | "full" | "extended" | "premium" | "legacy";

export interface LyricSection {
  sectionName: string; // e.g. "Intro", "Verse 1", "Chorus", "Verse 2", "Outro"
  lines: string[];
  chords: string[]; // Chords corresponding to each line or the general section flow
  timestamps: number[]; // Approximate starting time (in seconds) for each line in the track
}

export interface SongData {
  id: string;
  title: string;
  target: string;
  context: string;
  setType: SetType;
  tempo: string; // e.g., "Fast Tempo", "Cozy Upbeat", "Acoustic Ballad"
  genre: string; // e.g., "Acoustic Folk", "Ethereal Lute", "Golden Country"
  artistIntro: string; // Warm verbal dedication response by the AI Avatar
  lyricSections: LyricSection[];
  totalDurationSeconds: number; // e.g. 60 or 120
  introAudioBase64?: string; // Optional real-time generated TTS intro
}

export interface CreateSongRequest {
  target: string;
  context: string;
  setType: SetType;
  genre?: string;
}

export interface CreateSongResponse {
  success: boolean;
  song: SongData;
  variations?: SongData[]; // If extended is selected
}
