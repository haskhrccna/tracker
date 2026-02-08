import { useState, useRef, useCallback } from 'react';
import { SURAH_NUMBERS } from '../utils/constants';

const QURAN_AUDIO_BASE = 'https://api.quran.com/api/v4';
const RECITER_ID = 7; // Mishary Rashid Alafasy

export function useAudio() {
  const [playing, setPlaying] = useState(null); // surah name currently playing
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const playSurah = useCallback(async (surahName) => {
    const surahNum = SURAH_NUMBERS[surahName];
    if (!surahNum) return;

    // If same surah is playing, pause it
    if (playing === surahName && audioRef.current) {
      audioRef.current.pause();
      setPlaying(null);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLoading(true);
    try {
      // Fetch audio file URL from Quran.com API
      const res = await fetch(
        `${QURAN_AUDIO_BASE}/chapter_recitations/${RECITER_ID}/${surahNum}`
      );
      const data = await res.json();
      const audioUrl = data?.audio_file?.audio_url;

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setPlaying(null);
        };

        audio.onerror = () => {
          setPlaying(null);
          setLoading(false);
        };

        audio.oncanplay = () => {
          setLoading(false);
        };

        await audio.play();
        setPlaying(surahName);
      }
    } catch (err) {
      console.error('Audio error:', err);
      setLoading(false);
    }
  }, [playing]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(null);
  }, []);

  return { playing, loading, playSurah, stop };
}
