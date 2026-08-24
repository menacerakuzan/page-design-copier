#!/usr/bin/env node
/**
 * Озвучення карток об'єктів через ElevenLabs TTS.
 *
 * Бере description + detailed_info (і _en варіанти), чистить HTML, генерує
 * mp3 через ElevenLabs, заливає на self-hosted storage-server (той самий, що й
 * для фото — /storage/v1/object/media/...) і записує публічний URL у
 * audio_url / audio_url_en. Заповнює лише порожні (не перезаписує наявні).
 *
 * Використання:
 *   DATABASE_URL=postgresql://OWNER:PASS@localhost:5432/tourism \
 *     node scripts/backfill-audio.mjs            # DRY-RUN: нічого не змінює, лише звіт
 *   DATABASE_URL=... node scripts/backfill-audio.mjs --apply   # згенерувати і записати
 *
 * Env:
 *   DATABASE_URL        (default postgresql://authenticator:changeme123@localhost:5432/tourism)
 *   ELEVENLABS_API_KEY   обов'язковий
 *   ELEVENLABS_VOICE_ID  (default 21m00Tcm4TlvDq8ikWAM — Rachel, eleven_multilingual_v2)
 *   STORAGE_URL          (default http://127.0.0.1:5100/storage/v1)
 *   STORAGE_ANON_KEY      той самий ключ, що VITE_API_ANON_KEY/POSTGREST_ANON_KEY
 */

import "../server/assistant/loadEnv.mjs";
import fs from "node:fs";
import pg from "pg";

const { Client } = pg;
const APPLY = process.argv.includes("--apply");

const connectionString =
  process.env.DATABASE_URL || "postgresql://authenticator:changeme123@localhost:5432/tourism";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const STORAGE_URL = process.env.STORAGE_URL || "http://127.0.0.1:5100/storage/v1";
const STORAGE_ANON_KEY =
  process.env.STORAGE_ANON_KEY ||
  process.env.POSTGREST_ANON_KEY ||
  process.env.VITE_API_ANON_KEY;
const BUCKET = "media";
const MAX_CHARS = 2200; // безпечний ліміт на один TTS-запит (без чанкінгу/склейки mp3)

if (!ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY не задано (перевір .env.local).");
  process.exit(1);
}
if (!STORAGE_ANON_KEY) {
  console.error("STORAGE_ANON_KEY/POSTGREST_ANON_KEY не задано.");
  process.exit(1);
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function buildText(name, description, detailedInfo) {
  const body = [stripHtml(description), stripHtml(detailedInfo)].filter(Boolean).join(". ");
  const full = `${name}. ${body}`;
  return full.length > MAX_CHARS ? `${full.slice(0, MAX_CHARS - 1)}…` : full;
}

async function synthesize(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAudio(buffer, filePath) {
  const res = await fetch(`${STORAGE_URL}/object/${BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      apikey: STORAGE_ANON_KEY,
      Authorization: `Bearer ${STORAGE_ANON_KEY}`,
      "Content-Type": "audio/mpeg",
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Storage upload ${res.status}: ${body.slice(0, 300)}`);
  }
  return `${STORAGE_URL}/object/public/${BUCKET}/${filePath}`;
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  // authenticator є NOINHERIT-членом authenticated (secure-auth.sql) — без
  // явного SET ROLE політика RLS "authenticated write tourism_objects" не діє
  // на цю сесію: UPDATE мовчки зачепить 0 рядків замість помилки.
  await client.query("SET ROLE authenticated");

  const { rows } = await client.query(`
    select id, slug, name, name_en, description, detailed_info, description_en, detailed_info_en,
           audio_url, audio_url_en
      from public.tourism_objects
     where published = true
       and (
         (audio_url is null and description is not null)
         or (audio_url_en is null and description_en is not null)
       )
     order by name
  `);

  console.log(`${rows.length} об'єктів для озвучення. ${APPLY ? "РЕЖИМ ЗАПИСУ" : "DRY-RUN (без змін)"}\n`);

  let done = 0;
  let failed = 0;

  for (const row of rows) {
    // UK
    if (!row.audio_url && row.description) {
      const text = buildText(row.name, row.description, row.detailed_info);
      try {
        const audio = await synthesize(text);
        const url = APPLY ? await uploadAudio(audio, `audio/${row.id}-uk.mp3`) : "(dry-run)";
        console.log(`✓ [uk] ${row.name}  →  ${url}  (${text.length} симв.)`);
        if (APPLY) {
          await client.query(`update public.tourism_objects set audio_url = $1 where id = $2`, [url, row.id]);
        }
        done++;
      } catch (e) {
        console.log(`✗ [uk] ${row.name}  —  ${e.message}`);
        failed++;
      }
    }

    // EN
    if (!row.audio_url_en && row.description_en) {
      const text = buildText(row.name_en || row.name, row.description_en, row.detailed_info_en);
      try {
        const audio = await synthesize(text);
        const url = APPLY ? await uploadAudio(audio, `audio/${row.id}-en.mp3`) : "(dry-run)";
        console.log(`✓ [en] ${row.name}  →  ${url}  (${text.length} симв.)`);
        if (APPLY) {
          await client.query(`update public.tourism_objects set audio_url_en = $1 where id = $2`, [url, row.id]);
        }
        done++;
      } catch (e) {
        console.log(`✗ [en] ${row.name}  —  ${e.message}`);
        failed++;
      }
    }
  }

  await client.end();

  console.log(`\n── Підсумок ──`);
  console.log(`  Готово:  ${done}`);
  console.log(`  Помилки: ${failed}`);
  if (!APPLY && done) console.log(`\n  Це був DRY-RUN. Для запису: node scripts/backfill-audio.mjs --apply`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
