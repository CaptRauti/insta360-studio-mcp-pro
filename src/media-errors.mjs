// Reading Studio's log lines as plain sentences instead of leaving a stuck page.
//
// Every pattern here was **measured** in a decrypted session log
// (research: `studio_logs` → `grepLogs{decrypt:true}` on the 2026-11-24 session); the
// `evidence` field is the fragment it came from, so nothing in this table is guessed.
// Two jobs:
//
//   1. `media` hits — something the user can act on (a frame that will not decode, a
//      preview that never comes up, a cloud token that expired). These are the ones a
//      stuck import/preview page is usually made of.
//   2. `benign` hits — lines that *look* alarming (`E`, `W`, "fail", "Invalid",
//      "error code") but are normal in every session. Listing them is the point: a
//      report that cries wolf is worse than none.
//
// The hardware-decoder lines are not errors at all but they answer the neighbouring
// question (is this machine decoding on the GPU?), so they are extracted too — see
// `decodePath`, which is also what the `export-slow` guidance refers to.
//
// Matching note: the recovered keystream is not byte-perfect — a measured session showed
// "Successfully loaded …" arriving as "Successfully lopued …" and "Download/" as
// "Downlo2d/". Patterns here therefore match the stable structures (file names, tags
// like `[bad_frame]`, function names), never a whole line of prose, or they would break
// on the next read of the same log.

/** Ordered: the first match wins, so put the specific ones before the general. */
export const MEDIA_ERRORS = [
  {
    id: "corrupted-frame",
    severity: "media",
    match: /\[bad_frame\]|player error frame image|LoadPlayerErrorFrameImageData/i,
    evidence: "I frame_util.cc:1157: [FUNC:...LoadPlayerErrorFrameImageData]: [bad_frame] Successfully loaded player error frame image:",
    plain:
      "Ein Frame der Quelle ließ sich nicht dekodieren. Studio zeigt dafür den roten „Corrupted Frame\"-Platzhalter — die Datei läuft weiter, aber diese Stelle bleibt rot und wird so auch exportiert.",
    action:
      "Quelle erneut von der Karte/SSD kopieren und prüfen (Kabel, Leser, freier Platz). Bleibt es: das Segment aus dem Projekt nehmen; es ist kein Fehler des Projekts oder von Studio.",
  },
  {
    id: "preview-bridge",
    severity: "media",
    match: /videoRenderBridge_ is null|notify 'REFRESH' event failed/i,
    evidence: "E VideoQueue.cc:0172: videoRenderBridge_ is null, notify 'REFRESH' event failed.",
    plain:
      "Die Vorschau war beim Umschalten noch nicht bereit (Render-Brücke fehlte). Meist ein einmaliges Ereignis beim Wechsel von Bibliothek zu Projekt.",
    action: "Einmal die Wiedergabe neu starten. Tritt es bei jedem Öffnen auf, ist der Vorschau-Cache die nächste Spur (`cache/previewer_cache`).",
  },
  {
    id: "cloud-token",
    severity: "media",
    match: /Get token failed|DownloadRecordManager::MakeDatabaseExist|Get token failed!/i,
    evidence: "E download_record_manager.cc:0029: [FUNC:...MakeDatabaseExist]: Get token failed!",
    plain:
      "Der Cloud-/Download-Teil konnte sich nicht anmelden (Token fehlt). Das betrifft nur gekaufte/Cloud-Inhalte, nicht die lokale Bearbeitung.",
    action: "Nur nötig, wenn Cloud-Material fehlt: in Studio neu anmelden.",
  },
  {
    id: "extern-filter-fetch",
    severity: "media",
    match: /extern_filter_category_model|The request is failed, error code/i,
    evidence: "E extern_filter_category_model.cc:0107: [FUNC:...onReply]: The request is failed, error code: 2",
    plain: "Eine Online-Abrufliste (z. B. Filter-/Effekt-Kategorien) kam nicht zurück — reine Netzwerksache, die Bearbeitung läuft lokal weiter.",
    action: "Ignorieren oder Netzwerk/Proxy prüfen, falls die Liste gebraucht wird.",
  },
  {
    id: "extra-info-parse",
    severity: "benign",
    match: /extrainfo asset Parse: iotool read header fail/i,
    evidence: "I ExtraInfoAsset.cc:0389: extrainfo asset Parse: iotool read header fail",
    plain:
      "Die Zusatzdaten einer Datei (Aufnahme-Metadaten) fehlten. Studio liest dann nur den Videoteil — kein Bild-, Export- oder Qualitätsproblem.",
    action: "Nichts. Erscheint bei Dateien ohne Insta360-Metadaten.",
  },
  {
    id: "pkt-timestamp",
    severity: "benign",
    match: /Invalid pkt_timestamp|h264_cuvid|hevc_cuvid/i,
    evidence: "W ffmpeg:0000: h264_cuvid @ ...: Invalid pkt_timestamp, passing timestamps as-is",
    plain:
      "Der Hardware-Decoder (CUVID) meldet Zeitstempel, die er nicht umrechnet. Das steht bei praktisch jeder CUDA-Dekodierung im Log und ändert nichts am Ergebnis.",
    action: "Nichts.",
  },
  {
    id: "missing-local-file",
    severity: "benign",
    match: /File named .* failed|DeserializeImportedMusics|TextLibraryModel::DeserializePersistentList/i,
    evidence: "W text_library_model.cpp:0663: [FUNC:...DeserializePersistentList]: File named ... failed to ...",
    plain: "Eine zuletzt gemerkte Liste (Texte, importierte Musik) fand ihre Datei nicht mehr — z. B. nach dem Verschieben des Download-Ordners.",
    action: "Nichts, die Liste baut sich neu auf.",
  },
  {
    id: "stream-closed",
    severity: "benign",
    match: /stream \d+ finished with error|Connection closed/i,
    evidence: 'W :0000: stream 3 finished with error: "Connection closed"',
    plain: "Der eingebettete Browser (Login-/Store-Seite) hat seine Verbindung beendet. Die App selbst ist nicht betroffen.",
    action: "Nichts.",
  },
];

