import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

/*
 * The music on the page: the SoundCloud profile the music card links to, and
 * the songs the player plays, which are files in public/music listed in that
 * folder's tracks.json. See public/music/README.md for how a song is added.
 *
 * Read on the server, while the page is built, which is what lets a mistake in
 * the list stop the build rather than reach the site as a song that will not
 * play. Nothing in here is sent to the browser except the list it returns.
 */

export const SOUNDCLOUD_PROFILE = "https://soundcloud.com/eutonix";

const FOLDER = path.join(process.cwd(), "public", "music");
const LIST = "public/music/tracks.json";

// One entry in tracks.json. Strict, so a misspelled field is reported rather
// than quietly ignored and the song shown without it.
const entry = z
  .object({
    title: z.string().trim().min(1),
    audio: z.string().trim().min(1),
    cover: z.string().trim().min(1).optional(),
    soundcloud: z.string().url().optional(),
  })
  .strict();

/** A song as the player is handed it: everything resolved to an address. */
export type Track = {
  title: string;
  /** Where the audio is served from. */
  src: string;
  /** Where the cover art is served from, or null for a song without any. */
  cover: string | null;
  /** The song on SoundCloud, or null if it is not linked to one. */
  soundcloud: string | null;
};

function fail(problem: string): never {
  throw new Error(
    `${LIST}: ${problem}\nSee public/music/README.md for how songs are added.`,
  );
}

/*
 * The address a file in the folder is served at. Each part of its name is
 * escaped, so a file called "Dispatch (feat. Franco).mp3" works as it is.
 */
function served(file: string) {
  return `/music/${file.split("/").map(encodeURIComponent).join("/")}`;
}

// That the file is there, and inside the folder rather than reached out of it.
function checkFile(file: string, song: number, field: string) {
  const resolved = path.resolve(FOLDER, file);
  if (!resolved.startsWith(FOLDER + path.sep)) {
    fail(`song ${song}: "${field}" has to name a file inside public/music.`);
  }
  if (!existsSync(resolved)) {
    fail(
      `song ${song}: "${field}" names "${file}", which is not in public/music. ` +
        `Check the spelling, including the extension and capitals.`,
    );
  }
}

/** The songs in tracks.json, in its order, checked against the folder. */
export function getTracks(): Track[] {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path.join(FOLDER, "tracks.json"), "utf8"));
  } catch (error) {
    fail(
      `could not be read as JSON (${error instanceof Error ? error.message : String(error)}).`,
    );
  }

  const parsed = z.array(entry).safeParse(raw);
  if (!parsed.success) {
    // Said in terms of the file: "song 2, title: Required" rather than a path
    // of indexes into an array.
    const problems = parsed.error.issues.map((issue) => {
      const [index, ...field] = issue.path;
      const where =
        typeof index === "number"
          ? `song ${index + 1}${field.length ? `, ${field.join(".")}` : ""}`
          : "the list";
      return `${where}: ${issue.message}`;
    });
    fail(problems.join("; "));
  }

  return parsed.data.map((song, index) => {
    checkFile(song.audio, index + 1, "audio");
    if (song.cover) checkFile(song.cover, index + 1, "cover");

    return {
      title: song.title,
      src: served(song.audio),
      cover: song.cover ? served(song.cover) : null,
      soundcloud: song.soundcloud ?? null,
    };
  });
}
