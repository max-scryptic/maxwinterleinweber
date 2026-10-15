"use client";

import { ArrowUpRight, ListMusic, Pause, Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import eutonix from "@/assets/creative/eutonix.png";
import { SoundCloudMark } from "@/components/marks";
import { MUSIC_SOURCE, SOUNDCLOUD_PROFILE } from "@/lib/music";

/*
 * The music: SoundCloud's own player, set into a card in the creative section,
 * and a small bar that follows the visitor down the page once something is
 * playing.
 *
 * The player is SoundCloud's rather than one drawn here because of where the
 * first press has to land. A phone will only start sound from a tap on the
 * thing making it, and a tap on this page is not a tap inside SoundCloud's
 * frame: a play button of our own, telling the frame to play, works on a
 * laptop and is silently ignored on an iPhone. So the first play is always a
 * press on SoundCloud's own button, and only once the sound is running does the
 * bar take over pausing and resuming it, which a phone does allow.
 *
 * The bar hears what the player is doing through SoundCloud's widget API, a
 * small script of theirs that talks to the frame. If that script is blocked the
 * player still plays; there is just no bar.
 */

// The few parts of SoundCloud's widget API used here.
type Sound = {
  title?: string;
  permalink_url?: string;
  artwork_url?: string | null;
  user?: { username?: string; avatar_url?: string };
};

type Progress = { relativePosition?: number };

type Widget = {
  bind(event: string, listener: (data: Progress) => void): void;
  unbind(event: string): void;
  play(): void;
  pause(): void;
  getCurrentSound(callback: (sound: Sound | null) => void): void;
};

type WidgetApi = {
  Widget: ((iframe: HTMLIFrameElement) => Widget) & {
    Events: Partial<Record<"PLAY" | "PAUSE" | "FINISH" | "PLAY_PROGRESS", string>>;
  };
};

declare global {
  interface Window {
    SC?: WidgetApi;
  }
}

const WIDGET_API = "https://w.soundcloud.com/player/api.js";

let loading: Promise<WidgetApi> | null = null;

/**
 * Loads the widget API once, however many times it is asked for. A failure is
 * forgotten rather than kept, so a later attempt tries again.
 */
function loadWidgetApi(): Promise<WidgetApi> {
  if (window.SC?.Widget) return Promise.resolve(window.SC);

  loading ??= new Promise<WidgetApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WIDGET_API;
    script.async = true;
    script.onload = () =>
      window.SC?.Widget
        ? resolve(window.SC)
        : reject(new Error("The SoundCloud widget API did not load."));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("The SoundCloud widget API did not load."));
    };
    document.head.appendChild(script);
  });

  return loading;
}

/*
 * Whether the link is one track, which the player shows as a single row, or a
 * list of them (a playlist, or a profile or one of its tabs), which it shows
 * with room for the list underneath.
 */
const LISTS = new Set(["sets", "tracks", "albums", "popular-tracks", "reposts"]);

function isSingleTrack(url: string) {
  const path = new URL(url).pathname.split("/").filter(Boolean);
  return path.length === 2 && !LISTS.has(path[1]);
}

const single = isSingleTrack(MUSIC_SOURCE);
const PLAYER_HEIGHT = single ? 166 : 380;

const soundCloudOrange = "#ff5500";

/*
 * SoundCloud's classic player, in its own orange, with the parts of it that
 * are about SoundCloud rather than the music turned off: no related tracks
 * after the last one, no comments along the waveform, no buy, share or
 * download buttons.
 */
const PLAYER_SRC = `https://w.soundcloud.com/player/?${new URLSearchParams({
  url: MUSIC_SOURCE,
  color: soundCloudOrange,
  auto_play: "false",
  hide_related: "true",
  show_comments: "false",
  show_reposts: "false",
  show_teaser: "false",
  buying: "false",
  sharing: "false",
  download: "false",
  visual: "false",
})}`;

/*
 * The artwork SoundCloud hands over is its 100px size, which is soft at twice
 * the 44px it is shown at on a retina screen. Its sizes are named in the
 * address, so the 200px one is asked for instead.
 */
function artworkOf(sound: Sound | null) {
  const url = sound?.artwork_url ?? sound?.user?.avatar_url;
  return url ? url.replace("-large.", "-t200x200.") : null;
}

