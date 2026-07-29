import { writeFile } from "./virtualDisk";
import { DiskFile } from "./types";

const FILE_BLOCK_RE = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
const CODE_FENCE_RE = /```([a-zA-Z0-9+-]*)\n([\s\S]*?)```/g;

const LANG_EXT: Record<string, string> = {
  ts: "ts", typescript: "ts", tsx: "tsx", js: "js", javascript: "js",
  jsx: "jsx", json: "json", css: "css", scss: "scss", html: "html",
  py: "py", python: "py", sh: "sh", bash: "sh", sql: "sql", yml: "yaml",
  yaml: "yaml", md: "md"
};

export interface AgentResult {
  chatText: string;
  writtenFiles: DiskFile[];
}

/**
 * Model cevabındaki <file path="...">içerik</file> bloklarını bulur,
 * her birini sanal diske yazar ve sohbette kalan (dosya bloğu
 * çıkarılmış) metni döndürür. Böylece kullanıcı sohbet ekranında asla
 * ham kod görmez, yalnızca kısa bir özet + dosya rozetleri görür.
 *
 * Güvenlik ağı: model kuralı unutup <file> etiketi kullanmadan
 * ```kod``` bloğu üretirse, bu blok da otomatik olarak
 * misc/agent-output-N.<uzantı> altına yazılır — sohbette hiçbir zaman
 * ham kod kalmaz.
 */
export function processAgentResponse(sessionId: string, rawText: string): AgentResult {
  const writtenFiles: DiskFile[] = [];

  let withoutFiles = rawText.replace(FILE_BLOCK_RE, (_match, filePath: string, content: string) => {
    const trimmed = content.replace(/^\n/, "").replace(/\n$/, "");
    const file = writeFile(sessionId, filePath.trim(), trimmed);
    writtenFiles.push(file);
    return `\n📄 \`${filePath.trim()}\` sanal diske yazıldı.\n`;
  });

  let fenceIndex = 0;
  withoutFiles = withoutFiles.replace(CODE_FENCE_RE, (_match, lang: string, content: string) => {
    fenceIndex += 1;
    const ext = LANG_EXT[(lang || "").toLowerCase()] || "txt";
    const relPath = `misc/agent-output-${Date.now()}-${fenceIndex}.${ext}`;
    const file = writeFile(sessionId, relPath, content.replace(/\n$/, ""));
    writtenFiles.push(file);
    return `\n📄 \`${relPath}\` sanal diske yazıldı.\n`;
  });

  return { chatText: withoutFiles.trim(), writtenFiles };
}
