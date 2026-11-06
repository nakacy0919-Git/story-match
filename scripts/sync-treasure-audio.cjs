// Copy immutable Treasure Hunt model recordings into the Vercel static build.
// No runtime API keys or client-side requests to GitHub are needed for these MP3s.
const fs = require("node:fs/promises");
const path = require("node:path");
const base = "https://raw.githubusercontent.com/nakacy0919-Git/treasure-hunt/126494bc3c9dee3a80c0d37dc6cea79f1c5087d7/";
const assets = [
  "img/main.webp",
  "units/unit1/audio/U01_P1_full.mp3",
  "units/unit1/audio/U01_P1_p1.mp3",
  "units/unit1/audio/U01_P1_p2.mp3",
  "units/unit1/audio/U01_P1_p3.mp3",
  "units/unit1/audio/U01_P1_p4.mp3",
  "units/unit4/audio/U04_P1_full.mp3",
  "units/unit4/audio/U04_P1_p1.mp3",
  "units/unit4/audio/U04_P1_p2.mp3",
  "units/unit4/audio/U04_P1_p3.mp3",
  "units/unit5/audio/U05_P1_full.mp3",
  "units/unit5/audio/U05_P1_p1.mp3",
  "units/unit5/audio/U05_P1_p2.mp3",
  "units/unit5/audio/U05_P1_p3.mp3",
  "units/unit5/audio/U05_P1_p4.mp3",
  "units/unit6/audio/U06_P1_full.mp3",
  "units/unit6/audio/U06_P1_p1.mp3",
  "units/unit6/audio/U06_P1_p2.mp3",
  "units/unit6/audio/U06_P1_p3.mp3",
  "units/unit6/audio/U06_P1_p4.mp3"
];
const outputFor = (source) => source === "img/main.webp"
  ? "public/treasure-cover.webp"
  : source.replace(/^units\//, "public/audio-treasure/");
async function download(source) {
  const destination = outputFor(source);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = base + source;
      const result = await fetch(url, { signal: AbortSignal.timeout(35000) });
      if (!result.ok) throw new Error("HTTP " + result.status + " " + source);
      const bytes = Buffer.from(await result.arrayBuffer());
      if (bytes.length < 1000) throw new Error("Audio/image seems empty: " + source);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, bytes);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw new Error("Could not fetch " + source + ": " + String(lastError));
}
(async () => {
  // A small batch reduces throttling and keeps the build predictable.
  for (let i = 0; i < assets.length; i += 4) {
    await Promise.all(assets.slice(i, i + 4).map(download));
  }
  console.log("Treasure Hunt: copied " + assets.length + " source assets from pinned GitHub commit.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
