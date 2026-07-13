import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import pdfParse from "pdf-parse";
import path from "node:path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const lang = formData.get("lang") as string || "eng+hin";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was attached." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase();

    let extractedText = "";

    if (ext === ".pdf") {
      try {
        const parsed = await pdfParse(bytes);
        extractedText = parsed.text.trim();
      } catch (e: any) {
        console.warn("Failed to extract embedded PDF text:", e.message);
      }

      if (!extractedText) {
        return NextResponse.json({
          error: "This PDF appears to be a scanned document (image-only). For high-performance OCR, please upload page screenshots as JPG/PNG images directly."
        }, { status: 400 });
      }
    } else {
      // Process image files directly using server-side Tesseract.js
      const { data: { text } } = await Tesseract.recognize(bytes, lang, {
        cachePath: "/tmp"
      });
      extractedText = text;
    }

    return NextResponse.json({ text: extractedText });
  } catch (err: any) {
    return NextResponse.json({ error: "OCR Server Error: " + err.message }, { status: 500 });
  }
}