export function MusicPlayer() {
  const panel = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const widget = useRef<Widget | null>(null);
  const bar = useRef<HTMLSpanElement>(null);

  /*
   * Whether SoundCloud's player is on the page yet. Not until the card is
   * within a screen or so of being scrolled to: the player is a page of
   * SoundCloud's own, with its scripts and cookies, and a visitor who never
   * scrolls this far should not be loading it. The widget API is fetched first
   * so it is there to hear the player arrive, and the player goes up once it
   * has come, or failed to.
   */
  const [frameOn, setFrameOn] = useState(false);

  // Whether the card itself is on screen, in which case the bar is not needed.
  const [panelInView, setPanelInView] = useState(false);

  // Whether anything has played yet, whether it is playing now, and what it is.
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);

  // Whether the visitor has closed the bar. Playing something again opens it.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadWidgetApi()
          .catch(() => null)
          .finally(() => {
            if (!cancelled) setFrameOn(true);
          });
      },
      { rootMargin: "1000px 0px" },
    );
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) =>
      setPanelInView(entry.isIntersecting),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const iframe = frame.current;
    const api = window.SC;
    if (!frameOn || !iframe || !api?.Widget) return;

    const player = api.Widget(iframe);
    widget.current = player;

    const events = api.Widget.Events;
    const PLAY = events.PLAY ?? "play";
    const PAUSE = events.PAUSE ?? "pause";
    const FINISH = events.FINISH ?? "finish";
    const PROGRESS = events.PLAY_PROGRESS ?? "playProgress";

    player.bind(PLAY, () => {
      setStarted(true);
      setPlaying(true);
      setDismissed(false);
      // Asked for on every play rather than once, because a playlist moves
      // on to its next track by playing it.
      player.getCurrentSound((current) => setSound(current));
    });
    player.bind(PAUSE, () => setPlaying(false));
    player.bind(FINISH, () => setPlaying(false));

    // Several times a second, so it is written straight onto the bar rather
    // than through React.
    player.bind(PROGRESS, ({ relativePosition = 0 }) => {
      if (bar.current) {
        bar.current.style.transform = `scaleX(${relativePosition})`;
      }
    });

    return () => {
      for (const event of [PLAY, PAUSE, FINISH, PROGRESS]) {
        player.unbind(event);
      }
      widget.current = null;
    };
  }, [frameOn]);

  function toggle() {
    const player = widget.current;
    if (!player) return;
    if (playing) player.pause();
    else player.play();
  }

  function close() {
    widget.current?.pause();
    setDismissed(true);
  }

  // The bar is for when the player is out of sight: once something has played,
  // and the card is scrolled away, and the visitor has not closed it.
  const barShown = started && !panelInView && !dismissed;

  const title = sound?.title ?? "eutonix";
  const artist = sound?.user?.username ?? "eutonix";
  const artwork = artworkOf(sound);

  return (
    <>
      <div
        id="music"
        ref={panel}
        className="scroll-mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white"
      >
        <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <span className="relative shrink-0">
            <Image
              src={eutonix}
              alt=""
              placeholder="blur"
              sizes="64px"
              className="size-14 rounded-full object-cover ring-1 ring-black/5 xl:size-16"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full text-white ring-2 ring-white"
              style={{ backgroundColor: soundCloudOrange }}
            >
              <SoundCloudMark className="h-auto w-4" />
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-neutral-900">eutonix</p>
            <p className="text-sm text-neutral-500">
              @eutonix · Music on SoundCloud
            </p>
          </div>

          <a
            href={SOUNDCLOUD_PROFILE}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Follow on SoundCloud
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 text-neutral-400 transition group-hover:text-neutral-900"
            />
          </a>
        </div>

        {/* The player's slot, held at the player's height from the start so
            the page does not jump when it arrives. What is in it until then
            is a quiet stand-in, which the player paints over. */}
        <div
          className="relative border-t border-neutral-200 bg-neutral-50"
          style={{ height: PLAYER_HEIGHT }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-300">
            <SoundCloudMark className="h-auto w-12" />
            <span className="text-sm text-neutral-400">Loading player</span>
          </div>

          {frameOn ? (
            <iframe
              ref={frame}
              src={PLAYER_SRC}
              title="eutonix on SoundCloud"
              allow="autoplay; encrypted-media"
              className="absolute inset-0 h-full w-full"
            />
          ) : null}
        </div>
      </div>

      {/* The bar. Always in the page, so it can fade in and out rather than
          appear and vanish, and inert while it is hidden so nothing in it can
          be reached by the keyboard or a screen reader. */}
      <div
        role="region"
        aria-label="Now playing"
        inert={!barShown}
        className={`fixed inset-x-3 bottom-3 z-50 transition duration-300 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[23rem] ${barShown ? "opacity-100 motion-safe:translate-y-0" : "pointer-events-none opacity-0 motion-safe:translate-y-3"}`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 shadow-[0_24px_48px_-20px_rgba(20,16,40,0.4)] backdrop-blur-xl">
          <div className="flex items-center gap-3 p-2.5 pr-2">
            {artwork ? (
              // SoundCloud's own artwork, from its own servers and at whatever
              // size it names, so it is left as a plain image rather than put
              // through the image optimiser.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artwork}
                alt=""
                className="size-11 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <Image
                src={eutonix}
                alt=""
                sizes="44px"
                className="size-11 shrink-0 rounded-xl object-cover"
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {title}
              </p>
              <p className="truncate text-xs text-neutral-500">{artist}</p>
            </div>

            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {playing ? (
                <Pause aria-hidden="true" className="size-4 fill-current" />
              ) : (
                <Play
                  aria-hidden="true"
                  className="size-4 translate-x-px fill-current"
                />
              )}
            </button>

            <a
              href="#music"
              aria-label="Show the player"
              title="Show the player"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
            >
              <ListMusic aria-hidden="true" className="size-4" />
            </a>

            <button
              type="button"
              onClick={close}
              aria-label="Stop and close"
              title="Stop and close"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          {/* How far through the track it is, along the bottom edge. */}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-100">
            <span
              ref={bar}
              className="block h-full origin-left"
              style={{ backgroundColor: soundCloudOrange, transform: "scaleX(0)" }}
            />
          </span>
        </div>
      </div>
    </>
  );
}
