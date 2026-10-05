(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const workspace = $("#workspace");
  const resultSection = $("#resultSection");
  const verifyForm = $("#verifyForm");
  const validationMessage = $("#validationMessage");
  let activeMode = "text";
  let currentResult = null;

  const modeLabels = { text: "Text", voice: "Voice", upload: "File upload", image: "Image OCR", url: "Article URL" };
  const sourceForMode = {
    text: () => $("#claimText").value.trim(),
    voice: () => $("#voiceTranscript").value.trim(),
    upload: () => $("#fileExtracted").value.trim(),
    image: () => $("#imageExtracted").value.trim(),
    url: () => ($("#articleText").value.trim() || $("#articleUrl").value.trim())
  };

  function showWorkspace(mode = "text") {
    workspace.hidden = false;
    resultSection.hidden = true;
    setMode(mode);
    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    if (mode === "text") $("#claimText").focus({ preventScroll: true });
  }

  function setMode(mode) {
    activeMode = mode;
    $$(".mode-tab").forEach(tab => {
      const selected = tab.dataset.mode === mode;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    $$(".mode-panel").forEach(panel => panel.hidden = panel.dataset.panel !== mode);
    $("#workspaceTitle").textContent = mode === "text" ? "Verify a claim" : `Verify using ${modeLabels[mode].toLowerCase()}`;
    validationMessage.hidden = true;
  }

  function validateClaim(claim) {
    if (!claim) return "Enter a claim or provide content before continuing.";
    if (claim.length < 12) return "This input may be too short to contain a verifiable claim. Add more context.";
    if (claim.length > 2000) return "This input is too long. Keep the claim under 2,000 characters.";
    const letters = (claim.match(/\p{L}/gu) || []).length;
    if (letters < 5) return "This input does not appear to contain enough readable text. Please edit it.";
    const words = claim.trim().split(/\s+/);
    if (words.length < 3) return "Please provide a complete statement with enough context to evaluate.";
    const unique = new Set(claim.toLowerCase().match(/\b[\p{L}\p{N}]+\b/gu) || []);
    if (words.length > 5 && unique.size / words.length < 0.25) return "This text may be repetitive or unclear. Please review it before continuing.";
    return "";
  }

  function renderResult(claim, mode) {
    const error = validateClaim(claim);
    if (error) {
      validationMessage.textContent = error;
      validationMessage.hidden = false;
      return;
    }
    // Demo-only result: deliberately never labels a user claim true or false.
    const result = {
      id: Date.now(),
      claim,
      mode: modeLabels[mode] || "Text",
      verdict: "UNVERIFIED",
      explanation: "This interface is a front-end prototype. It has not checked this claim against reliable sources, so it cannot determine whether the statement is true, false or misleading. Connect a verification backend and evidence retrieval system before using this result for real claims.",
      evidence: "No evidence was retrieved in demo mode."
    };
    currentResult = result;
    $("#resultClaim").textContent = `“${claim}”`;
    $("#resultInputType").textContent = `Input type: ${result.mode}`;
    $("#resultVerdict").textContent = result.verdict;
    $("#resultExplanation").textContent = result.explanation;
    $("#resultEvidence").textContent = result.evidence;
    resultSection.hidden = false;
    workspace.hidden = true;
    saveHistory(result);
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem("truecheck-history") || "[]"); }
    catch { return []; }
  }
  function saveHistory(result) {
    const history = [result, ...readHistory()].slice(0, 30);
    try { localStorage.setItem("truecheck-history", JSON.stringify(history)); } catch {}
    renderHistory();
  }
  function renderHistory() {
    const history = readHistory();
    $("#historyEmpty").hidden = history.length > 0;
    $("#historyTableWrap").hidden = history.length === 0;
    $("#historyRows").replaceChildren();
    history.forEach(item => {
      const row = document.createElement("tr");
      const date = new Date(item.id);
      const dateText = Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
      [dateText, item.claim.length > 95 ? item.claim.slice(0, 95) + "…" : item.claim, item.verdict || "UNVERIFIED", item.mode || "Text"].forEach((value, index) => {
        const cell = document.createElement("td");
        if (index === 1) cell.className = "claim-cell";
        cell.textContent = value;
        row.appendChild(cell);
      });
      const actionCell = document.createElement("td");
      const open = document.createElement("button");
      open.className = "history-open";
      open.type = "button";
      open.textContent = "→";
      open.setAttribute("aria-label", "Open saved result");
      open.addEventListener("click", () => {
        currentResult = item;
        $("#resultClaim").textContent = `“${item.claim}”`;
        $("#resultInputType").textContent = `Input type: ${item.mode || "Text"}`;
        $("#resultVerdict").textContent = item.verdict || "UNVERIFIED";
        $("#resultExplanation").textContent = item.explanation || "No explanation saved.";
        $("#resultEvidence").textContent = item.evidence || "No evidence saved.";
        workspace.hidden = true;
        resultSection.hidden = false;
        resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      actionCell.appendChild(open);
      row.appendChild(actionCell);
      $("#historyRows").appendChild(row);
    });
  }

  $("#quickVerifyForm").addEventListener("submit", event => {
    event.preventDefault();
    const claim = $("#quickClaim").value.trim();
    showWorkspace("text");
    $("#claimText").value = claim;
    $("#charCount").textContent = `${claim.length} / 2000`;
  });
  $$(".option").forEach(button => button.addEventListener("click", () => showWorkspace(button.dataset.mode)));
  $$(".mode-tab").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
  $("#closeWorkspace").addEventListener("click", () => { workspace.hidden = true; });
  $("#newCheck").addEventListener("click", () => { showWorkspace("text"); $("#claimText").value = ""; });
  $("#claimText").addEventListener("input", () => $("#charCount").textContent = `${$("#claimText").value.length} / 2000`);
  verifyForm.addEventListener("submit", event => {
    event.preventDefault();
    if (activeMode === "url") {
      const url = $("#articleUrl").value.trim();
      if (url) {
        try {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        } catch {
          validationMessage.textContent = "Enter a valid article URL beginning with https:// or http://.";
          validationMessage.hidden = false;
          return;
        }
      }
    }
    renderResult(sourceForMode[activeMode](), activeMode);
  });
  $("#clearHistory").addEventListener("click", () => {
    if (confirm("Clear all TrueCheck history saved in this browser?")) {
      localStorage.removeItem("truecheck-history");
      renderHistory();
    }
  });
  $("#copyResult").addEventListener("click", async () => {
    if (!currentResult) return;
    const text = `TRUECHECK — DEMO RESULT\nClaim: ${currentResult.claim}\nVerdict: ${currentResult.verdict}\nExplanation: ${currentResult.explanation}\nEvidence: ${currentResult.evidence}\n\nThis is a prototype result and has not been verified against live sources.`;
    try {
      await navigator.clipboard.writeText(text);
      $("#copyResult").textContent = "Copied";
      setTimeout(() => $("#copyResult").textContent = "Copy result", 1600);
    } catch { alert(text); }
  });
  $("#shareResult").addEventListener("click", async () => {
    if (!currentResult) return;
    const shareData = { title: "TrueCheck result", text: `${currentResult.verdict}: ${currentResult.claim}\n\nDemo result — not verified against live sources.` };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try { await navigator.clipboard.writeText(shareData.text); alert("Share text copied to clipboard."); }
      catch { alert(shareData.text); }
    }
  });
  $("#menuToggle").addEventListener("click", () => {
    const nav = $(".main-nav");
    const isOpen = nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
  });
  $$(".main-nav a").forEach(link => link.addEventListener("click", () => $(".main-nav").classList.remove("open")));
  renderHistory();
  window.TrueCheck = { setMode, renderResult, showWorkspace };
})();


