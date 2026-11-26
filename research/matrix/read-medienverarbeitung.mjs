// Read the export dialog's "Medienverarbeitung:" group, which the settings reader
// does not cover. Filters OCR words by screen region instead of cropping the image.
//
//   node research/matrix/read-medienverarbeitung.mjs
import { capture } from "../../src/ui.mjs";
import { ocrImage } from "../../src/ocr.mjs";

const shot = capture({ title: "Insta360 Studio", mode: "print" });
const ocr = ocrImage(shot.path);
if (!ocr.ok) {
  console.log("OCR failed:", ocr.error);
  process.exit(1);
}
console.log("shot:", shot.path);

const w0 = ocr.words?.[0] ?? ocr.lines?.[0];
console.log("word shape:", JSON.stringify(w0));

// Left column of the dialog is x ~650-1010; Farbraum sits at y ~600, so everything
// below it is either the group or the buttons.
const inDialog = ocr.words.filter((w) => w.x >= 600 && w.x <= 1020);
const below = inDialog.filter((w) => w.y >= 610 && w.y <= 900);
console.log("--- labels/values below Farbraum (y>=610) ---");
for (const w of below.sort((a, b) => a.y - b.y || a.x - b.x)) {
  console.log(`${String(Math.round(w.y)).padStart(4)} ${String(Math.round(w.x)).padStart(4)}  ${JSON.stringify(w.text)}`);
}
