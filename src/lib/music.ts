/*
 * The music on the page: the SoundCloud profile the music card links to, and
 * what the player under it plays.
 */

export const SOUNDCLOUD_PROFILE = "https://soundcloud.com/eutonix";

/**
 * What the player plays. Paste any SoundCloud link here, from the address bar
 * or from a track's Share button:
 *
 * - a playlist, like https://soundcloud.com/eutonix/sets/website, to choose
 *   which songs are on the page and in what order. The player shows the list
 *   and plays through it, and editing the playlist on SoundCloud changes the
 *   page without touching this file.
 * - a single track, like https://soundcloud.com/eutonix/song-name.
 * - the profile itself, which lists every public track on it.
 *
 * The player sizes itself to what it is given: a track gets a single row, and a
 * playlist or a profile gets room for the list.
 */
export const MUSIC_SOURCE: string = SOUNDCLOUD_PROFILE;
