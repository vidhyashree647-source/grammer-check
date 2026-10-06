/* ==========================================================================
   AI GRAMMAR CHECKER & WRITING ASSISTANT - CORE JAVASCRIPT ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. DICTIONARY & RULE ENGINE DATABASE
  // =========================================================================

  const SPELLING_DICTIONARY = {
    "succesfully": "successfully",
    "succesful": "successful",
    "grammer": "grammar",
    "recieve": "receive",
    "recieved": "received",
    "seperate": "separate",
    "definatly": "definitely",
    "definitely": "definitely",
    "occured": "occurred",
    "occurance": "occurrence",
    "accomodate": "accommodate",
    "untill": "until",
    "goverment": "government",
    "thier": "their",
    "truely": "truly",
    "tommorow": "tomorrow",
    "tomorow": "tomorrow",
    "tommarow": "tomorrow",
    "enviroment": "environment",
    "neccessary": "necessary",
    "necessary": "necessary",
    "wont": "won't",
    "cant": "can't",
    "dont": "don't",
    "isnt": "isn't",
    "arent": "aren't",
    "didnt": "didn't",
    "shouldnt": "shouldn't",
    "couldnt": "couldn't",
    "wouldnt": "wouldn't",
    "doesnt": "doesn't",
    "hasnt": "hasn't",
    "havent": "haven't",
    "wasnt": "wasn't",
    "werent": "weren't",
    "alot": "a lot",
    "beleive": "believe",
    "beleived": "believed",
    "wierd": "weird",
    "expereince": "experience",
    "knowlege": "knowledge",
    "referance": "reference",
    "privilege": "privilege",
    "calender": "calendar",
    "independant": "independent",
    "maintenance": "maintenance",
    "pronunciation": "pronunciation",
    "resturant": "restaurant",
    "threshold": "threshold",
    "accidently": "accidentally",
    "embarass": "embarrass",
    "harrass": "harass",
    "persue": "pursue",
    "oppurtunity": "opportunity",
    "buisness": "business",
    "schedule": "schedule",
    "colleague": "colleague",
    "commited": "committed",
    "guarantee": "guarantee",
    "recommend": "recommend",
    "recomended": "recommended",
    "immediatly": "immediately",
    "truely": "truly"
  };

  const REPEATED_WORDS = ["the", "and", "in", "is", "it", "to", "of", "that", "you", "we", "for", "with", "on", "at"];

  const CAPITALIZATION_WORDS = {
    "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday", "thursday": "Thursday",
    "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday",
    "january": "January", "february": "February", "march": "March", "april": "April",
    "may": "May", "june": "June", "july": "July", "august": "August", "september": "September",
    "october": "October", "november": "November", "december": "December",
    "english": "English", "spanish": "Spanish", "french": "French", "german": "German"
  };

  const WORDY_EXPRESSIONS = [
    { target: "due to the fact that", replacement: "because", type: "suggestion", reason: "Conciseness: Replace wordy phrase." },
    { target: "at this point in time", replacement: "now", type: "suggestion", reason: "Conciseness: Simplify temporal phrase." },
    { target: "in order to", replacement: "to", type: "suggestion", reason: "Conciseness: Omit unnecessary filler." },
    { target: "a number of", replacement: "several", type: "suggestion", reason: "Conciseness: Use stronger single word." },
    { target: "utilize", replacement: "use", type: "suggestion", reason: "Clarity: Use simpler verb." },
    { target: "very unique", replacement: "unique", type: "suggestion", reason: "Style: 'Unique' is absolute and shouldn't be modified." }
  ];

  // =========================================================================
  // 2. STATE MANAGEMENT
  // =========================================================================

  let appState = {
    currentSection: 'home',
    currentText: '',
    detectedIssues: [],
    lastAnalysis: null,
    history: JSON.parse(localStorage.getItem('grammar_history') || '[]'),
    totalErrorsFixed: parseInt(localStorage.getItem('grammar_fixed_count') || '0'),
    activeMode: 'professional',
    activeIssueFilter: 'all'
  };

  // =========================================================================
  // 3. NAVIGATION ROUTER
  // =========================================================================

  function switchSection(sectionId) {
    if (!document.getElementById(`section-${sectionId}`)) return;

    appState.currentSection = sectionId;

    // Update section visibility
    document.querySelectorAll('.app-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`section-${sectionId}`);
    targetSection.classList.add('active');

    // Update nav menu active states
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-nav') === sectionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close mobile drawer if open
    document.getElementById('sidebar').classList.remove('open');

    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh view specific components
    if (sectionId === 'history') {
      renderHistoryView();
    }
  }

  // Setup click handlers for all data-nav items
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      const targetNav = navBtn.getAttribute('data-nav');
      switchSection(targetNav);
    }
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  // =========================================================================
  // 4. CLIENT-SIDE GRAMMAR CHECKING ENGINE
  // =========================================================================

  function analyzeText(text) {
    const issues = [];
    if (!text || text.trim() === '') {
      return { issues: [], score: 100, counts: { grammar: 0, spelling: 0, suggestion: 0, correct: 0 } };
    }

    // A. Repeated Words Check
    REPEATED_WORDS.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\s+\\1\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          id: `rep_${match.index}`,
          original: match[0],
          replacement: match[1],
          type: 'grammar',
          reason: `Repeated word: "${match[1]}" appears twice in a row.`,
          index: match.index,
          length: match[0].length
        });
      }
    });

    // B. Double / Multiple Spaces Check
    const spaceRegex = / {2,}/g;
    let spaceMatch;
    while ((spaceMatch = spaceRegex.exec(text)) !== null) {
      issues.push({
        id: `spc_${spaceMatch.index}`,
        original: spaceMatch[0],
        replacement: ' ',
        type: 'grammar',
        reason: 'Formatting: Multiple consecutive spaces detected.',
        index: spaceMatch.index,
        length: spaceMatch[0].length
      });
    }

    // C. Punctuation Spacing Checks
    // Space before comma or period (e.g. "word ,")
    const spaceBeforePunct = /(\w+)\s+([.,!?:;])/g;
    let pMatch;
    while ((pMatch = spaceBeforePunct.exec(text)) !== null) {
      issues.push({
        id: `punc1_${pMatch.index}`,
        original: pMatch[0],
        replacement: `${pMatch[1]}${pMatch[2]}`,
        type: 'grammar',
        reason: `Punctuation: Remove space before ${pMatch[2]}`,
        index: pMatch.index,
        length: pMatch[0].length
      });
    }

    // Missing space after comma/period (e.g. "word,word")
    const noSpaceAfterPunct = /(\b[a-zA-Z]+)([,;])([a-zA-Z]+\b)/g;
    let npMatch;
    while ((npMatch = noSpaceAfterPunct.exec(text)) !== null) {
      issues.push({
        id: `punc2_${npMatch.index}`,
        original: npMatch[0],
        replacement: `${npMatch[1]}${npMatch[2]} ${npMatch[3]}`,
        type: 'grammar',
        reason: `Punctuation: Add space after ${npMatch[2]}`,
        index: npMatch.index,
        length: npMatch[0].length
      });
    }

    // D. Spelling Dictionary Check & Capitalization
    const wordTokenRegex = /\b[a-zA-Z']+\b/g;
    let tokenMatch;
    while ((tokenMatch = wordTokenRegex.exec(text)) !== null) {
      const rawWord = tokenMatch[0];
      const lowerWord = rawWord.toLowerCase();
      const idx = tokenMatch.index;

      // 1. Dictionary typo check
      if (SPELLING_DICTIONARY[lowerWord]) {
        let replacement = SPELLING_DICTIONARY[lowerWord];
        if (rawWord[0] === rawWord[0].toUpperCase()) {
          replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        issues.push({
          id: `spl_${idx}`,
          original: rawWord,
          replacement: replacement,
          type: 'spelling',
          reason: `Spelling: Possible typo in "${rawWord}".`,
          index: idx,
          length: rawWord.length
        });
      }

      // 2. Standalone lowercase 'i'
      if (rawWord === 'i') {
        issues.push({
          id: `cap_i_${idx}`,
          original: 'i',
          replacement: 'I',
          type: 'grammar',
          reason: 'Capitalization: The pronoun "I" should always be capitalized.',
          index: idx,
          length: 1
        });
      }

      // 3. Proper Noun / Day / Month Capitalization
      if (CAPITALIZATION_WORDS[lowerWord] && rawWord !== CAPITALIZATION_WORDS[lowerWord]) {
        issues.push({
          id: `cap_prop_${idx}`,
          original: rawWord,
          replacement: CAPITALIZATION_WORDS[lowerWord],
          type: 'grammar',
          reason: `Capitalization: "${CAPITALIZATION_WORDS[lowerWord]}" should be capitalized.`,
          index: idx,
          length: rawWord.length
        });
      }
    }

    // E. Article Agreement ("a" vs "an")
    const aAnVowels = /\b(a)\s+([aeiou]\w+)\b/gi;
    let aMatch;
    while ((aMatch = aAnVowels.exec(text)) !== null) {
      // Exclude exceptions like "a university", "a user"
      if (!/^(university|user|unicorn|useful|european)/i.test(aMatch[2])) {
        issues.push({
          id: `art1_${aMatch.index}`,
          original: aMatch[0],
          replacement: `an ${aMatch[2]}`,
          type: 'grammar',
          reason: `Grammar: Use "an" before words starting with a vowel sound ("${aMatch[2]}").`,
          index: aMatch.index,
          length: aMatch[0].length
        });
      }
    }

    const anConsonants = /\b(an)\s+([bcdfghjklmnpqrstvwxyz]\w+)\b/gi;
    let anMatch;
    while ((anMatch = anConsonants.exec(text)) !== null) {
      // Exclude exceptions like "an hour", "an honest"
      if (!/^(hour|honest|honor)/i.test(anMatch[2])) {
        issues.push({
          id: `art2_${anMatch.index}`,
          original: anMatch[0],
          replacement: `a ${anMatch[2]}`,
          type: 'grammar',
          reason: `Grammar: Use "a" before words starting with a consonant sound ("${anMatch[2]}").`,
          index: anMatch.index,
          length: anMatch[0].length
        });
      }
    }

    // F. Common Subject-Verb & Homophone Errors
    const subVerbErrors = [
      { pattern: /\b(there|here)\s+is\s+([a-z]+s)\b/gi, fix: (m, p1, p2) => `${p1} are ${p2}`, reason: 'Subject-Verb: Plural noun requires "are".' },
      { pattern: /\b(they|we|you)\s+is\b/gi, fix: (m, p1) => `${p1} are`, reason: 'Subject-Verb: Plural subject requires "are".' },
      { pattern: /\b(he|she|it)\s+are\b/gi, fix: (m, p1) => `${p1} is`, reason: 'Subject-Verb: Singular subject requires "is".' },
      { pattern: /\b(he|she|it)\s+have\b/gi, fix: (m, p1) => `${p1} has`, reason: 'Subject-Verb: Singular subject requires "has".' },
      { pattern: /\b(you|we|they)\s+was\b/gi, fix: (m, p1) => `${p1} were`, reason: 'Subject-Verb: Plural past tense requires "were".' },
      { pattern: /\b(could|should|would)\s+of\b/gi, fix: (m, p1) => `${p1} have`, reason: 'Grammar: Incorrect usage of "of". Use "have" instead.' }
    ];

    subVerbErrors.forEach(rule => {
      let svMatch;
      while ((svMatch = rule.pattern.exec(text)) !== null) {
        issues.push({
          id: `sv_${svMatch.index}`,
          original: svMatch[0],
          replacement: rule.fix(svMatch[0], svMatch[1], svMatch[2]),
          type: 'grammar',
          reason: rule.reason,
          index: svMatch.index,
          length: svMatch[0].length
        });
      }
    });

    // G. Sentence Starting Capitalization
    const sentenceStartRegex = /(^|[.!?]\s+)([a-z])/g;
    let sMatch;
    while ((sMatch = sentenceStartRegex.exec(text)) !== null) {
      issues.push({
        id: `cap_sent_${sMatch.index}`,
        original: sMatch[0],
        replacement: `${sMatch[1]}${sMatch[2].toUpperCase()}`,
        type: 'grammar',
        reason: 'Capitalization: Start every new sentence with a capital letter.',
        index: sMatch.index,
        length: sMatch[0].length
      });
    }

    // H. Wordy & Style Suggestions
    WORDY_EXPRESSIONS.forEach(rule => {
      const regex = new RegExp(`\\b${rule.target}\\b`, 'gi');
      let wMatch;
      while ((wMatch = regex.exec(text)) !== null) {
        issues.push({
          id: `style_${wMatch.index}`,
          original: wMatch[0],
          replacement: rule.replacement,
          type: rule.type,
          reason: rule.reason,
          index: wMatch.index,
          length: wMatch[0].length
        });
      }
    });

    // Deduplicate overlapping issues at exact same index
    const uniqueIssues = [];
    const seenIndices = new Set();
    issues.forEach(iss => {
      if (!seenIndices.has(iss.index)) {
        seenIndices.add(iss.index);
        uniqueIssues.push(iss);
      }
    });

    // Sort issues by index ascending
    uniqueIssues.sort((a, b) => a.index - b.index);

    // Calculate Counts & Score
    const counts = {
      grammar: uniqueIssues.filter(i => i.type === 'grammar').length,
      spelling: uniqueIssues.filter(i => i.type === 'spelling').length,
      suggestion: uniqueIssues.filter(i => i.type === 'suggestion').length
    };

    const totalWords = text.trim().split(/\s+/).length;
    counts.correct = Math.max(0, totalWords - uniqueIssues.length);

    // Score Calculation Formula
    const penalty = (counts.grammar * 8) + (counts.spelling * 5) + (counts.suggestion * 2);
    const rawScore = 100 - penalty;
    const score = Math.max(15, Math.min(100, rawScore));

    return { issues: uniqueIssues, score, counts, text };
  }

  // =========================================================================
  // 5. EDITOR & CHECKER UI LOGIC
  // =========================================================================

  const checkerInput = document.getElementById('checker-input');
  const highlightOverlay = document.getElementById('checker-highlight-overlay');
  const btnCheck = document.getElementById('btn-check');
  const btnFixAll = document.getElementById('btn-fix-all');
  const btnClear = document.getElementById('btn-clear');
  const btnSample = document.getElementById('btn-sample');

  // Live Counter Updates
  function updateTextCounters() {
    const text = checkerInput.value || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const readTime = Math.ceil(words / 200);

    document.getElementById('cnt-words').textContent = words;
    document.getElementById('cnt-chars').textContent = chars;
    document.getElementById('cnt-sentences').textContent = sentences;
    document.getElementById('cnt-read-time').textContent = `${readTime} min`;

    // Synchronize highlight overlay scroll position
    highlightOverlay.scrollTop = checkerInput.scrollTop;
    highlightOverlay.scrollLeft = checkerInput.scrollLeft;
  }

  if (checkerInput) {
    checkerInput.addEventListener('input', () => {
      updateTextCounters();
      // Clear highlight overlay on edit until re-check
      highlightOverlay.innerHTML = escapeHtml(checkerInput.value);
    });

    checkerInput.addEventListener('scroll', () => {
      highlightOverlay.scrollTop = checkerInput.scrollTop;
      highlightOverlay.scrollLeft = checkerInput.scrollLeft;
    });

    // Shortcut: Ctrl+Enter to check
    checkerInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runCheck();
      }
    });
  }

  // Escape HTML helper
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Render Highlight Overlay inside editor mirror
  function renderHighlightOverlay(text, issues) {
    if (!issues || issues.length === 0) {
      highlightOverlay.innerHTML = escapeHtml(text);
      return;
    }

    let resultHtml = '';
    let lastIdx = 0;

    issues.forEach(iss => {
      resultHtml += escapeHtml(text.substring(lastIdx, iss.index));
      const classMap = {
        grammar: 'hl-grammar',
        spelling: 'hl-spelling',
        suggestion: 'hl-suggestion'
      };
      const cls = classMap[iss.type] || 'hl-grammar';
      resultHtml += `<span class="${cls}">${escapeHtml(text.substring(iss.index, iss.index + iss.length))}</span>`;
      lastIdx = iss.index + iss.length;
    });

    resultHtml += escapeHtml(text.substring(lastIdx));
    highlightOverlay.innerHTML = resultHtml;
  }

  // Execute Main Check Flow
  function runCheck() {
    const text = checkerInput.value;
    if (!text || text.trim() === '') {
      showToast('Please type or paste text to check!', 'warning');
      return;
    }

    // UI Loading state
    btnCheck.disabled = true;
    document.getElementById('btn-check-text').textContent = 'Scanning...';

    setTimeout(() => {
      const result = analyzeText(text);
      appState.detectedIssues = result.issues;
      appState.lastAnalysis = result;

      // Render Overlay Highlights
      renderHighlightOverlay(text, result.issues);

      // Render Issues Cards Stream
      renderIssuesList(result.issues);

      // Render Right AI Panel Metrics
      updateAnalysisPanel(result);

      // Enable/Disable Fix All
      btnFixAll.disabled = result.issues.length === 0;

      // Save Check to History
      saveCheckToHistory(result);

      // Reset Button UI
      btnCheck.disabled = false;
      document.getElementById('btn-check-text').textContent = '✨ Check Grammar';

      showToast(`Scan complete! Found ${result.issues.length} potential issues.`, 'info');
    }, 350);
  }

  if (btnCheck) {
    btnCheck.addEventListener('click', runCheck);
  }

  // Render Issues Cards List
  function renderIssuesList(issues) {
    const container = document.getElementById('issues-container');
    const countBadge = document.getElementById('issues-total-count');

    // Filter according to active tab
    const filtered = issues.filter(i => {
      if (appState.activeIssueFilter === 'all') return true;
      return i.type === appState.activeIssueFilter;
    });

    countBadge.textContent = `${filtered.length} issues`;

    if (!filtered || filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <h4>No ${appState.activeIssueFilter !== 'all' ? appState.activeIssueFilter : ''} issues detected!</h4>
          <p>Your writing looks polished and clean.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(iss => `
      <div class="issue-item type-${iss.type}" id="card_${iss.id}">
        <div class="issue-top">
          <span class="issue-tag tag-${iss.type}">${iss.type}</span>
        </div>
        <div class="issue-comparison">
          <span class="orig-word">${escapeHtml(iss.original)}</span>
          <span class="arrow-icon">&rarr;</span>
          <span class="suggest-word">${escapeHtml(iss.replacement)}</span>
        </div>
        <p class="issue-reason">${escapeHtml(iss.reason)}</p>
        <div class="issue-actions">
          <button class="btn btn-sm btn-primary btn-apply" data-issue-id="${iss.id}">
            <span>Apply Fix</span>
          </button>
        </div>
      </div>
    `).join('');

    // Attach listeners to individual "Apply Fix" buttons
    container.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-issue-id');
        applySingleFix(id);
      });
    });
  }

  // Issues Filter Tabs handler
  const filterTabs = document.getElementById('issues-filter-tabs');
  if (filterTabs) {
    filterTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        filterTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        appState.activeIssueFilter = e.target.getAttribute('data-filter');
        if (appState.lastAnalysis) {
          renderIssuesList(appState.lastAnalysis.issues);
        }
      }
    });
  }

  // Apply Single Issue Fix
  function applySingleFix(issueId) {
    const issue = appState.detectedIssues.find(i => i.id === issueId);
    if (!issue) return;

    let text = checkerInput.value;
    // Replace text at specific index
    const before = text.substring(0, issue.index);
    const after = text.substring(issue.index + issue.length);
    checkerInput.value = before + issue.replacement + after;

    appState.totalErrorsFixed++;
    localStorage.setItem('grammar_fixed_count', appState.totalErrorsFixed.toString());

    updateTextCounters();
    runCheck();
    showToast(`Applied correction: "${issue.original}" &rarr; "${issue.replacement}"`, 'success');
  }

  // Apply Fix All Errors
  function applyFixAll() {
    if (!appState.detectedIssues || appState.detectedIssues.length === 0) return;

    let text = checkerInput.value;
    let offset = 0;
    let fixedCount = 0;

    // Apply replacements in order of index
    appState.detectedIssues.forEach(iss => {
      const start = iss.index + offset;
      const end = start + iss.length;
      const before = text.substring(0, start);
      const after = text.substring(end);
      text = before + iss.replacement + after;
      offset += (iss.replacement.length - iss.length);
      fixedCount++;
    });

    checkerInput.value = text;
    appState.totalErrorsFixed += fixedCount;
    localStorage.setItem('grammar_fixed_count', appState.totalErrorsFixed.toString());

    updateTextCounters();
    runCheck();
    showToast(`Successfully fixed all ${fixedCount} issues automatically!`, 'success');
  }

  if (btnFixAll) {
    btnFixAll.addEventListener('click', applyFixAll);
  }

  // Clear & Sample Buttons
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      checkerInput.value = '';
      highlightOverlay.innerHTML = '';
      updateTextCounters();
      document.getElementById('issues-container').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <h4>No issues checked yet</h4>
          <p>Type some text above and click <strong>Check Grammar</strong> to scan for errors!</p>
        </div>
      `;
      btnFixAll.disabled = true;
      resetAnalysisPanel();
    });
  }

  const SAMPLE_TEXT = `the project has been completed succesfully by our team. i am writing to inform you that there is many new features we want to introduce. we should of checked the grammer earlier due to the fact that a number of errors occurred. its a very unique opportunity to utilize our skills. monday we will meet in order to finalize everything.`;

  if (btnSample) {
    btnSample.addEventListener('click', () => {
      checkerInput.value = SAMPLE_TEXT;
      updateTextCounters();
      runCheck();
    });
  }

  // Demo Button on Home Page
  const btnTryDemo = document.getElementById('btn-try-demo');
  if (btnTryDemo) {
    btnTryDemo.addEventListener('click', () => {
      switchSection('checker');
      checkerInput.value = SAMPLE_TEXT;
      updateTextCounters();
      runCheck();
    });
  }

  // Update Right AI Analysis Panel View
  function updateAnalysisPanel(result) {
    const score = result.score;
    const circle = document.getElementById('score-ring-circle');
    const scoreNum = document.getElementById('analysis-score');
    const scoreGrade = document.getElementById('analysis-grade');

    scoreNum.textContent = score;

    // Grade Text & Ring Color
    let grade = 'Perfect';
    let color = '#10b981';
    if (score < 50) { grade = 'Needs Work'; color = '#ef4444'; }
    else if (score < 75) { grade = 'Good'; color = '#f97316'; }
    else if (score < 95) { grade = 'Very Good'; color = '#3b82f6'; }

    scoreGrade.textContent = grade;
    scoreGrade.style.color = color;

    // SVG Stroke Animation
    const circumference = 440; // 2 * pi * 70
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = color;

    // Breakdown Tile Numbers
    document.getElementById('stat-grammar-count').textContent = result.counts.grammar;
    document.getElementById('stat-spelling-count').textContent = result.counts.spelling;
    document.getElementById('stat-suggestion-count').textContent = result.counts.suggestion;
    document.getElementById('stat-correct-count').textContent = `${score}%`;

    // Detailed Metric Bars
    const spellingAcc = Math.max(20, 100 - (result.counts.spelling * 12));
    const grammarAcc = Math.max(20, 100 - (result.counts.grammar * 15));
    const clarityScore = Math.max(20, 100 - (result.counts.suggestion * 10));

    document.getElementById('bar-clarity-val').textContent = `${clarityScore}%`;
    document.getElementById('bar-clarity-fill').style.width = `${clarityScore}%`;

    document.getElementById('bar-spelling-val').textContent = `${spellingAcc}%`;
    document.getElementById('bar-spelling-fill').style.width = `${spellingAcc}%`;

    document.getElementById('bar-grammar-val').textContent = `${grammarAcc}%`;
    document.getElementById('bar-grammar-fill').style.width = `${grammarAcc}%`;

    // Key Recommendation Text
    const recBox = document.getElementById('analysis-recommendation');
    if (result.issues.length === 0) {
      recBox.textContent = 'Your writing is clean, clear, and ready for publication!';
    } else if (result.counts.grammar > 0) {
      recBox.textContent = 'Focus on resolving subject-verb agreement and punctuation issues first.';
    } else if (result.counts.spelling > 0) {
      recBox.textContent = 'Correct the flagged typos to ensure professional readability.';
    } else {
      recBox.textContent = 'Consider applying style suggestions to make your sentences more concise.';
    }
  }

  function resetAnalysisPanel() {
    document.getElementById('analysis-score').textContent = '100';
    document.getElementById('analysis-grade').textContent = 'Perfect';
    document.getElementById('score-ring-circle').style.strokeDashoffset = 0;
    document.getElementById('stat-grammar-count').textContent = '0';
    document.getElementById('stat-spelling-count').textContent = '0';
    document.getElementById('stat-suggestion-count').textContent = '0';
    document.getElementById('stat-correct-count').textContent = '100%';
    document.getElementById('analysis-recommendation').textContent = 'Type or paste text above to run analysis.';
  }

  // =========================================================================
  // 6. PAGE 3: WRITING ASSISTANT ENGINE
  // =========================================================================

  const assistantInput = document.getElementById('assistant-input');
  const assistantOutput = document.getElementById('assistant-output');
  const modePills = document.getElementById('mode-pills-container');
  const activeModeBadge = document.getElementById('active-mode-badge');

  // Mode Selection Handler
  if (modePills) {
    modePills.addEventListener('click', (e) => {
      const pill = e.target.closest('.mode-pill');
      if (pill) {
        modePills.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        appState.activeMode = pill.getAttribute('data-mode');
        activeModeBadge.textContent = `Mode: ${appState.activeMode.charAt(0).toUpperCase() + appState.activeMode.slice(1)}`;
        showToast(`Writing mode set to ${appState.activeMode}`, 'info');
      }
    });
  }

  // Load Assistant Sample
  const btnAssistantSample = document.getElementById('btn-assistant-sample');
  if (btnAssistantSample) {
    btnAssistantSample.addEventListener('click', () => {
      assistantInput.value = `We are writing this email because we want to let you know that our team has finished making the app update. It has lots of new features and we think it is going to make users very happy. Please check it out when you have time and let us know what you think about it.`;
      showToast('Loaded Writing Assistant sample text!', 'info');
    });
  }

  // Writing Transformation Actions
  function transformWriting(actionType) {
    const text = assistantInput.value.trim();
    if (!text) {
      showToast('Please enter text into the Writing Assistant box!', 'warning');
      return;
    }

    let transformed = text;
    const mode = appState.activeMode;

    switch (actionType) {
      case 'improve':
        transformed = text
          .replace(/\bwant to let you know\b/gi, 'pleased to inform you')
          .replace(/\bfinished making\b/gi, 'successfully finalized')
          .replace(/\blots of\b/gi, 'numerous')
          .replace(/\bthink it is going to make\b/gi, 'anticipate it will significantly benefit')
          .replace(/\bvery happy\b/gi, 'highly satisfied')
          .replace(/\bwhen you have time\b/gi, 'at your earliest convenience')
          .replace(/\bwhat you think about it\b/gi, 'your valuable feedback');

        if (mode === 'academic') {
          transformed = transformed.replace(/\bWe are\b/gi, 'This report serves to')
            .replace(/\bour team\b/gi, 'the research team');
        } else if (mode === 'casual') {
          transformed = `Hey! Just wanted to share that we just wrapped up the app update. It's packed with cool features you'll love. Give it a spin and let us know what you think!`;
        } else if (mode === 'creative') {
          transformed = `With great excitement, our team unveils the latest evolution of our application—crafted with precision, enriched with powerful features, and designed to inspire every user.`;
        }
        break;

      case 'shorter':
        transformed = text
          .replace(/due to the fact that/gi, 'because')
          .replace(/at this point in time/gi, 'now')
          .replace(/in order to/gi, 'to')
          .replace(/a number of/gi, 'several')
          .replace(/because we want to let you know that/gi, 'to inform you that')
          .replace(/finished making the app update/gi, 'completed the app update')
          .replace(/It has lots of new features and we think it is going to make users very happy/gi, 'It features key enhancements for an improved user experience')
          .replace(/Please check it out when you have time and let us know what you think about it/gi, 'We welcome your feedback.');
        break;

      case 'professional':
        transformed = text
          .replace(/\bwant to let you know\b/gi, 'formally advise')
          .replace(/\bfinished making\b/gi, 'successfully delivered')
          .replace(/\blots of\b/gi, 'substantial')
          .replace(/\bhappy\b/gi, 'satisfied')
          .replace(/\bcheck it out\b/gi, 'review the release')
          .replace(/\blet us know\b/gi, 'provide your observations');
        break;

      case 'simplify':
        transformed = text
          .replace(/formally advise/gi, 'tell you')
          .replace(/successfully delivered/gi, 'finished')
          .replace(/substantial/gi, 'many')
          .replace(/anticipate it will significantly benefit/gi, 'will help')
          .replace(/at your earliest convenience/gi, 'soon');
        break;

      case 'suggestions':
        transformed = `💡 **AI Recommendations for Tone & Structure:**\n\n` +
          `1. **Clarity**: Rephrase passive expressions like "has been completed" into active voice.\n` +
          `2. **Conciseness**: Trim filler phrases ("want to let you know") to increase engagement.\n` +
          `3. **Vocabulary**: Upgrade generic descriptors ("happy", "nice") with mode-tailored words.\n` +
          `4. **Call to Action**: End with a clear, direct next step for the reader.`;
        break;
    }

    // Smooth output reveal
    assistantOutput.style.opacity = 0;
    setTimeout(() => {
      assistantOutput.textContent = transformed;
      assistantOutput.style.opacity = 1;
      updateAssistantMetrics(transformed);
    }, 200);

    showToast(`Generated ${actionType} transformation in ${mode} mode!`, 'success');
  }

  // Action Button Listeners
  document.getElementById('btn-act-improve')?.addEventListener('click', () => transformWriting('improve'));
  document.getElementById('btn-act-shorter')?.addEventListener('click', () => transformWriting('shorter'));
  document.getElementById('btn-act-professional')?.addEventListener('click', () => transformWriting('professional'));
  document.getElementById('btn-act-simplify')?.addEventListener('click', () => transformWriting('simplify'));
  document.getElementById('btn-act-suggestions')?.addEventListener('click', () => transformWriting('suggestions'));

  // Assistant Metrics Counter
  function updateAssistantMetrics(text) {
    if (!text || text.startsWith('💡 **AI Recommendations')) {
      document.getElementById('asst-readability').textContent = 'Standard';
      document.getElementById('asst-sentences').textContent = '0';
      document.getElementById('asst-words').textContent = '0';
      document.getElementById('asst-avg-len').textContent = '0';
      return;
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
    const avgLen = Math.round(words / sentences);

    let readGrade = 'Easy';
    if (avgLen > 18) readGrade = 'Advanced';
    else if (avgLen > 12) readGrade = 'Standard';

    document.getElementById('asst-readability').textContent = readGrade;
    document.getElementById('asst-sentences').textContent = sentences;
    document.getElementById('asst-words').textContent = words;
    document.getElementById('asst-avg-len').textContent = avgLen;
  }

  // Copy Result Button
  const btnCopyAssistant = document.getElementById('btn-copy-assistant');
  if (btnCopyAssistant) {
    btnCopyAssistant.addEventListener('click', () => {
      const text = assistantOutput.textContent;
      if (!text || text.includes('Select an action above')) {
        showToast('Nothing to copy yet!', 'warning');
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showToast('Transformed text copied to clipboard! 📋', 'success');
      }).catch(() => {
        showToast('Failed to copy text', 'warning');
      });
    });
  }

  // Send to Grammar Checker Button
  const btnSendToChecker = document.getElementById('btn-send-to-checker');
  if (btnSendToChecker) {
    btnSendToChecker.addEventListener('click', () => {
      const text = assistantOutput.textContent;
      if (!text || text.includes('Select an action above')) {
        showToast('Nothing to send yet!', 'warning');
        return;
      }
      checkerInput.value = text;
      switchSection('checker');
      updateTextCounters();
      runCheck();
      showToast('Text loaded into Grammar Checker!', 'info');
    });
  }

  // =========================================================================
  // 7. PAGE 4: HISTORY & LOCALSTORAGE MANAGER
  // =========================================================================

  function saveCheckToHistory(analysis) {
    const entry = {
      id: 'check_' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      score: analysis.score,
      text: analysis.text,
      grammarCount: analysis.counts.grammar,
      spellingCount: analysis.counts.spelling,
      suggestionCount: analysis.counts.suggestion,
      totalErrors: analysis.issues.length,
      issues: analysis.issues
    };

    appState.history.unshift(entry);
    if (appState.history.length > 20) appState.history.pop(); // Keep last 20

    localStorage.setItem('grammar_history', JSON.stringify(appState.history));
  }

  function renderHistoryView() {
    const history = appState.history;

    // Top Summary Stats Cards
    const totalChecks = history.length;
    const totalErrors = history.reduce((sum, h) => sum + h.totalErrors, 0);
    const avgScore = totalChecks > 0 ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / totalChecks) : 0;

    document.getElementById('hist-total-checks').textContent = totalChecks;
    document.getElementById('hist-total-errors').textContent = totalErrors;
    document.getElementById('hist-total-corrected').textContent = appState.totalErrorsFixed;
    document.getElementById('hist-avg-score').textContent = `${avgScore}%`;

    // Render SVG Line/Bar Analytics Chart
    renderAnalyticsChart(history);

    // Render Recent History Items
    renderHistoryItems(history);
  }

  function renderHistoryItems(history) {
    const container = document.getElementById('history-list-container');
    const searchVal = (document.getElementById('history-search-input')?.value || '').toLowerCase();

    const filtered = history.filter(h => h.text.toLowerCase().includes(searchVal));

    if (!filtered || filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h4>No saved check history found</h4>
          <p>Run grammar checks to view detailed reports here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(h => {
      let scoreClass = 'high';
      if (h.score < 60) scoreClass = 'low';
      else if (h.score < 85) scoreClass = 'medium';

      return `
        <div class="history-item-row" id="hist_${h.id}">
          <div class="hist-left">
            <span class="hist-time">⏱️ ${escapeHtml(h.timestamp)}</span>
            <p class="hist-preview">"${escapeHtml(h.text)}"</p>
          </div>
          <div class="hist-badges">
            <span class="badge-score ${scoreClass}">${h.score}/100</span>
            <span class="badge-err">${h.totalErrors} errors</span>
          </div>
          <div class="hist-actions">
            <button class="btn btn-xs btn-secondary btn-view-hist" data-hist-id="${h.id}">View</button>
            <button class="btn btn-xs btn-danger btn-del-hist" data-hist-id="${h.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach row button handlers
    container.querySelectorAll('.btn-view-hist').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-hist-id');
        openAnalysisModal(id);
      });
    });

    container.querySelectorAll('.btn-del-hist').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-hist-id');
        deleteHistoryItem(id);
      });
    });
  }

  // History Search Listener
  document.getElementById('history-search-input')?.addEventListener('input', () => {
    renderHistoryItems(appState.history);
  });

  // Delete Item
  function deleteHistoryItem(id) {
    appState.history = appState.history.filter(h => h.id !== id);
    localStorage.setItem('grammar_history', JSON.stringify(appState.history));
    renderHistoryView();
    showToast('Deleted item from history', 'info');
  }

  // Clear All History
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all saved grammar check history?')) {
      appState.history = [];
      localStorage.removeItem('grammar_history');
      renderHistoryView();
      showToast('Cleared check history!', 'success');
    }
  });

  // SVG Trend Chart Renderer
  function renderAnalyticsChart(history) {
    const chartWrap = document.getElementById('chart-svg-wrap');
    if (!chartWrap) return;

    if (!history || history.length < 2) {
      chartWrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-sub);font-size:0.9rem;">
          Run at least 2 grammar checks to view your score trend graph.
        </div>
      `;
      return;
    }

    // Use last 10 records chronological (oldest to newest)
    const pointsData = history.slice(0, 10).reverse();
    const width = 600;
    const height = 180;
    const padding = 30;

    const stepX = (width - padding * 2) / (pointsData.length - 1);
    const coords = pointsData.map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((d.score / 100) * (height - padding * 2));
      return { x, y, score: d.score, label: d.timestamp };
    });

    const pathD = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

    chartWrap.innerHTML = `
      <svg class="svg-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#a855f7" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Background Grid Lines -->
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
        <line x1="${padding}" y1="${height/2}" x2="${width - padding}" y2="${height/2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" />

        <!-- Area Fill -->
        <path d="${areaD}" fill="url(#chartGradient)" />

        <!-- Line Stroke -->
        <path d="${pathD}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />

        <!-- Data Dots -->
        ${coords.map(pt => `
          <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="#a855f7" stroke="#fff" stroke-width="2" />
          <text x="${pt.x}" y="${pt.y - 10}" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">${pt.score}%</text>
        `).join('')}
      </svg>
    `;
  }

  // Modal Analysis Handler
  function openAnalysisModal(id) {
    const item = appState.history.find(h => h.id === id);
    if (!item) return;

    document.getElementById('modal-item-title').textContent = `Check Report (${item.timestamp})`;

    const modalBody = document.getElementById('modal-item-body');
    modalBody.innerHTML = `
      <div style="background:rgba(0,0,0,0.3);padding:1rem;border-radius:8px;border:1px solid var(--glass-border);">
        <strong style="color:var(--text-sub);font-size:0.8rem;display:block;margin-bottom:0.4rem;">ORIGINAL TEXT:</strong>
        <p style="color:var(--text-main);font-size:0.95rem;line-height:1.6;">${escapeHtml(item.text)}</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:0.75rem;">
        <div style="background:var(--red-bg);padding:0.75rem;border-radius:8px;text-align:center;">
          <strong style="color:#ef4444;font-size:1.2rem;">${item.grammarCount}</strong>
          <span style="display:block;font-size:0.75rem;color:var(--text-muted);">Grammar</span>
        </div>
        <div style="background:var(--orange-bg);padding:0.75rem;border-radius:8px;text-align:center;">
          <strong style="color:#f97316;font-size:1.2rem;">${item.spellingCount}</strong>
          <span style="display:block;font-size:0.75rem;color:var(--text-muted);">Spelling</span>
        </div>
        <div style="background:var(--blue-bg);padding:0.75rem;border-radius:8px;text-align:center;">
          <strong style="color:#3b82f6;font-size:1.2rem;">${item.suggestionCount}</strong>
          <span style="display:block;font-size:0.75rem;color:var(--text-muted);">Suggestions</span>
        </div>
      </div>

      <div>
        <strong style="font-size:0.9rem;display:block;margin-bottom:0.5rem;">Detected Issues Breakdown:</strong>
        ${item.issues.length === 0 ? '<p style="color:var(--green)">No errors detected in this document.</p>' : ''}
        <div style="display:flex;flex-direction:column;gap:0.5rem;max-height:180px;overflow-y:auto;">
          ${item.issues.map(i => `
            <div style="background:rgba(255,255,255,0.03);padding:0.65rem;border-radius:6px;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="color:var(--red);text-decoration:line-through;margin-right:6px;">${escapeHtml(i.original)}</span>
                <span style="color:var(--green);font-weight:bold;">&rarr; ${escapeHtml(i.replacement)}</span>
              </div>
              <span style="font-size:0.75rem;color:var(--text-sub);">${i.type}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const modal = document.getElementById('modal-analysis');
    modal.classList.add('active');

    // Restore button in modal
    const restoreBtn = document.getElementById('btn-modal-restore');
    restoreBtn.onclick = () => {
      checkerInput.value = item.text;
      modal.classList.remove('active');
      switchSection('checker');
      updateTextCounters();
      runCheck();
    };
  }

  // Modal Close Handlers
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    document.getElementById('modal-analysis').classList.remove('active');
  });

  document.getElementById('btn-modal-close')?.addEventListener('click', () => {
    document.getElementById('modal-analysis').classList.remove('active');
  });

  // =========================================================================
  // 8. TOAST NOTIFICATION SYSTEM
  // =========================================================================

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '✅',
      info: '✨',
      warning: '⚠️'
    };

    toast.innerHTML = `
      <span>${iconMap[type] || '💡'}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Initial setup on page load
  updateTextCounters();
  renderHistoryView();

});
