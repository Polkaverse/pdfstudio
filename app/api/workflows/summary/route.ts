import { NextResponse } from "next/server";

import { persistDocumentUpload } from "../../../../lib/server/document-storage";
import {
  runSummaryWorkflow,
  validateIncomingFile,
} from "../../../../lib/server/document-workflow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Attach a file before starting the workflow." }, { status: 400 });
    }

    validateIncomingFile(file);

    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await persistDocumentUpload(file, bytes);
    const result = await runSummaryWorkflow({ file, bytes, stored });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected workflow failure.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
