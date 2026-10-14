import { useEffect, useRef, useState } from 'react';
import { PcmPlaybackQueue } from '../audio/PcmPlaybackQueue';
import { OttiMark } from '../character/otti/OttiMark';
import { getCharacterDefinition } from '../character/registry';
import { loadPublishedCharacter } from '../content/client';
import { GeminiLiveTransport } from '../live/GeminiLiveTransport';
import { useI18n } from '../i18n/LocaleProvider';

function pcmSampleRate(mimeType: string) {
  return Number(mimeType.match(/rate=(\d+)/i)?.[1] || 24000);
}

/** Otti narrates authored text through Gemini Live, on user gesture (no mic). */
export function PracticeOttiNarrator({ instruction, message, purpose } : {
  instruction: string; message: string; purpose: 'briefing' | 'review';
}) {
  const { locale } = useI18n();
  const [state, setState] = useState<'idle' | 'connecting' | 'playing' | 'error'>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const transport = useRef<GeminiLiveTransport | null>(null);
  const playback = useRef<PcmPlaybackQueue | null>(null);
  const version = useRef(0);

  async function stop() {
    version.current++;
    transport.current?.close();
    transport.current = null;
    await playback.current?.close();
    playback.current = null;
    setState('idle');
  }

  async function play() {
    if (transport.current || state === 'connecting') {
      await stop();
      return;
    }
    const current = ++version.current;
    setState('connecting');
    setError('');
    setText('');
    const queue = new PcmPlaybackQueue({
      onSpeechStart: () => { if (current === version.current) setState('playing'); },
      onTurnComplete: () => { if (current === version.current) { transport.current?.close(); transport.current = null; setState('idle'); } },
    });
    playback.current = queue;
    try {
      // Autoplay security: unlock on the explicit button gesture, before awaits.
      await queue.unlock();
      const live = new GeminiLiveTransport({
        onStatus: () => undefined,
        onInputTranscript: () => undefined,
        onOutputTranscript: (piece) => {
          if (current !== version.current) return;
          queue.pushTranscript(piece);
          setText((old) => old && !piece.startsWith(old) ? old + ' ' + piece : piece);
        },
        onAudio: (data, mimeType) => { if (current === version.current) void queue.enqueue(data, pcmSampleRate(mimeType)); },
        onInterrupted: () => { if (current === version.current) queue.interrupt(); },
        onTurnComplete: () => { if (current === version.current) queue.markTurnComplete(); },
        onError: () => { if (current === version.current) { setError(locale === 'ar' ? 'صوت Otti مش متاح حاليًا. تقدر تكمل من غيره.' : 'Otti voice is unavailable. You can continue.'); setState('error'); } },
      });
      transport.current = live;
      const character = await loadPublishedCharacter(getCharacterDefinition('otti'));
      if (current !== version.current) return;
      await live.connect(instruction, { voiceName: character.content.voiceName ?? undefined, disableInputTranscription: true });
      if (current !== version.current) return;
      live.sendText(message);
    } catch {
      if (current !== version.current) return;
      setError(locale === 'ar' ? 'معرفناش نشغل صوت Otti. تقدر تكمل عادي.' : 'Could not play Otti. You can continue.');
      transport.current?.close();
      transport.current = null;
      await playback.current?.close();
      playback.current = null;
      setState('error');
    }
  }

  useEffect(() => () => {
    version.current++;
    transport.current?.close();
    void playback.current?.close();
  }, []);

  return (
    <section className="practice-otti-narrator" aria-label={purpose === 'briefing' ? 'Otti introduction' : 'Otti review'}>
      <div className="practice-otti-narrator-head">
        <OttiMark />
        <div>
          <strong>Otti</strong>
          <small>{purpose === 'briefing' ? (locale === 'ar' ? 'هيحضّرك ويسمعك نموذج' : 'Your spoken introduction and example') :
            (locale === 'ar' ? 'هيشرحلك الملاحظات بصوته' : 'Your spoken feedback')}</small>
        </div>
      </div>
      <button type="button" onClick={() => void play()} aria-pressed={state === 'playing'}>
        {state === 'connecting' ? (locale === 'ar' ? 'بيجهز الصوت… اضغط للإلغاء' : 'Preparing voice… tap to cancel') :
          state === 'playing' ? (locale === 'ar' ? 'إيقاف صوت Otti' : 'Stop Otti') :
          state === 'error' ? (locale === 'ar' ? 'حاول تشغيل الصوت تاني' : 'Try Otti again') :
          (locale === 'ar' ? 'اسمع Otti' : 'Listen to Otti')}
      </button>
      {text ? <p className="practice-otti-subtitles" dir="auto" aria-live="off">{text}</p> : null}
      {error ? <p className="practice-coach-status" role="alert">{error}</p> : null}
    </section>
  );
}
