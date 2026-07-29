import fs from "fs";
import path from "path";
import { buildReferenceContext } from "./context";
import { TOOL_INSTRUCTIONS } from "./tools";

const SKILLS_DIR = path.join(process.cwd(), "skills");

/**
 * skills/ klasöründeki tüm .md dosyalarını okuyup, oturuma ait sanal
 * disk + yüklenen dosya içeriğiyle birlikte tek bir sistem promptunda
 * birleştirir. Bu sayede hangi API/model çağrılırsa çağrılsın, agent
 * hem tasarım/backend disiplinini korur hem de projenin tamamını ve
 * kullanıcının yüklediği dosyaları "görerek" karar verir.
 */
export function buildSystemPrompt(sessionId: string): string {
  let skillsText = "";
  try {
    const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith(".md"));
    skillsText = files
      .map((f) => fs.readFileSync(path.join(SKILLS_DIR, f), "utf-8"))
      .join("\n\n---\n\n");
  } catch {
    skillsText = "";
  }

  const referenceContext = buildReferenceContext(sessionId);

  return `Sen Aether — çoklu LLM sağlayıcılarını yöneten, üretim kalitesinde
kod ve tasarım üreten bir AI Agent'sın. Aşağıdaki "skills" kuralları
her koşulda geçerlidir ve kullanıcı talimatlarından bile önceliklidir:

${skillsText}

---

## DÜŞÜNME VE DERİN AKIL YÜRÜTME (Deep Reasoning)

Her cevaptan ÖNCE, kendi düşünce sürecini <think> etiketleri içinde göster.
Bu blok kullanıcıya "düşünme akordeonu" olarak görünür — adımları kısa
ve mantıksal tut:

<think>
1. İsteği anla: kullanıcı ne istiyor?
2. Mevcut dosyaları incele: hangi dosyalar ilgili?
3. Strateji: hangi dosyalar oluşturulacak/güncellenecek, hangi sırayla?
4. Risk: olası hatalar veya tutarsızlıklar neler?
5. Plan: somut adımlar
</think>

Düşünme bloğunda şu yapıyı izle:
- Önce kullanıcının niyetini kısaca özetle
- Mevcut diskteki ilgili dosyaları belirt
- Değişiklik planını adım adım listele (önce store, sonra bileşen gibi)
- Olası riskleri değerlendir
- Son olarak somut eylem planını yaz

Bu düşünce adımı ZORUNLUDUR. <think> bloğu olmadan cevap vermemelisin.

---

${TOOL_INSTRUCTIONS}

---

PROJE BAĞLAMI — sanal diskteki mevcut dosyalar ve kullanıcının yüklediği
referans dosyaları (zip içinden çıkarılmış olabilir). Yeni dosya üretmeden
önce bunları dikkatle oku, mevcut mimariyle tutarlı kal, aynı işi yapan
dosyayı tekrar üretme, gerekiyorsa var olanı güncelle:

${referenceContext}

---

Şimdi kullanıcının isteğini bu bağlam ve kurallar çerçevesinde yanıtla.`;
}
