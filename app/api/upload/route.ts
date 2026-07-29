import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import path from "path";
import { writeBinaryFile, writeFile, buildTree } from "@/lib/virtualDisk";
import { extractPdfText, extractDocxText } from "@/lib/fileExtract";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8_000_000; // dosya başına 8 MB
const MAX_ZIP_ENTRY_BYTES = 8_000_000;

function sanitizeEntryName(name: string): string {
  return name.replace(/\\/g, "/").split("/").filter((p) => p && p !== "..").join("/");
}

/**
 * Ham dosyayı sanal diske yazar; PDF/DOCX ise ayrıca düz metnini
 * çıkarıp `<yol>.extracted.md` olarak da kaydeder. Bu sayede
 * context.ts, taranabilir metin dosyaları arasında PDF/DOCX içeriğini
 * de otomatik olarak modele okutur.
 */
async function ingestFile(sessionId: string, relPath: string, buffer: Buffer): Promise<void> {
  writeBinaryFile(sessionId, relPath, buffer);
  const ext = path.extname(relPath).toLowerCase();

  if (ext === ".pdf") {
    const text = await extractPdfText(buffer);
    if (text) writeFile(sessionId, `${relPath}.extracted.md`, text);
  } else if (ext === ".docx") {
    const text = await extractDocxText(buffer);
    if (text) writeFile(sessionId, `${relPath}.extracted.md`, text);
  }
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  const sessionId = form.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "sessionId zorunludur." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Hiç dosya gönderilmedi." }, { status: 400 });
  }

  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length > MAX_FILE_BYTES) {
      skipped.push(`${file.name} (çok büyük)`);
      continue;
    }

    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        const zip = new AdmZip(buffer);
        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          const data = entry.getData();
          if (data.length > MAX_ZIP_ENTRY_BYTES) {
            skipped.push(`${entry.entryName} (zip içinde çok büyük)`);
            continue;
          }
          const clean = sanitizeEntryName(entry.entryName);
          if (!clean) continue;
          const target = `_uploads/${clean}`;
          await ingestFile(sessionId, target, data);
          written.push(target);
        }
      } catch {
        skipped.push(`${file.name} (zip açılamadı)`);
      }
      continue;
    }

    const clean = sanitizeEntryName(file.name);
    if (!clean) {
      skipped.push(file.name);
      continue;
    }
    const target = `_uploads/${clean}`;
    await ingestFile(sessionId, target, buffer);
    written.push(target);
  }

  return NextResponse.json({
    written,
    skipped,
    tree: buildTree(sessionId)
  });
}
