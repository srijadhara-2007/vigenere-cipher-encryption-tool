/* ============================================================
   VIGENÈRE CIPHER — Application Logic
   ============================================================ */

(() => {
  "use strict";

  /* ---------- Element references ---------- */
  const tabEncrypt = document.getElementById("tabEncrypt");
  const tabDecrypt = document.getElementById("tabDecrypt");
  const tabIndicator = document.getElementById("tabIndicator");
  const inputText = document.getElementById("inputText");
  const inputCounter = document.getElementById("inputCounter");
  const inputError = document.getElementById("inputError");
  const keyword = document.getElementById("keyword");
  const keywordCounter = document.getElementById("keywordCounter");
  const keywordError = document.getElementById("keywordError");
  const actionBtn = document.getElementById("actionBtn");
  const actionLabel = actionBtn.querySelector(".btn__label");
  const clearBtn = document.getElementById("clearBtn");
  const outputText = document.getElementById("outputText");
  const outputCounter = document.getElementById("outputCounter");
  const copyBtn = document.getElementById("copyBtn");
  const toast = document.getElementById("toast");

  const MAX_MSG = 5000;
  const MAX_KEY = 50;
  let mode = "encrypt"; // 'encrypt' | 'decrypt'
  let toastTimer = null;

  /* ---------- Vigenère Cipher algorithm ---------- */
  // Processes only A-Z / a-z. Each alphabetic character is shifted by
  // the position of the corresponding keyword letter (A=0, B=1, ...).
  // Non-alphabetic characters pass through unchanged and do NOT
  // consume a keyword character. The keyword repeats automatically.
  function vigenere(text, key, encrypt) {
    // Build a clean keyword of letters only (preserve case handling via uppercase base)
    const cleanKey = key.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (cleanKey.length === 0) return text;

    const direction = encrypt ? 1 : -1;
    let keyIndex = 0;
    let result = "";

    for (const ch of text) {
      const code = ch.charCodeAt(0);

      if (code >= 65 && code <= 90) {
        // Uppercase A-Z
        const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
        result += String.fromCharCode(((code - 65 + direction * shift) % 26 + 26) % 26 + 65);
        keyIndex++;
      } else if (code >= 97 && code <= 122) {
        // Lowercase a-z
        const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
        result += String.fromCharCode(((code - 97 + direction * shift) % 26 + 26) % 26 + 97);
        keyIndex++;
      } else {
        // Spaces, numbers, punctuation — unchanged, don't advance key
        result += ch;
      }
    }

    return result;
  }

  /* ---------- Tab handling ---------- */
  function moveIndicator(activeTab) {
    const rect = activeTab.getBoundingClientRect();
    const parentRect = activeTab.parentElement.getBoundingClientRect();
    tabIndicator.style.width = `${rect.width}px`;
    tabIndicator.style.transform = `translateX(${rect.left - parentRect.left - 4}px)`;
  }

  function setMode(newMode) {
    mode = newMode;
    const isEncrypt = mode === "encrypt";
    tabEncrypt.classList.toggle("tab--active", isEncrypt);
    tabDecrypt.classList.toggle("tab--active", !isEncrypt);
    tabEncrypt.setAttribute("aria-selected", String(isEncrypt));
    tabDecrypt.setAttribute("aria-selected", String(!isEncrypt));
    actionLabel.textContent = isEncrypt ? "Encrypt" : "Decrypt";
    moveIndicator(isEncrypt ? tabEncrypt : tabDecrypt);
    if (inputText.value.trim() && keyword.value.trim()) runCipher();
  }

  /* ---------- Counters ---------- */
  function updateInputCounter() {
    inputCounter.textContent = `${inputText.value.length} / ${MAX_MSG}`;
  }
  function updateKeywordCounter() {
    keywordCounter.textContent = `${keyword.value.length} / ${MAX_KEY}`;
  }
  function updateOutputCounter() {
    outputCounter.textContent = `${outputText.value.length}`;
  }

  /* ---------- Validation ---------- */
  function validate() {
    let ok = true;

    if (inputText.value.length === 0) {
      inputError.textContent = "Please enter a message to process.";
      ok = false;
    } else if (inputText.value.length > MAX_MSG) {
      inputError.textContent = `Message exceeds the ${MAX_MSG} character limit.`;
      ok = false;
    } else {
      inputError.textContent = "";
    }

    const keyVal = keyword.value;
    if (keyVal.length === 0) {
      keywordError.textContent = "Please enter a secret keyword.";
      ok = false;
    } else if (!/[a-zA-Z]/.test(keyVal)) {
      keywordError.textContent = "Keyword must contain at least one letter.";
      ok = false;
    } else {
      keywordError.textContent = "";
    }

    return ok;
  }

  /* ---------- Core run ---------- */
  function runCipher() {
    if (!validate()) {
      outputText.value = "";
      updateOutputCounter();
      return;
    }
    const result = vigenere(inputText.value, keyword.value, mode === "encrypt");
    outputText.value = result;
    updateOutputCounter();
  }

  /* ---------- Clear ---------- */
  function clearAll() {
    inputText.value = "";
    keyword.value = "";
    outputText.value = "";
    inputError.textContent = "";
    keywordError.textContent = "";
    updateInputCounter();
    updateKeywordCounter();
    updateOutputCounter();
    inputText.focus();
  }

  /* ---------- Copy + toast ---------- */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("toast--visible"), 2200);
  }

  async function copyOutput() {
    const value = outputText.value;
    if (!value) {
      showToast("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showToast("Copied to clipboard");
    } catch {
      outputText.removeAttribute("readonly");
      outputText.select();
      document.execCommand("copy");
      outputText.setAttribute("readonly", "");
      showToast("Copied to clipboard");
    }
  }

  /* ---------- Ripple effect ---------- */
  function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  /* ---------- Event wiring ---------- */
  tabEncrypt.addEventListener("click", () => setMode("encrypt"));
  tabDecrypt.addEventListener("click", () => setMode("decrypt"));

  inputText.addEventListener("input", () => {
    updateInputCounter();
    validate();
  });
  keyword.addEventListener("input", () => {
    updateKeywordCounter();
    validate();
  });

  actionBtn.addEventListener("click", runCipher);
  clearBtn.addEventListener("click", clearAll);
  copyBtn.addEventListener("click", copyOutput);

  [actionBtn, clearBtn, copyBtn].forEach((b) => b.addEventListener("click", createRipple));

  // Ctrl + Enter shortcut
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCipher();
    }
  });

  // Recalculate indicator on resize
  window.addEventListener("resize", () =>
    moveIndicator(mode === "encrypt" ? tabEncrypt : tabDecrypt)
  );

  /* ---------- Boot ---------- */
  updateInputCounter();
  updateKeywordCounter();
  updateOutputCounter();
  requestAnimationFrame(() => moveIndicator(tabEncrypt));
})();
