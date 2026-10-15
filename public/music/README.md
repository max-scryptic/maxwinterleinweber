# Music

The songs in the player on the home page. Everything the player needs lives
in this folder: the audio, the cover art, and `tracks.json`, which says what
to play and in what order.

## Adding a song

1. **Drop the audio file in this folder.** MP3 is best, at 192 to 320 kbps.
   M4A (AAC) works too. Avoid WAV: a three minute WAV is around 30 MB, which
   is slow for visitors to load and heavy for the repo.
2. **Drop its cover art next to it**, if it has one: a square JPG, PNG or
   WebP, 600px or larger. It is resized for the page automatically, so a big
   original is fine. A song without one shows the eutonix avatar.
3. **Add it to `tracks.json`**, in the order the songs should be listed:

```json
[
  {
    "title": "Dispatch (feat. Franco)",
    "audio": "dispatch.mp3",
    "cover": "dispatch.jpg",
    "soundcloud": "https://soundcloud.com/eutonix/dispatch"
  },
  {
    "title": "daybreak",
    "audio": "daybreak.mp3",
    "cover": "daybreak.jpg"
  }
]
```

| Field        | Required | What it is                                                       |
| ------------ | -------- | ---------------------------------------------------------------- |
| `title`      | Yes      | The song's name, exactly as it should be shown.                  |
| `audio`      | Yes      | The audio file's name in this folder.                            |
| `cover`      | No       | The cover art's name in this folder.                             |
| `soundcloud` | No       | The song on SoundCloud. Adds an "Open on SoundCloud" link to it. |

File names can have spaces and capitals, but they have to match exactly,
extension included.

## Checks

The build reads `tracks.json` and stops with a message saying what is wrong
if a field is misspelled, a required one is missing, or a file it names is
not in this folder. A broken list never reaches the site.

While `tracks.json` is an empty list, `[]`, the music card shows the eutonix
profile and the Follow on SoundCloud link, with no player.
