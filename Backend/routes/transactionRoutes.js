const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
// PDF.js fallback for password-protected PDFs that pdf-parse can't open
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const Transaction = require("../model/transaction");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const dir = "uploads";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir + "/");
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Manual transaction add
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, type, category, amount, date } = req.body;

    if (!title || !type || !category || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = new Transaction({
      title,
      description,
      type,
      category,
      amount,
      date: date || new Date(),
      time: new Date().toLocaleTimeString(),
      userId: req.user.id,
      addedBy: req.user.name,
    });
    await transaction.save();
    res.status(201).json({ message: "Transaction added", transaction });
  } catch (err) {
    res.status(500).json({ message: "Failed to add transaction", error: err.message });
  }
});

// PDF upload and parsing
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const fileObj = req.file;
    if (!fileObj) return res.status(400).json({ message: "No file uploaded" });

    // Normalize incoming password
    let password = typeof req.body.password === 'string' ? req.body.password : null;
    if (password && typeof password === 'string') {
      password = password.trim();
    }
    console.log("[PDF Upload] Received password:", password ? `yes (len=${password.length})` : "no");
    const pdfBuffer = fs.readFileSync(fileObj.path);

    // Try to parse PDF with optional password; if provided, try variants before empty fallback
    let data;
    const tryParse = async (pwd) => pdfParse(pdfBuffer, pwd != null ? { password: pwd } : {});
    const candidates = [];
    if (password) {
      const trimmed = password.trim();
      const noSpaces = trimmed.replace(/\s+/g, "");
      candidates.push(trimmed);
      if (noSpaces && noSpaces !== trimmed) candidates.push(noSpaces);
      candidates.push(trimmed.toUpperCase());
      candidates.push(trimmed.toLowerCase());
    }
    let parsed = false, lastErr;
    for (const cand of candidates) {
      try {
        data = await tryParse(cand);
        parsed = true;
        break;
      } catch (e) {
        lastErr = e;
        console.log("[PDF Upload] Password candidate failed:", cand ? `(len=${cand.length})` : "<empty>", "reason:", String(e?.message || e));
        continue;
      }
    }
    if (!parsed) {
      try {
        data = await tryParse(""); // fallback empty password
        parsed = true;
      } catch (e) {
        lastErr = e;
        console.log("[PDF Upload] Empty password also failed:", String(e?.message || e));
      }
    }
    if (!parsed) {
      // Try to open with PDF.js using the same password candidates before failing
      console.log("[PDF Upload] pdf-parse could not decrypt. Trying PDF.js open with candidates...");
      const pdfjsTryOpen = async (pwd) => {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer), password: pwd || undefined });
        return loadingTask.promise; // resolves to doc if password is correct
      };

    // Extract time tokens from a text like "5:30 am", "17:45", or "17:45:20"
    const extractTime = (s = "") => {
      const text = String(s || "");
      // 12-hour with AM/PM
      const rx12 = /(\b\d{1,2}[:\.][0-5]\d(?:[:\.][0-5]\d)?\s?(?:AM|PM)\b)/i;
      const m12 = text.match(rx12);
      if (m12) return m12[1].toUpperCase().replace(/\./g, ":").replace(/\s+/g, " ");
      // 24-hour
      const rx24 = /(\b(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\b)/;
      const m24 = text.match(rx24);
      if (m24) return m24[1];
      return null;
    };
      const openCandidates = [...candidates, ""];
      for (const cand of openCandidates) {
        try {
          const doc = await pdfjsTryOpen(cand);
          console.log("[PDF Upload] PDF.js was able to open the document with a candidate password.");
          // Extract text using PDF.js if we could open it
          let fullText = "";
          const numPages = doc.numPages || 0;
          for (let i = 1; i <= numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(it => it.str).join(' ');
            fullText += strings + "\n";
          }
          data = { text: fullText };
          parsed = true;
          break;
        } catch (e) {
          console.log("[PDF Upload] PDF.js open failed for candidate:", cand ? `(len=${cand.length})` : "<empty>", "reason:", String(e?.message || e));
          continue;
        }
      }
      if (!parsed) {
        return res.status(401).json({
          message: "Failed to process PDF",
          error: "Incorrect or unsupported password. Please verify the exact statement password (no spaces) and try again.",
        });
      }
    }
    let text = (data && data.text) ? data.text : "";
    if (!text.trim()) {
      console.log("[PDF Upload] pdf-parse returned empty text. Trying PDF.js fallback...");
      // Try PDF.js fallback with the same password candidates
      const pdfjsTry = async (pwd) => {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer), password: pwd || undefined });
        const doc = await loadingTask.promise;
        let fullText = "";
        const numPages = doc.numPages || 0;
        for (let i = 1; i <= numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(it => it.str).join(' ');
          fullText += strings + "\n";
        }
        return fullText;
      };

      const pwdCandidates = [...candidates, ""];
      for (const pwd of pwdCandidates) {
        try {
          const extracted = await pdfjsTry(pwd);
          if (extracted && extracted.trim()) {
            text = extracted;
            console.log("[PDF Upload] PDF.js fallback succeeded with a candidate password.");
            break;
          }
        } catch (e) {
          console.log("[PDF Upload] PDF.js fallback failed for a candidate:", pwd ? `(len=${pwd.length})` : "<empty>", "reason:", String(e?.message || e));
          continue;
        }
      }

      if (!text.trim()) {
        return res.status(415).json({
          message: "Failed to process PDF",
          error: "The PDF appears to contain no extractable text or could not be decrypted. Verify the password or OCR the file.",
        });
      }
    }

    // Try to detect statement/account holder's name from header text
    const detectHolderName = (allText) => {
      // 1) Direct labels
      const candidates = [
        /account holder\s*[:\-]\s*([A-Za-z][A-Za-z\s\.&-]{2,})/i,
        /customer name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.&-]{2,})/i,
        /account name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.&-]{2,})/i,
        /name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.&-]{2,})/i
      ];
      for (const rx of candidates) {
        const m = allText.match(rx);
        if (m) return m[1].trim();
      }
      // 2) Honorific-based (Mr./Ms./Mrs./M/s)
      const honorific = allText.match(/\b(?:Mr|Ms|Mrs|M\/?s)\.?\s+([A-Za-z][A-Za-z\s\.&-]{2,})/i);
      if (honorific) return honorific[1].trim();
      // 3) Name near 'Savings Account'
      const nearSavings = allText.match(/\b([A-Za-z][A-Za-z\s\.&-]{2,})\s+Savings\s+Account/i);
      if (nearSavings) return nearSavings[1].trim();
      return null;
    };
    const holderName = detectHolderName(text);
    const holderNameClean = holderName && !(/\bdrawing\s+power\b/i.test(holderName)) && !(function(s){
      const alnum = s.replace(/[^A-Za-z0-9]/g, "");
      return alnum.length <= 3;
    })(holderName) ? sanitizeName(holderName) : null;

    // Normalize text and split lines
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const normalizeAmount = (val) => {
      if (!val) return 0;
      // Remove currency symbols and commas
      const cleaned = String(val).replace(/[₹,]/g, "").trim();
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : 0;
    };

    const parseDate = (s) => {
      // Supports dd/mm/yyyy or dd-mm-yyyy
      const m = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
      if (!m) return null;
      const [_, dd, mm, yyyy] = m;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    };

    const inferCategory = (desc, type) => {
      const d = desc.toLowerCase();
      if (type === "income") {
        if (d.includes("salary")) return "Salary";
        if (d.includes("interest")) return "Interest";
        if (d.includes("refund")) return "Refund";
        if (d.includes("upi") || d.includes("neft") || d.includes("imps")) return "Transfer In";
        return "Income";
      } else {
        if (d.includes("upi")) return "UPI";
        if (d.includes("pos") || d.includes("card")) return "Card";
        if (d.includes("atm")) return "ATM";
        if (d.includes("bill") || d.includes("electric") || d.includes("gas")) return "Bills";
        return "Expense";
      }
    };

    const extractCounterparty = (desc) => {
      // Try to extract a name or handle after common tags
      // Examples observed:
      // - UPI/CR/.../Sridevi/SBIN/sridevikos/UPI
      // - NEFT-REF-ACME LTD
      // - POS 1234 AMAZON
      // 1) UPI structured: try to capture a name-like token after UPI segments
      const upiName = desc.match(/upi\/[A-Za-z0-9\-_.@]+\/[A-Za-z0-9\-_.@]+\/([A-Za-z][A-Za-z\s\.&-]{2,})/i);
      if (upiName) return upiName[1].trim();
      // 2) UPI handle as fallback: take handle before '@'
      const upiHandle = desc.match(/\b([a-z][a-z0-9._-]{3,})@([a-z][a-z0-9._-]+)/i);
      if (upiHandle) return upiHandle[1].trim();
      // 3) NEFT with trailing party name
      const neftMatch = desc.match(/neft[\-\s]+(?:[A-Za-z0-9]+)[\-\s]+([A-Za-z][A-Za-z\s\.&-]{2,})/i);
      if (neftMatch) return neftMatch[1].trim();
      // 4) POS merchant
      const posMatch = desc.match(/pos\s+\d+\s+([A-Za-z][A-Za-z\s\.&-]{2,})/i);
      if (posMatch) return posMatch[1].trim();
      // 5) Generic: pick a reasonable name-like token (letters and spaces >= 3 chars)
      const generic = desc.match(/\b([A-Za-z][A-Za-z\s\.&-]{3,})\b/);
      if (generic) return generic[1].trim();
      // 6) Fallback: first token
      return desc.split(/\s+/).slice(0, 1).join(" ");
    };

    // Helper: filter out noisy placeholder names from statements
    const isNoisyParty = (s = "") => {
      const x = String(s).trim();
      if (!x) return true;
      const alnum = x.replace(/[^A-Za-z0-9]/g, "");
      if (alnum.length <= 3) return true;
      const noisePatterns = [
        /^b\s*\/?\s*f\b/i,         // B/F, B F
        /^b\s*in$/i,                 // B IN
        /^bal\.?\s*(in|out)?$/i,    // BAL, BAL IN/OUT
        /\bdrawing\s+power\b/i,     // Drawing Power artifact
        /^opening$/i,
        /^closing$/i,
        /^transfer$/i,
        /^cash$/i,
      ];
      return noisePatterns.some((rx) => rx.test(x));
    };

    // Sanitize name-like strings by removing known noise substrings
    const sanitizeName = (s = "") => {
      let v = String(s || "");
      v = v.replace(/\bdrawing\s+power\b/ig, "");
      v = v.replace(/\s{2,}/g, " ").trim();
      return v;
    };

    const txns = [];

    // Try to match common bank statement lines with date at start and debit/credit at end
    // Pattern assumes: DATE  DESCRIPTION ....  DEBIT   CREDIT   (or one of them)
    // 0) Columnar table parsing: Date | Details | Debit | Credit | Balance
    const headerIdx = lines.findIndex(l => /date/i.test(l) && /detail/i.test(l) && /debit/i.test(l) && /credit/i.test(l) && /balance/i.test(l));
    if (headerIdx >= 0) {
      const rowRx = /^(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{2}[\-\s][A-Za-z]{3}[\-\s]\d{2,4})\s+(.+?)\s+(-|[₹Rs\.,()\d\s]+)?\s+(-|[₹Rs\.,()\d\s]+)?\s+([₹Rs\.,()\d\s]+)$/i;
      const parseDateAny = (s) => {
        const d1 = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
        if (d1) {
          const dd = d1[1], mm = d1[2], yr = d1[3].length === 2 ? `20${d1[3]}` : d1[3];
          return new Date(`${yr}-${mm}-${dd}T00:00:00.000Z`);
        }
        const d2 = s.match(/(\d{2})[\-\s]([A-Za-z]{3})[\-\s](\d{2,4})/);
        if (d2) {
          const dd = d2[1], mon = d2[2].substr(0,3), y = d2[3];
          const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
          const mm = months[mon] || '01';
          const yr = y.length === 2 ? `20${y}` : y;
          return new Date(`${yr}-${mm}-${dd}T00:00:00.000Z`);
        }
        return null;
      };

      for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(rowRx);
        if (!m) continue;
        const [, dstr, details, debitStr, creditStr] = m;
        const dateObj = parseDateAny(dstr);
        if (!dateObj) continue;

        const toNumber = (val) => {
          if (!val || val === '-' ) return 0;
          let t = String(val).replace(/INR|Rs\.?|₹/gi, '').replace(/,/g, '').trim();
          const isParen = /^\(.*\)$/.test(t);
          if (isParen) t = t.replace(/[()]/g, '');
          const n = parseFloat(t);
          if (!Number.isFinite(n)) return 0;
          return isParen ? -Math.abs(n) : n;
        };

        const debit = toNumber(debitStr);
        const credit = toNumber(creditStr);
        let type, amount;
        if (credit > 0) { type = 'income'; amount = credit; }
        else if (debit > 0) { type = 'expense'; amount = debit; }
        else continue;

        const desc = (details || '').trim();
        const timeStr = extractTime(desc);
        let counterparty = extractCounterparty(desc);
        if (counterparty && isNoisyParty(counterparty)) counterparty = null;
        // Determine a short channel label for description only
        const channel = /upi/i.test(desc) ? 'UPI'
          : /neft/i.test(desc) ? 'NEFT'
          : /imps/i.test(desc) ? 'IMPS'
          : /(pos|card)/i.test(desc) ? 'Card'
          : /atm/i.test(desc) ? 'ATM'
          : /interest/i.test(desc) ? 'Interest'
          : '';
        // Enforce Account Name as title
        const title = holderNameClean || 'Account';
        // Category: Received/Transferred with counterparty (or Bank/Unknown)
        const category = type === 'income'
          ? `Received from ${counterparty || (channel === 'Interest' ? 'Bank' : 'Unknown')}`
          : `Transferred to ${counterparty || 'Unknown'}`;
        txns.push({
          title,
          description: channel, // keep description concise
          type,
          category,
          amount,
          date: dateObj,
          time: timeStr || undefined,
          userId: req.user.id,
          addedBy: req.user.name,
          file: fileObj.path,
          holderName: holderNameClean || undefined,
          counterparty: counterparty || undefined,
        });
      }
    }

    for (const line of lines) {
      const dateMatch = line.match(/^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.+?)\s+(-?[₹,\d\.]+)?\s+(-?[₹,\d\.]+)?$/);
      if (!dateMatch) continue;
      const [, dateStr, descRaw, col3, col4] = dateMatch;
      const dateObj = parseDate(dateStr);
      if (!dateObj) continue;

      const desc = descRaw.replace(/\s{2,}/g, " ").trim();
      const timeStr = extractTime(desc);
      const a = normalizeAmount(col3);
      const b = normalizeAmount(col4);

      // Infer which column is debit/credit
      let credit = 0, debit = 0;
      if (a > 0 && b === 0) {
        // Single amount present; infer based on keywords
        if (/cr\b|credit/i.test(line)) credit = a; else debit = a;
      } else if (b > 0 && a === 0) {
        if (/cr\b|credit/i.test(line)) credit = b; else debit = b;
      } else {
        // Both or none present; try to infer from context
        credit = b || 0; // assume last is credit when both present
        debit = a || 0;
      }

      const type = credit > 0 ? "income" : "expense";
      const amount = credit > 0 ? credit : debit;

      if (!amount || amount <= 0) continue;

      let counterparty = extractCounterparty(desc);
      if (counterparty && isNoisyParty(counterparty)) counterparty = null;
      if (counterparty) counterparty = sanitizeName(counterparty);
      const channel = /upi/i.test(desc) ? 'UPI'
        : /neft/i.test(desc) ? 'NEFT'
        : /imps/i.test(desc) ? 'IMPS'
        : /(pos|card)/i.test(desc) ? 'Card'
        : /atm/i.test(desc) ? 'ATM'
        : /interest/i.test(desc) ? 'Interest'
        : '';
      const title = holderName || 'Account';
      const category = type === 'income'
        ? `Received from ${counterparty || (channel === 'Interest' ? 'Bank' : 'Unknown')}`
        : `Transferred to ${counterparty || 'Unknown'}`;

      txns.push({
        title,
        description: channel,
        type,
        category,
        amount,
        date: dateObj,
        time: timeStr || undefined,
        userId: req.user.id,
        addedBy: req.user.name,
        file: fileObj.path,
        holderName: holderNameClean || undefined,
        counterparty: counterparty || undefined,
      });
    }

    // If no transactions found, run a more flexible second pass for diverse bank formats
    if (txns.length === 0) {
      console.log("[PDF Upload] Primary extraction found 0 records. Running flexible parser...");

      const parseDateExtended = (s) => {
        // dd/mm/yyyy, dd-mm-yyyy
        let m = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (m) {
          const [_, dd, mm, yyyy] = m;
          return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
        }
        // dd-MMM-yy or dd-MMM-yyyy (e.g., 01-Jan-24, 01-Jan-2024)
        m = s.match(/(\d{2})[\-\s]([A-Za-z]{3})[\-\s](\d{2,4})/);
        if (m) {
          const [_, dd, mon, y] = m;
          const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
          const mm = months[mon.substr(0,3)] || '01';
          const yyyy = y.length === 2 ? `20${y}` : y;
          return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
        }
        return null;
      };

      const amountTokenToNumber = (tok) => {
        if (!tok) return 0;
        // Remove INR, Rs, currency, commas, parentheses
        let t = String(tok).replace(/INR|Rs\.?|₹/gi, '').replace(/,/g, '').trim();
        // Handle amounts like 1,234.56CR or 1,234.56DR
        const cr = /CR\b/i.test(t);
        const dr = /DR\b/i.test(t);
        t = t.replace(/CR\b|DR\b/ig, '').trim();
        // Parentheses indicate negative (debit) in some statements
        const isParen = /^\(.*\)$/.test(t);
        if (isParen) t = t.replace(/[()]/g, '');
        const n = parseFloat(t);
        if (!Number.isFinite(n)) return 0;
        if (cr) return Math.abs(n);
        if (dr) return -Math.abs(n);
        if (isParen) return -Math.abs(n);
        return n;
      };

      const tryFlexible = (line) => {
        // Find a date anywhere in the line
        const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{2}[\-\s][A-Za-z]{3}[\-\s]\d{2,4})/);
        if (!dateMatch) return null;
        const dateObj = parseDateExtended(dateMatch[0]);
        if (!dateObj) return null;

        // Split tokens and attempt to find last numeric-looking token as amount
        const tokens = line.split(/\s+/).filter(Boolean);
        let amountTok = null;
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (/[0-9₹,\.]+(CR|DR)?$/i.test(tokens[i]) || /^\([0-9₹,\.]+\)$/.test(tokens[i])) {
            amountTok = tokens[i];
            break;
          }
        }
        if (!amountTok) return null;
        const amtNum = amountTokenToNumber(amountTok);
        if (!amtNum) return null;

        // Description: take everything between date token and amount token
        const dateIdx = tokens.findIndex(t => t.includes(dateMatch[0]));
        const amtIdx = tokens.lastIndexOf(amountTok);
        let desc = tokens.slice(dateIdx + 1, amtIdx).join(' ').trim();
        if (!desc) desc = line.replace(dateMatch[0], '').replace(amountTok, '').trim();

        // Determine channel and CR/DR to better infer credit/debit
        const channel = /upi/i.test(desc) ? 'UPI'
          : /neft/i.test(desc) ? 'NEFT'
          : /imps/i.test(desc) ? 'IMPS'
          : /(pos|card)/i.test(desc) ? 'Card'
          : /atm/i.test(desc) ? 'ATM'
          : /interest/i.test(desc) ? 'Interest'
          : '';
        let inferredType = amtNum > 0 ? 'income' : 'expense';
        if (/\bCR\b/i.test(line)) inferredType = 'income';
        if (/\bDR\b/i.test(line)) inferredType = 'expense';
        const type = inferredType;
        const amount = Math.abs(amtNum);
        let counterparty = extractCounterparty(desc);
        if (counterparty && isNoisyParty(counterparty)) counterparty = null;
        if (counterparty) counterparty = sanitizeName(counterparty);
        const category = type === 'income'
          ? `Received from ${counterparty || (channel === 'Interest' ? 'Bank' : 'Unknown')}`
          : `Transferred to ${counterparty || 'Unknown'}`;

        return {
          title: holderNameClean || 'Account',
          description: channel,
          type,
          category,
          amount,
          date: dateObj,
          time: new Date().toLocaleTimeString(),
          userId: req.user.id,
          addedBy: req.user.name,
          file: fileObj.path,
          holderName: holderNameClean || undefined,
          counterparty: counterparty || undefined,
        };
      };

      for (const line of lines) {
        const tx = tryFlexible(line);
        if (tx) txns.push(tx);
      }

      if (txns.length === 0) {
        try {
          const sidecar = fileObj.path + ".txt";
          fs.writeFileSync(sidecar, text, { encoding: 'utf8' });
          console.log("[PDF Upload] No transactions extracted. Saved extracted text to:", sidecar);
        } catch (e) {
          console.log("[PDF Upload] Failed to write sidecar text:", String(e?.message || e));
        }
        return res.status(400).json({ message: "Could not extract any transactions from the PDF. Please verify the statement format or provide password if protected." });
      }
    }

    await Transaction.insertMany(txns);
    res.status(201).json({ message: "Transactions extracted & saved", count: txns.length, transactions: txns });
  } catch (err) {
    const msg = /password/i.test(String(err.message)) ? "PDF is password protected. Please provide the correct password." : err.message;
    res.status(500).json({ message: "Failed to process PDF", error: msg });
  }
});

// Get all transactions for user
router.get("/", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions", error: err.message });
  }
});

module.exports = router;
