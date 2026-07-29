import { NextRequest, NextResponse } from "next/server";
import { callProvider, getProvider } from "@/lib/providers";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { buildImageAttachments } from "@/lib/context";
import { processAgentResponse } from "@/lib/agent";
import { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  sessionId: string;
  providerId: string;
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { sessionId, providerId, apiKey, model, messages } = body;

  if (!sessionId || !providerId || !apiKey || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "sessionId, providerId, apiKey ve messages alanları zorunludur." },
      { status: 400 }
    );
  }

  try {
    const system = buildSystemPrompt(sessionId);
    const images = buildImageAttachments(sessionId);
    const providerSupportsVision = getProvider(providerId).supportsVision;
    const rawText = await callProvider(providerId, apiKey, messages, system, model, images);
    const { chatText, writtenFiles } = processAgentResponse(sessionId, rawText);

    return NextResponse.json({
      reply: chatText,
      writtenFiles,
      imagesSeen: providerSupportsVision ? images.map((i) => i.path) : []
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Sağlayıcı isteği sırasında bilinmeyen bir hata oluştu." },
      { status: 502 }
    );
  }
}
