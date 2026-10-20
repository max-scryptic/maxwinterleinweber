"use client";

import {
  ArrowUpRight,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import eutonix from "@/assets/creative/eutonix.png";
import { FadeImage } from "@/components/fade-image";
import { SoundCloudMark } from "@/components/marks";
import styles from "@/components/music-player.module.css";
import type { Track } from "@/lib/music";

/*
 * The music: Max's own songs, played from files on this site rather than
 * through SoundCloud's player, so that the whole of it is drawn here and every
 * button on it works on a phone. A phone will only start sound from a tap on
 * the page that is making it; with the audio element on this page rather than
 * inside someone else's frame, every play button here is that.
 *
 * One audio element plays everything, and the song it is holding is changed by
 * hand in the same press that plays it, not after a render: a phone counts a
 * play as the visitor's only while it is still inside the tap.
 *
 * The songs are listed in public/music/tracks.json; see the README beside it.
 */

const soundCloudOrange = "#ff5500";

// How far into a song "previous" restarts it rather than going back a song,
// which is what every music player does.
const RESTART_AFTER = 3;

function clock(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "-:--";
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** A song's cover, or the eutonix avatar for a song without one. */
function Cover({
  track,
  size,
  className = "",
  children,
}: {
  track: Track;
  /** The largest the cover is ever shown at, in CSS pixels. */
  size: number;
  className?: string;
  /** Anything laid over the cover, such as a play button. */
  children?: ReactNode;
}) {
  // The slot is the page's quiet grey until the cover fades up into it. The
  // near-black is the cover's own, behind the art and fading with it, since
  // some of the artwork is drawn partly see-through on black.
  return (
    <span
      className={`relative block shrink-0 overflow-hidden bg-muted ${className}`}
    >
      <FadeImage
        src={track.cover ?? eutonix}
        alt=""
        fill
        sizes={`${size}px`}
        className="bg-neutral-900 object-cover"
      />
      {children}
    </span>
  );
}

// The three bars that stand in for a song's number while it plays.
function Bars() {
  return (
    <span aria-hidden="true" className={styles.bars}>
      <span />
      <span />
      <span />
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-full transition focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none ${className}`}
    >
      {children}
    </button>
  );
}

export function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const panel = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);

  // Which song the audio element is holding, if any yet. Kept beside the
  // element rather than in state because it is set in the same press that
  // plays it, before any render.
  const loaded = useRef<number | null>(null);

  // The song on show, whether it is playing, and how far into it.
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  // How long each song is, as the files report it, and null until they have.
  const [durations, setDurations] = useState<(number | null)[]>(() =>
    tracks.map(() => null),
  );

  function setDuration(at: number, seconds: number) {
    if (!Number.isFinite(seconds)) return;
    setDurations((current) =>
      current[at] === seconds
        ? current
        : current.map((value, i) => (i === at ? seconds : value)),
    );
  }

  // Whether anything has played yet, whether the card is on screen, and
  // whether the visitor has closed the bar. Playing again opens it.
  const [started, setStarted] = useState(false);
  const [panelInView, setPanelInView] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /*
   * Plays a song: the one already loaded from where it is, or another from its
   * start. The source is swapped and play is called in the same breath, inside
   * whatever press got here, for the reason at the top of this file.
   */
  function start(at: number) {
    const element = audio.current;
    if (!element || !tracks[at]) return;

    if (loaded.current !== at) {
      loaded.current = at;
      element.src = tracks[at].src;
      setIndex(at);
      setTime(0);
    }

    void element.play().catch(() => setPlaying(false));
  }

  function pause() {
    audio.current?.pause();
  }

  function toggle() {
    if (playing) pause();
    else start(index);
  }

  function next() {
    start((index + 1) % tracks.length);
  }

  function previous() {
    const element = audio.current;
    if (element && loaded.current === index && element.currentTime > RESTART_AFTER) {
      element.currentTime = 0;
      setTime(0);
      if (element.paused) start(index);
      return;
    }
    start((index - 1 + tracks.length) % tracks.length);
  }

  function seek(seconds: number) {
    const element = audio.current;
    if (!element || loaded.current !== index) return;
    element.currentTime = seconds;
    setTime(seconds);
  }

  function close() {
    pause();
    setDismissed(true);
  }

  /*
   * How long the other songs are, for the list, before any of them is played.
   * Each is asked for its metadata alone, which is the first few kilobytes of
   * the file, and only once the card is getting close: nobody at the top of
   * the page is downloading songs they may never scroll down to.
   */
  useEffect(() => {
    const element = panel.current;
    if (!element || tracks.length === 0) return;

    const probes: HTMLAudioElement[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        tracks.forEach((track, at) => {
          const probe = new Audio();
          probe.preload = "metadata";
          probe.onloadedmetadata = () => {
            setDuration(at, probe.duration);
            probe.removeAttribute("src");
            probe.load();
          };
          probe.src = track.src;
          probes.push(probe);
        });
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      for (const probe of probes) {
        probe.onloadedmetadata = null;
        probe.removeAttribute("src");
        probe.load();
      }
    };
  }, [tracks]);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) =>
      setPanelInView(entry.isIntersecting),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /*
   * The phone's lock screen and the keyboard's media keys, through the Media
   * Session API: the song, its cover, and play, pause, next and previous. The
   * handlers are registered once and reach the current versions of the
   * functions above through a ref, which is refreshed after every render.
   */
  const actions = useRef({ start, pause, next, previous, index });
  useEffect(() => {
    actions.current = { start, pause, next, previous, index };
  });

  useEffect(() => {
    if (!("mediaSession" in navigator) || tracks.length === 0) return;

    const session = navigator.mediaSession;
    const handlers: [MediaSessionAction, () => void][] = [
      ["play", () => actions.current.start(actions.current.index)],
      ["pause", () => actions.current.pause()],
      ["nexttrack", () => actions.current.next()],
      ["previoustrack", () => actions.current.previous()],
    ];
    for (const [action, handler] of handlers) {
      session.setActionHandler(action, handler);
    }

    return () => {
      for (const [action] of handlers) session.setActionHandler(action, null);
    };
  }, [tracks.length]);

  const track = tracks[index];

  useEffect(() => {
    if (!started || !track || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: "eutonix",
      artwork: [
        {
          src: new URL(track.cover ?? eutonix.src, window.location.href).href,
        },
      ],
    });
  }, [started, track]);

  const duration = durations[index] ?? null;
  const fill = duration ? Math.min(time / duration, 1) * 100 : 0;
  const barShown = started && !panelInView && !dismissed;

  return (
    <>
      <div
        id="music"
        ref={panel}
        className="scroll-mt-8 overflow-hidden rounded-[0.75rem] border border-border bg-card"
      >
        <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <span className="relative shrink-0 rounded-full bg-muted">
            <FadeImage
              src={eutonix}
              alt=""
              sizes="64px"
              className="size-14 rounded-full object-cover ring-1 ring-black/5 xl:size-16"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full text-white ring-2 ring-card"
              style={{ backgroundColor: soundCloudOrange }}
            >
              <SoundCloudMark className="h-auto w-4" />
            </span>
          </span>

          {/* At least 10rem, so on a phone it is the button that moves onto a
              line of its own rather than the name that is squeezed to fit. */}
          <div className="min-w-40 flex-1">
            <p className="text-lg font-semibold text-foreground">eutonix</p>
            <p className="text-sm text-muted-foreground">
              @eutonix · Music on SoundCloud
            </p>
          </div>

          <a
            href="https://soundcloud.com/eutonix"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none max-sm:w-full"
          >
            Follow on SoundCloud
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 text-faint-foreground transition group-hover:text-foreground"
            />
          </a>
        </div>

        {track ? (
          <>
            {/* The song on show: its cover, its name, the transport and the
                seek bar. Before anything has played it is the first song,
                ready to go. */}
            <div className="flex flex-col gap-5 border-t border-border p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
              <Cover
                track={track}
                size={128}
                className="size-28 self-center rounded-2xl shadow-[0_16px_32px_-18px_rgba(20,16,40,0.6)] sm:size-32 sm:self-auto"
              />

              <div className="min-w-0 flex-1">
                {/* Two lines before it gives up, since a title with a feature
                    and a "free download" on the end is a long one. */}
                <p className="line-clamp-2 text-center text-xl leading-snug font-semibold text-foreground sm:text-left">
                  {track.title}
                </p>
                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  eutonix
                </p>

                <div className="mt-4 flex items-center justify-center gap-3 sm:justify-start">
                  <IconButton
                    label="Previous song"
                    onClick={previous}
                    className="size-10 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <SkipBack aria-hidden="true" className="size-4 fill-current" />
                  </IconButton>
                  <IconButton
                    label={playing ? "Pause" : "Play"}
                    onClick={toggle}
                    className="size-12 bg-primary text-primary-foreground hover:bg-primary/80"
                  >
                    {playing ? (
                      <Pause aria-hidden="true" className="size-5 fill-current" />
                    ) : (
                      <Play
                        aria-hidden="true"
                        className="size-5 translate-x-px fill-current"
                      />
                    )}
                  </IconButton>
                  <IconButton
                    label="Next song"
                    onClick={next}
                    className="size-10 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <SkipForward
                      aria-hidden="true"
                      className="size-4 fill-current"
                    />
                  </IconButton>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                  <span className="w-9 text-right">{clock(time)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration ?? 0}
                    // A second a step, which is what the arrow keys move.
                    step={1}
                    value={Math.min(time, duration ?? 0)}
                    onChange={(event) => seek(Number(event.target.value))}
                    // Nothing to seek through until a song is loaded, and
                    // once one is, it is always the one on show.
                    disabled={!duration || !started}
                    aria-label={`Seek through ${track.title}`}
                    aria-valuetext={`${clock(time)} of ${clock(duration)}`}
                    className={styles.seek}
                    style={{ "--fill": `${fill}%` } as CSSProperties}
                  />
                  <span className="w-9">{clock(duration)}</span>
                </div>
              </div>
            </div>

            {/* Every song, in the order tracks.json lists them. A row plays
                its song, or pauses it if it is the one playing. */}
            <ol className="border-t border-border p-2">
              {tracks.map((song, at) => {
                const current = at === index && started;

                return (
                  <li
                    key={song.src}
                    className={`group/row flex items-center gap-1 rounded-2xl pr-2 transition-colors ${current ? "bg-muted" : "hover:bg-muted/50"}`}
                  >
                    <button
                      type="button"
                      onClick={() => (current ? toggle() : start(at))}
                      aria-label={
                        current && playing
                          ? `Pause ${song.title}`
                          : `Play ${song.title}`
                      }
                      className="group/play flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-2 pl-3 text-left focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
                    >
                      <span className="flex w-5 shrink-0 justify-center text-sm text-faint-foreground tabular-nums">
                        {current && playing ? (
                          <span className="text-foreground">
                            <Bars />
                          </span>
                        ) : (
                          at + 1
                        )}
                      </span>
                      {/* What pressing the row does, over the cover while the
                          pointer is anywhere on the row or the row has the
                          keyboard's focus. Only a pointer that can hover shows
                          it, so a tap on a phone does not leave it stuck on. */}
                      <Cover
                        track={song}
                        size={40}
                        className="size-10 rounded-lg"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/play:opacity-100"
                        >
                          {current && playing ? (
                            <Pause className="size-4 fill-current" />
                          ) : (
                            <Play className="size-4 translate-x-px fill-current" />
                          )}
                        </span>
                      </Cover>
                      <span
                        className={`min-w-0 flex-1 truncate text-[15px] font-medium ${current ? "text-foreground" : "text-subtle-foreground"}`}
                      >
                        {song.title}
                      </span>
                      <span className="shrink-0 text-sm text-faint-foreground tabular-nums">
                        {clock(durations[at])}
                      </span>
                    </button>

                    {song.soundcloud ? (
                      <a
                        href={song.soundcloud}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${song.title} on SoundCloud`}
                        title="Open on SoundCloud"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint-foreground transition hover:bg-card hover:text-[#ff5500] focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
                      >
                        <SoundCloudMark className="h-auto w-5" />
                      </a>
                    ) : (
                      <span aria-hidden="true" className="size-9 shrink-0" />
                    )}
                  </li>
                );
              })}
            </ol>

            {/* The one audio element everything plays through. Nothing is
                fetched for it until the first press, and the source is set
                by hand when a song is chosen rather than through a prop. */}
            <audio
              ref={audio}
              preload="none"
              onPlay={() => {
                setPlaying(true);
                setStarted(true);
                setDismissed(false);
              }}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
              onDurationChange={(event) =>
                setDuration(index, event.currentTarget.duration)
              }
              onEnded={() => {
                // On to the next song, and to a stop after the last.
                if (index < tracks.length - 1) start(index + 1);
                else setPlaying(false);
              }}
              onError={() => setPlaying(false)}
            />
          </>
        ) : null}
      </div>

      {/* The bar that follows the visitor down the page once something has
          played and the card is out of sight. Always in the page, so it can
          fade in and out, and inert while it is hidden so nothing in it can be
          reached by the keyboard or a screen reader. */}
      {track ? (
        <div
          role="region"
          aria-label="Now playing"
          inert={!barShown}
          className={`fixed inset-x-3 bottom-3 z-50 transition duration-300 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[23rem] ${barShown ? "opacity-100 motion-safe:translate-y-0" : "pointer-events-none opacity-0 motion-safe:translate-y-3"}`}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-[0_24px_48px_-20px_rgba(20,16,40,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-3 p-2.5 pr-2">
              <Cover track={track} size={44} className="size-11 rounded-xl" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {track.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">eutonix</p>
              </div>

              <IconButton
                label={playing ? "Pause" : "Play"}
                onClick={toggle}
                className="size-10 bg-primary text-primary-foreground hover:bg-primary/80"
              >
                {playing ? (
                  <Pause aria-hidden="true" className="size-4 fill-current" />
                ) : (
                  <Play
                    aria-hidden="true"
                    className="size-4 translate-x-px fill-current"
                  />
                )}
              </IconButton>

              <a
                href="#music"
                aria-label="Show the player"
                title="Show the player"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
              >
                <ListMusic aria-hidden="true" className="size-4" />
              </a>

              <IconButton
                label="Stop and close"
                onClick={close}
                className="size-9 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden="true" className="size-4" />
              </IconButton>
            </div>

            {/* How far through the song it is, along the bottom edge. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 bg-muted"
            >
              <span
                className="block h-full origin-left bg-foreground transition-transform duration-300 ease-linear"
                style={{ transform: `scaleX(${fill / 100})` }}
              />
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