// --- Extended feature layer ---
(() => {
  const $ = (s) => document.querySelector(s);
  const languageSelect = $("#languageSelect");
  const speakButton = $("#speakResult");
  const overlay = $("#stateOverlay");
  const closeState = $("#closeState");
  const stateTitle = $("#stateDialogTitle");
  const stateText = $("#stateDialogText");
  const stateAction = $("#stateDialogAction");

  const speechLocales = {
    en: "en-US", af: "af-ZA", pt: "pt-PT", es: "es-ES", fr: "fr-FR"
  };

  if (languageSelect) {
    const saved = localStorage.getItem("truecheck-language");
    if (saved && [...languageSelect.options].some(o => o.value === saved)) languageSelect.value = saved;
    languageSelect.addEventListener("change", () => localStorage.setItem("truecheck-language", languageSelect.value));
  }

  if (speakButton) {
    speakButton.addEventListener("click", () => {
      if (!("speechSynthesis" in window)) {
        alert("Text-to-speech is not supported in this browser.");
        return;
      }
      const claim = $("#resultClaim")?.textContent || "";
      const verdict = $("#resultVerdict")?.textContent || "";
      const explanation = $("#resultExplanation")?.textContent || "";
      const utterance = new SpeechSynthesisUtterance(`Verdict: ${verdict}. Claim: ${claim}. Explanation: ${explanation}`);
      utterance.lang = speechLocales[languageSelect?.value || "en"] || "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      speakButton.textContent = "Speaking…";
      utterance.onend = () => speakButton.textContent = "Read aloud";
    });
  }

  const states = {
    ambiguous: {
      title: "More context required.",
      text: "This claim is too ambiguous to verify reliably. A production system should ask a focused follow-up question, such as the country, date, person, organization or event being referenced.",
      action: "Add context"
    },
    insufficient: {
      title: "Not enough evidence.",
      text: "The available evidence is insufficient to support a reliable conclusion. TrueCheck should return Unverified or Not Enough Evidence rather than guessing.",
      action: "Try another claim"
    },
    outscope: {
      title: "This is not a factual claim.",
      text: "This input may be an opinion, instruction, personal request or another type of content outside the verification workflow.",
      action: "Enter a factual claim"
    },
    error: {
      title: "Verification unavailable.",
      text: "A connected service such as OCR, speech recognition, article retrieval or the verification API may have failed. The interface should explain what happened and allow the user to retry.",
      action: "Try again"
    }
  };

  document.querySelectorAll(".demo-state").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = states[btn.dataset.state];
      if (!item) return;
      stateTitle.textContent = item.title;
      stateText.textContent = item.text;
      stateAction.innerHTML = "";
      const action = document.createElement("button");
      action.className = "button button-dark";
      action.type = "button";
      action.textContent = item.action;
      action.addEventListener("click", () => overlay.hidden = true);
      stateAction.appendChild(action);
      overlay.hidden = false;
      action.focus();
    });
  });
  closeState?.addEventListener("click", () => overlay.hidden = true);
  overlay?.addEventListener("click", e => { if (e.target === overlay) overlay.hidden = true; });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay && !overlay.hidden) overlay.hidden = true;
  });
})();