/** Not errors: which decoder the session actually used. */
const DECODER_PATTERNS = [
  { id: "decoder-chosen", match: /\bchoose decoder hwaccel:\s*(\S+)/i },
  { id: "decoder-config", match: /\bdecoderHwaccel:\s*(\S+)/i },
  { id: "decoder-candidate", match: /\bcandidate decoder hwaccel:\s*\d*\s*(\S+)/i },
  { id: "decoder-try", match: /\btry decoder:\s*(\S+)/i },
  { id: "hwaccel-disabled", match: /\bdisableHwaccelDecoder:\s*(\d)/i },
];

/**
 * One regex source that finds everything this module knows how to talk about — for
 * callers that must search a log first and classify afterwards (grepLogs), so the
 * search and the classification can never drift apart.
 */
export function explainPattern() {
  return [...MEDIA_ERRORS, ...DECODER_PATTERNS].map((d) => `(?:${d.match.source})`).join("|");
}

/**
 * Classify a blob of (already decrypted) log text.
 *
 * @returns {{
 *   hits: Array<{id,severity,count,plain,action,sample,evidence}>,
 *   actionable: number, benign: number,
 *   decodePath: {chosen: string|null, candidates: string[], hardwareDisabled: boolean|null},
 *   summary: string,
 * }}
 */
export function classifyLogText(text) {
  const body = String(text ?? "");
  const lines = body.split(/\r?\n/);
  const hits = [];
  for (const def of MEDIA_ERRORS) {
    const rx = new RegExp(def.match.source, def.match.flags.includes("i") ? "i" : "");
    // Count *lines* that carry the message, not raw regex hits: one log line can hold
    // the same state twice (e.g. "[bad_frame] … player error frame image").
    const matching = lines.filter((l) => rx.test(l));
    if (!matching.length) continue;
    hits.push({
      id: def.id,
      severity: def.severity,
      count: matching.length,
      plain: def.plain,
      action: def.action,
      sample: matching[0].trim().slice(0, 200),
      evidence: def.evidence,
    });
  }

  const candidates = [];
  let chosen = null;
  let hardwareDisabled = null;
  for (const p of DECODER_PATTERNS) {
    const m = body.match(new RegExp(p.match.source, "gi"));
    if (!m?.length) continue;
    for (const line of m) {
      const value = line.match(p.match)?.[1] ?? null;
      if (!value) continue;
      if (p.id === "decoder-chosen") chosen = chosen ?? value;
      else if (p.id === "decoder-config") chosen = chosen ?? value; // the configured one is the fallback
      else if (p.id === "hwaccel-disabled") hardwareDisabled = value !== "0";
      else if (!candidates.includes(value)) candidates.push(value);
    }
  }

  const actionable = hits.filter((h) => h.severity === "media").length;
  const benign = hits.length - actionable;
  const summary = actionable
    ? `${actionable} Punkt(e), die man anfassen kann: ${hits.filter((h) => h.severity === "media").map((h) => h.id).join(", ")}`
    : hits.length
      ? `nur Unkritisches gefunden (${hits.map((h) => h.id).join(", ")}) — nichts zu tun`
      : "keine der bekannten Meldungen im Ausschnitt";

  return { hits, actionable, benign, decodePath: { chosen, candidates, hardwareDisabled }, summary };
}
