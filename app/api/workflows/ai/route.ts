import { NextResponse } from "next/server";
import path from "node:path";
import { persistDocumentUpload } from "../../../../lib/server/document-storage";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const action = formData.get("action") as string || "summarize";
    const translationTarget = formData.get("translationTarget") as string || "en-to-hi";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    
    // Store original document securely
    const stored = await persistDocumentUpload(file, bytes);

    let textContent = "";
    const ext = path.extname(file.name).toLowerCase();

    if (ext === ".pdf") {
      try {
        const parsed = await pdfParse(bytes);
        textContent = parsed.text;
      } catch (err: any) {
        return NextResponse.json({ error: "Failed to parse PDF text layer: " + err.message }, { status: 400 });
      }
    } else {
      textContent = bytes.toString("utf8");
    }

    textContent = textContent.replace(/\s+/g, " ").trim();

    if (!textContent) {
      return NextResponse.json({ error: "No text could be extracted from the file." }, { status: 400 });
    }

    // Heuristic Summary and Translation Generation
    // In a production setup, we would request OpenAI / Gemini here if OPENAI_API_KEY is defined.
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";

    if (apiKey) {
      try {
        const prompt = action === "summarize" 
          ? `Summarize the following document in 3 concise, clear bullet points. Include key entities and numbers. Do not output anything else:\n\n${textContent.slice(0, 4000)}`
          : `Translate the following text to ${translationTarget === "en-to-hi" ? "Hindi (हिंदी)" : "English"}. Translate faithfully and preserve context:\n\n${textContent.slice(0, 3000)}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
        });

        const data = await response.json();
        if (response.ok && data.choices?.[0]?.message?.content) {
          const aiResponse = data.choices[0].message.content.trim();
          if (action === "summarize") {
            const bullets = aiResponse.split("\n").map((b: string) => b.replace(/^[-*•\s\d.]+/g, "").trim()).filter(Boolean);
            return NextResponse.json({
              result: {
                summary: bullets,
                keywords: Array.from(new Set(textContent.split(/\s+/).filter(w => w.length > 5).slice(0, 10))),
                hash: stored.documentId
              }
            });
          } else {
            return NextResponse.json({
              result: {
                translation: aiResponse,
                hash: stored.documentId
              }
            });
          }
        }
      } catch (aiErr) {
        console.error("OpenAI API call failed, falling back to local engine:", aiErr);
      }
    }

    // Local Fallback heuristic implementation
    const words = textContent.split(/\s+/).filter(Boolean);
    const keywords = Array.from(new Set(words.filter(w => w.length > 5 && !/^[0-9]+$/.test(w)).slice(0, 8)));

    if (action === "summarize") {
      const sentences = textContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
      const summaryBullets = [
        sentences[0] ? sentences[0] + "." : "Document upload successfully processed.",
        sentences[Math.floor(sentences.length / 2)] ? sentences[Math.floor(sentences.length / 2)] + "." : "Extracted structured text elements.",
        `The document contains approximately ${words.length} words and ${keywords.length} unique keywords.`
      ];

      return NextResponse.json({
        result: {
          summary: summaryBullets,
          keywords,
          hash: stored.documentId
        }
      });
    } else {
      // Mock local translation dictionary helper for demonstration
      let translatedText = "";
      if (translationTarget === "en-to-hi") {
        translatedText = `[हिंदी अनुवाद (संक्षिप्त)] ${textContent.slice(0, 200)}... \n\n(This is a secure local fallback translation preview. Configure OPENAI_API_KEY in the environment settings to enable high-fidelity neural translation.)`;
      } else {
        translatedText = `[English Translation (Summary)] ${textContent.slice(0, 200)}... \n\n(This is a secure local fallback translation preview. Configure OPENAI_API_KEY in the environment settings to enable high-fidelity neural translation.)`;
      }

      return NextResponse.json({
        result: {
          translation: translatedText,
          hash: stored.documentId
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected server error occurred." }, { status: 500 });
  }
}
