import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pdf } from "pdf-to-img";

const source = new URL("../Pencapaian/", import.meta.url);
const target = new URL("../public/certificates/", import.meta.url);
const files = (await readdir(source)).filter((name) => name.toLowerCase().endsWith(".pdf")).sort();

if (!files.length) throw new Error("Tidak ada sertifikat PDF di folder Pencapaian.");
await mkdir(target, { recursive: true });

for (const name of files) {
  const pdfSource = new URL(name, source);
  const pdfTarget = new URL(name, target);
  const previewTarget = new URL(`${name.slice(0, -4)}.jpg`, target);
  await copyFile(pdfSource, pdfTarget);

  const preview = await stat(previewTarget).catch(() => null);
  const original = await stat(pdfSource);
  if (preview && preview.mtimeMs >= original.mtimeMs) continue;

  const document = await pdf(fileURLToPath(pdfSource), { scale: 1, format: "jpg" });
  try {
    const image = await document.getPage(1);
    await writeFile(previewTarget, image);
  } finally {
    await document.destroy();
  }
}

console.log(`${files.length} sertifikat dan pratinjau disiapkan.`);
