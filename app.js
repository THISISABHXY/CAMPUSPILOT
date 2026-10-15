/* ═══════════════════════════════════════════════════════
   CAMPUSPILOT — app.js
   Mock AI Agent, Navigation, Services, Multilingual
   ═══════════════════════════════════════════════════════ */

'use strict';

// ─── Students Database & Auth State ──────────────────
const DEFAULT_STUDENTS = [
  {
    name: 'Priya Sharma',
    email: 'demo@college.edu',
    roll: 'CS21045',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    phone: '9876543210',
    pin: '1234',
    avatarLetter: 'P',
    avatarGradient: 'linear-gradient(135deg, #7c6fef, #9d93f5)'
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@college.edu',
    roll: 'EC22031',
    department: 'Electronics & Communication',
    year: '2nd Year',
    phone: '9812345678',
    pin: '1234',
    avatarLetter: 'R',
    avatarGradient: 'linear-gradient(135deg, #38bdf8, #818cf8)'
  }
];

function getStoredStudents() {
  try {
    const raw = localStorage.getItem('campuspilot_students');
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn(e); }
  return [...DEFAULT_STUDENTS];
}

function saveStudents(list) {
  try {
    localStorage.setItem('campuspilot_students', JSON.stringify(list));
  } catch (e) { console.warn(e); }
}

let currentLang = 'en';
let currentTab  = 'home';
let currentUser = DEFAULT_STUDENTS[0];
let currentAuthMode = 'register';
let pendingAction = null;
let selectedBuilding = null;
let auditTrail = [];
let isListening = false;
let voiceTimeout = null;

// ─── i18n Strings ─────────────────────────────────────
const strings = {
  en: {
    home: 'Home', agent: 'AI Agent', map: 'Map', services: 'Services',
    classes_today: 'Classes Today', pending: 'Pending Tasks', done: 'Done This Week',
    next_class: 'Next Class', quick_actions: 'Quick Actions',
    bonafide_cert: 'Bonafide Cert', lab_booking: 'Lab Booking',
    wifi_complaint: 'WiFi Issue', id_card: 'Lost ID Card', library: 'Library', printer: 'Find Printer',
    recent_actions: 'Recent Actions',
    agent_desc: 'Ask me anything about your campus',
    welcome_msg: "Hi Priya! 👋 I'm your Campus AI Agent. I can help you book labs, get certificates, report issues, or navigate anywhere on campus. What do you need?",
    ask_anything: 'Ask anything...',
    listening: 'Listening...', voice_hint: 'Speak your request in English or Hindi',
    send_otp: 'Send OTP', verify_login: 'Verify & Login',
  },
  hi: {
    home: 'होम', agent: 'AI एजेंट', map: 'नक्शा', services: 'सेवाएं',
    classes_today: 'आज की कक्षाएं', pending: 'बाकी काम', done: 'इस हफ्ते पूरे',
    next_class: 'अगली कक्षा', quick_actions: 'त्वरित क्रियाएं',
    bonafide_cert: 'बोनाफाइड सर्टिफिकेट', lab_booking: 'लैब बुकिंग',
    wifi_complaint: 'WiFi समस्या', id_card: 'ID कार्ड खोया', library: 'पुस्तकालय', printer: 'प्रिंटर ढूंढें',
    recent_actions: 'हाल की कार्रवाइयां',
    agent_desc: 'कैंपस के बारे में कुछ भी पूछें',
    welcome_msg: "नमस्ते Priya! 👋 मैं आपका Campus AI Agent हूं। मैं लैब बुकिंग, सर्टिफिकेट, शिकायत दर्ज करना, या कैंपस में नेविगेशन में मदद कर सकता हूं।",
    ask_anything: 'कुछ भी पूछें...', 
    listening: 'सुन रहा हूं...', voice_hint: 'अंग्रेजी या हिंदी में बोलें',
    send_otp: 'OTP भेजें', verify_login: 'सत्यापित करें',
  }
};

// ─── Campus Data ───────────────────────────────────────
const campusData = {
  buildings: [
    { id:'physics-lab', name:'Physics Lab', icon:'⚛️', category:'labs', status:'open', hours:'9 AM – 6 PM', room:'Room 204', details:'Advanced physics experiments, optics, and quantum mechanics setup. Accessible via ramp (east entrance).', tags:['labs'], x:33, y:43 },
    { id:'chem-lab', name:'Chemistry Lab', icon:'🧪', category:'labs', status:'open', hours:'9 AM – 5 PM', room:'Room 301', details:'Organic, inorganic and analytical chemistry labs. Safety equipment mandatory.', tags:['labs'], x:60, y:43 },
    { id:'cs-block', name:'CS Block', icon:'💻', category:'labs', status:'open', hours:'8 AM – 8 PM', room:'Block B', details:'Programming labs, server room, AI research lab. Open till 8pm on weekdays.', tags:['labs','academic'], x:35, y:15 },
    { id:'library', name:'Library', icon:'📚', category:'academic', status:'open', hours:'8 AM – 9 PM', room:'', details:'50,000+ books. Separate reference and study zones. Printers available on Floor 1.', tags:['academic','facilities'], x:55, y:18 },
    { id:'canteen', name:'Canteen', icon:'🍛', category:'facilities', status:'open', hours:'7:30 AM – 9 PM', room:'', details:'North and south wings. Daily specials on notice board. Accepts campus card.', tags:['facilities'], x:18, y:28 },
    { id:'admin', name:'Administrative Office', icon:'🏛', category:'academic', status:'open', hours:'9 AM – 5 PM', room:'Ground Floor', details:'Certificates, approvals, grievances, and fee-related queries.', tags:['academic'], x:10, y:52 },
    { id:'medical', name:'Medical Center', icon:'🏥', category:'facilities', status:'open', hours:'24 Hours', room:'', details:'24/7 first aid. Doctor on duty: Mon–Sat 9am–6pm. Emergency: x1122.', tags:['facilities'], x:10, y:68 },
    { id:'hostel-a', name:'Hostel Block A', icon:'🏠', category:'hostel', status:'open', hours:'Access: 24 Hours', room:'', details:'Boys hostel. 200 rooms. Common room on each floor. WiFi: HostelA-Net.', tags:['hostel'], x:80, y:18 },
    { id:'hostel-b', name:'Hostel Block B', icon:'🏠', category:'hostel', status:'open', hours:'Access: 24 Hours', room:'', details:'Girls hostel. 180 rooms. Study room on Ground Floor. WiFi: HostelB-Net.', tags:['hostel'], x:80, y:38 },
    { id:'main-building', name:'Main Building', icon:'🎓', category:'academic', status:'open', hours:'7 AM – 7 PM', room:'', details:'Administrative hub, principal office, examination cell, and conference halls.', tags:['academic'], x:48, y:60 },
    { id:'sports', name:'Sports Ground', icon:'⚽', category:'facilities', status:'open', hours:'6 AM – 8 PM', room:'', details:'Football field, running track, basketball and volleyball courts.', tags:['facilities'], x:82, y:58 },
  ],
  printers: [
    { name:'Library Floor 1 Printer', location:'Library', status:'available' },
    { name:'CS Block Lab 3 Printer', location:'CS Block', status:'busy' },
    { name:'Admin Office Printer', location:'Admin Office', status:'available' },
  ],
  labSlots: {
    'Physics Lab': ['9:00 AM','11:00 AM','2:00 PM','4:00 PM'],
    'Chemistry Lab': ['9:00 AM','11:00 AM','2:00 PM'],
    'CS Block': ['9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM'],
  }
};

// ─── AI Intent Engine ──────────────────────────────────
const intents = [
  {
    patterns: ['book','reserve','slot','physics lab','chemistry lab','cs lab','chem lab', 'बुक', 'लैब'],
    handler: handleLabBooking,
  },
  {
    patterns: ['bonafide','bona fide','certificate','cert','बोनाफाइड','सर्टिफिकेट'],
    handler: handleBonafide,
  },
  {
    patterns: ['wifi','wi-fi','internet','network','hostel wifi','down','slow','टिकट','WiFi','शिकायत'],
    handler: handleWifiComplaint,
  },
  {
    patterns: ['id card','id lost','identity card','lost card','replacement','ID कार्ड','खो गया'],
    handler: handleIDCard,
  },
  {
    patterns: ['printer','print','where.*print','nearest printer','प्रिंटर'],
    handler: handlePrinter,
  },
  {
    patterns: ['navigate','navigation','get to','where is','how do i get','show.*way','रास्ता','कहां है','नेविगेट'],
    handler: handleNavigation,
  },
  {
    patterns: ['library','book','borrow','return','पुस्तकालय'],
    handler: handleLibrary,
  },
  {
    patterns: ['canteen','food','eat','lunch','menu','canteen timing','खाना','कैंटीन'],
    handler: handleCanteen,
  },
  {
    patterns: ['timetable','schedule','class','classes','today','कक्षा','समय सारिणी'],
    handler: handleTimetable,
  },
  {
    patterns: ['hello','hi','hey','help','नमस्ते','हेलो','मदद'],
    handler: handleGreeting,
  },
];

function matchIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of intents) {
    if (intent.patterns.some(p => new RegExp(p, 'i').test(lower))) {
      return intent.handler;
    }
  }
  return handleUnknown;
}

// ─── AI Response Handlers ──────────────────────────────
function handleGreeting(text) {
  return {
    message: currentLang === 'hi'
      ? "नमस्ते! 😊 मैं आपकी मदद कर सकता हूं:\n• लैब बुक करना\n• बोनाफाइड सर्टिफिकेट\n• WiFi शिकायत\n• कैंपस नेविगेशन\n\nक्या चाहिए आपको?"
      : "Hello! 😊 I can help you with:\n• Lab bookings\n• Bonafide certificates\n• WiFi / IT complaints\n• Campus navigation\n\nWhat do you need today?",
    source: null, actionType: null
  };
}

function handleLabBooking(text) {
  // Detect which lab
  let lab = 'Physics Lab';
  if (/chem/i.test(text)) lab = 'Chemistry Lab';
  if (/cs|computer/i.test(text)) lab = 'CS Block';

  // Detect time
  let time = '2:00 PM';
  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (timeMatch) time = timeMatch[1];

  return {
    message: currentLang === 'hi'
      ? `मैं **${lab}** को ${time} के लिए बुक करना चाहता हूं। क्या आप पुष्टि करते हैं?\n\n📍 **${lab}**\n⏰ **${time}** • अगले उपलब्ध स्लॉट\n👤 **${currentUser.name || 'Student'}** (${currentUser.roll || 'ID'})`
      : `I'll book **${lab}** for you at ${time}.\n\n📍 **${lab}**\n⏰ **${time}** • Next available slot\n👤 **${currentUser.name || 'Student'}** (${currentUser.roll || 'ID'})\n\nShall I confirm this booking?`,
    source: '📘 Source: Campus Lab Booking Policy v2.3',
    actionType: 'lab_booking',
    actionData: { lab, time, room: campusData.buildings.find(b=>b.name===lab)?.room || 'TBD' },
    confirmText: `Book ${lab} at ${time}?`,
    confirmBtnText: 'Confirm Booking',
  };
}

function handleBonafide(text) {
  return {
    message: currentLang === 'hi'
      ? "बोनाफाइड सर्टिफिकेट के लिए:\n1. आवेदन विभाग को जाएगा ✅\n2. HOD का अनुमोदन (1-2 दिन)\n3. Admin seal और डिजिटल हस्ताक्षर\n4. PDF डाउनलोड के लिए उपलब्ध\n\nक्या मैं आवेदन दाखिल करूं?"
      : "For a Bonafide Certificate:\n1. Application sent to your department ✅\n2. HOD approval (1–2 working days)\n3. Admin seal + digital signature\n4. PDF ready for download\n\nShall I file the application now?",
    source: '📘 Source: Academic Handbook 2024, Section 4.2',
    actionType: 'bonafide',
    actionData: { purpose: 'General', studentId: currentUser.roll },
    confirmText: 'File bonafide certificate application?',
    confirmBtnText: 'Submit Application',
  };
}

function handleWifiComplaint(text) {
  let location = 'Campus';
  if (/hostel|block/i.test(text)) location = 'Hostel Block';
  if (/block a/i.test(text)) location = 'Hostel Block A';
  if (/block b/i.test(text)) location = 'Hostel Block B';
  if (/library/i.test(text)) location = 'Library';

  return {
    message: currentLang === 'hi'
      ? `${location} में WiFi समस्या की रिपोर्ट करेंगे। IT टीम को टिकट भेजा जाएगा और आमतौर पर 2-4 घंटे में हल हो जाता है।`
      : `I'll file a WiFi complaint for **${location}**.\n\n📡 **Issue:** Connectivity problem\n📍 **Location:** ${location}\n⏱ Avg resolution: 2–4 hours\n🔔 You'll be notified when resolved.`,
    source: '📘 Source: IT Help Desk Policy, Campus Handbook',
    actionType: 'wifi',
    actionData: { location, issueType: 'Connectivity' },
    confirmText: `File WiFi complaint for ${location}?`,
    confirmBtnText: 'File Ticket',
  };
}

function handleIDCard(text) {
  return {
    message: currentLang === 'hi'
      ? "ID कार्ड खो जाने पर:\n1. तुरंत रिपोर्ट करना जरूरी है\n2. एक FIR-जैसी शिकायत दर्ज होगी\n3. अस्थायी ID 24 घंटे में मिलेगी\n4. नया कार्ड 3-5 दिन में\n\nक्या रिपोर्ट दर्ज करूं?"
      : "For a lost ID card:\n1. Immediate report filed (audit logged)\n2. Temporary ID issued within 24 hours\n3. Replacement card in 3–5 days\n⚠️ Access suspended on lost card immediately.\n\nShall I report it now?",
    source: '📘 Source: Student Services Manual, Section 7.1',
    actionType: 'id_card',
    actionData: { studentId: currentUser.roll },
    confirmText: 'Report lost ID card and request replacement?',
    confirmBtnText: 'Report & Request',
  };
}

function handlePrinter(text) {
  const available = campusData.printers.filter(p => p.status === 'available');
  const nearest = available[0];
  return {
    message: currentLang === 'hi'
      ? `निकटतम उपलब्ध प्रिंटर:\n🖨 **${nearest.name}**\n📍 ${nearest.location}\n✅ अभी उपलब्ध है`
      : `Nearest available printer:\n\n🖨 **${nearest.name}**\n📍 ${nearest.location} • ✅ Available now\n\n${campusData.printers.map(p=>`• ${p.name} — ${p.status==='available'?'✅ Available':'⏳ Busy'}`).join('\n')}`,
    source: '📘 Source: Campus Facilities Database (live)',
    actionType: 'navigate',
    actionData: { destination: nearest.location },
    confirmText: `Navigate to ${nearest.location}?`,
    confirmBtnText: 'Navigate',
  };
}

function handleNavigation(text) {
  let dest = 'Library';
  for (const b of campusData.buildings) {
    if (new RegExp(b.name, 'i').test(text)) { dest = b.name; break; }
  }
  return {
    message: currentLang === 'hi'
      ? `${dest} के लिए रास्ता:\n📍 **CS Block → Main Path → ${dest}**\n🚶 अनुमानित समय: 4 मिनट\n♿ व्हीलचेयर रैंप: पूर्व प्रवेश द्वार`
      : `Directions to **${dest}**:\n\n📍 **Your Location → Main Path → ${dest}**\n🚶 Est. walk time: ~4 minutes\n♿ Wheelchair accessible via East entrance\n\nOpening map now…`,
    source: '📘 Source: Campus Map v4.1 (OpenStreetMap data)',
    actionType: 'navigate',
    actionData: { destination: dest },
    autoAction: () => { switchTab('map'); setTimeout(() => showBuildingInfo(dest), 600); },
  };
}

function handleLibrary(text) {
  return {
    message: currentLang === 'hi'
      ? "📚 पुस्तकालय जानकारी:\n⏰ 8 AM – 9 PM\n📖 50,000+ पुस्तकें\n🖨 प्रिंटर उपलब्ध (Floor 1)\n💻 डिजिटल लाइब्रेरी: lib.college.edu\n\nकोई पुस्तक ढूंढनी है?"
      : "📚 **Library Info:**\n⏰ Open: 8 AM – 9 PM\n📖 50,000+ books available\n🖨 Printers on Floor 1\n💻 Digital library: lib.college.edu\n\nDue books reminder: you have **1 book due in 3 days**.",
    source: '📘 Source: Library Management System',
    actionType: 'navigate',
    actionData: { destination: 'Library' },
    confirmText: 'Navigate to Library?',
    confirmBtnText: 'Navigate',
  };
}

function handleCanteen(text) {
  return {
    message: currentLang === 'hi'
      ? "🍛 **आज का मेनू:**\n• दाल-चावल + सब्जी ₹40\n• वेज थाली ₹60\n• चाय/कॉफ़ी ₹15\n\n⏰ समय: 7:30 AM – 9 PM\n💳 Campus Card स्वीकार"
      : "🍛 **Today's Canteen Menu:**\n• Dal Rice + Sabzi — ₹40\n• Veg Thali — ₹60\n• Tea / Coffee — ₹15\n• Special: Paneer Butter Masala — ₹70\n\n⏰ Hours: 7:30 AM – 9 PM\n💳 Accepts Campus Card",
    source: '📘 Source: Canteen Notice Board (updated today)',
    actionType: null,
  };
}

function handleTimetable(text) {
  return {
    message: currentLang === 'hi'
      ? "📅 **आज की कक्षाएं:**\n\n9:00 AM – Quantum Mechanics (Physics Lab 204)\n11:00 AM – Data Structures (CS Block, Lab 2)\n2:00 PM – Technical Writing (Main Hall 101)\n\n⏰ अगली कक्षा: 23 मिनट में"
      : "📅 **Today's Schedule:**\n\n🕘 9:00 AM – Quantum Mechanics\n📍 Physics Lab, Room 204\n\n🕚 11:00 AM – Data Structures\n📍 CS Block, Lab 2\n\n🕑 2:00 PM – Technical Writing\n📍 Main Hall 101\n\n⏰ **Next class in 23 minutes!**",
    source: '📘 Source: Student Academic Portal (your timetable)',
    actionType: null,
  };
}

function handleUnknown(text) {
  return {
    message: currentLang === 'hi'
      ? `"${text}" के बारे में मुझे यकीन नहीं है। 🙏\n\nमैं यह करने में मदद कर सकता हूं:\n• लैब बुकिंग\n• सर्टिफिकेट\n• WiFi शिकायत\n• कैंपस नेविगेशन\n\nया किसी इंसान से बात करें: helpdesk@college.edu`
      : `I'm not sure about "${text}". 🙏\n\nI can help with:\n• Lab bookings\n• Certificates\n• WiFi / IT complaints  \n• Campus navigation\n• Timetable & canteen\n\nFor anything else, contact: helpdesk@college.edu\n*(Escalating to human support if needed)*`,
    source: '⚠️ I\'m not sure — escalating to human agent',
    actionType: null,
  };
}

// ─── Chat Functions ────────────────────────────────────
function sendMessage(text) {
  const input = document.getElementById('chat-input');
  const msg = text || (input ? input.value.trim() : '');
  if (!msg) return;

  // Clear input
  if (input) input.value = '';

  // Hide suggestion chips
  const chips = document.getElementById('suggestion-chips');
  if (chips) chips.style.display = 'none';

  // Add user bubble
  appendMessage('user', msg);

  // Show typing indicator
  const typingId = showTyping();

  // Process intent after short delay (simulate AI)
  setTimeout(() => {
    removeTyping(typingId);
    const handler = matchIntent(msg);
    const response = handler(msg);
    appendAgentMessage(response);

    // Handle auto-actions (e.g., navigate straight to map)
    if (response.autoAction) {
      setTimeout(response.autoAction, 800);
    }
    // Store pending confirmation
    if (response.actionType && response.confirmText) {
      pendingAction = response;
    }
  }, 900 + Math.random() * 600);
}

function appendMessage(role, text) {
  const win = document.getElementById('chat-window');
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  const isUser = role === 'user';

  const div = document.createElement('div');
  div.className = `msg ${isUser ? 'user-msg' : 'agent-msg'}`;
  div.innerHTML = `
    ${isUser ? '' : '<div class="msg-avatar">🤖</div>'}
    <div class="msg-bubble glass">
      <p>${formatText(text)}</p>
      <div class="msg-time">${timeStr}</div>
    </div>
    ${isUser ? '' : ''}
  `;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function appendAgentMessage(response) {
  const win = document.getElementById('chat-window');
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

  const div = document.createElement('div');
  div.className = 'msg agent-msg';

  let html = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble glass">
      <p>${formatText(response.message)}</p>
      ${response.source ? `<div class="source-cite">${response.source}</div>` : ''}
      ${response.confirmText ? `
        <button class="btn-primary small" style="margin-top:10px;width:100%" onclick="showConfirmModal()">
          ${response.confirmBtnText || 'Confirm'}
        </button>
      ` : ''}
      <div class="msg-time">${timeStr}</div>
    </div>
  `;

  div.innerHTML = html;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function showTyping() {
  const win = document.getElementById('chat-window');
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'msg agent-msg';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble glass">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ─── Confirmation Modal ────────────────────────────────
function showConfirmModal() {
  if (!pendingAction) return;
  const modal = document.getElementById('confirm-modal');
  document.getElementById('modal-title').textContent = pendingAction.confirmBtnText || 'Confirm Action';
  document.getElementById('modal-body').textContent = pendingAction.confirmText;
  document.getElementById('modal-source').textContent = pendingAction.source || '';
  document.getElementById('modal-icon').textContent = getActionIcon(pendingAction.actionType);
  modal.classList.remove('hidden');
}

function getActionIcon(type) {
  const icons = { lab_booking:'🔬', bonafide:'📜', wifi:'📡', id_card:'🪪', navigate:'🗺', default:'✅' };
  return icons[type] || icons.default;
}

function confirmAction() {
  if (!pendingAction) return;
  closeModal('confirm-modal');

  const action = pendingAction;
  pendingAction = null;

  // Generate audit entry
  const ref = `CP-${Date.now().toString().slice(-6)}`;
  const entry = {
    id: ref, type: action.actionType,
    data: action.actionData, timestamp: new Date(),
    status: action.actionType === 'bonafide' ? 'pending' : 'confirmed'
  };
  auditTrail.unshift(entry);
  updateAuditList(entry);

  // Show success
  setTimeout(() => {
    const successMessages = {
      lab_booking: `${action.actionData.lab} booked for ${action.actionData.time}! ✅\nConfirmation logged to your profile.`,
      bonafide: 'Application submitted! HOD approval pending. You\'ll be notified in 1–2 days.',
      wifi: `WiFi complaint filed for ${action.actionData.location}. Ticket: ${ref}. Avg resolution: 2–4 hours.`,
      id_card: `Lost ID reported. Ref: ${ref}. Temporary ID will be ready at Admin Office within 24 hours.`,
      navigate: `Opening navigation to ${action.actionData.destination}...`,
    };
    document.getElementById('success-title').textContent = '✅ Done!';
    document.getElementById('success-body').textContent = successMessages[action.actionType] || 'Action completed!';
    document.getElementById('audit-ref').textContent = `Audit Ref: ${ref} | ${new Date().toLocaleTimeString()}`;
    document.getElementById('success-modal').classList.remove('hidden');

    if (action.actionType === 'navigate') {
      setTimeout(() => { switchTab('map'); showBuildingInfo(action.actionData.destination); }, 500);
    }
  }, 300);
}

function updateAuditList(entry) {
  const list = document.getElementById('audit-list');
  if (!list) return;
  const labels = { lab_booking:'Lab Booked', bonafide:'Bonafide Applied', wifi:'WiFi Ticket', id_card:'ID Reported', navigate:'Navigated' };
  const div = document.createElement('div');
  div.className = 'audit-item glass';
  div.innerHTML = `
    <div class="audit-icon ${entry.status === 'pending' ? 'warning' : 'success'}">
      ${entry.status === 'pending' ? '⏳' : '✓'}
    </div>
    <div class="audit-body">
      <div class="audit-title">${labels[entry.type] || 'Action'}</div>
      <div class="audit-meta">Ref: ${entry.id} • <span class="audit-status ${entry.status === 'pending' ? 'warning' : 'success'}">${entry.status === 'pending' ? 'Pending' : 'Confirmed'}</span></div>
    </div>
    <div class="audit-time">Just now</div>
  `;
  list.prepend(div);
}

// ─── Quick Actions ─────────────────────────────────────
function quickAction(type) {
  switchTab('agent');
  const messages = {
    bonafide: 'I need a bonafide certificate',
    lab_booking: 'Book the physics lab for tomorrow at 2pm',
    wifi_complaint: 'The hostel WiFi is down',
    id_card: 'My ID card was lost',
    library: 'Show me library info',
    printer: 'Where is the nearest printer?',
  };
  setTimeout(() => sendMessage(messages[type]), 400);
}

function quickNavigate(dest) {
  switchTab('map');
  setTimeout(() => showBuildingInfo(dest), 400);
}

// ─── Map Functions ─────────────────────────────────────
function showBuildingInfo(name) {
  const building = campusData.buildings.find(b => b.name === name || b.id === name.toLowerCase().replace(/\s+/g,'-'));
  if (!building) return;

  selectedBuilding = building;
  document.getElementById('bip-icon').textContent = building.icon;
  document.getElementById('bip-name').textContent = building.name;
  document.getElementById('bip-status').textContent = `🟢 ${building.status === 'open' ? 'Open' : 'Closed'} • ${building.hours}`;
  document.getElementById('bip-details').textContent = building.details;

  // Show/hide book button
  const bookBtn = document.getElementById('bip-book-btn');
  bookBtn.style.display = building.category === 'labs' ? 'flex' : 'none';

  document.getElementById('building-info-panel').classList.remove('hidden');

  // Highlight hotspot
  document.querySelectorAll('.hs-dot').forEach(d => d.style.transform = 'scale(1)');
  const hs = document.getElementById(`hs-${building.id}`);
  if (hs) hs.querySelector('.hs-dot').style.transform = 'scale(1.6)';
}

function closeBuildingInfo() {
  document.getElementById('building-info-panel').classList.add('hidden');
  selectedBuilding = null;
}

function startNavigation() {
  if (!selectedBuilding) return;
  // Draw a simple SVG path
  const svg = document.getElementById('nav-path-svg');
  svg.innerHTML = `
    <defs>
      <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <polygon points="0 0, 6 3, 0 6" fill="#00f5a0" />
      </marker>
    </defs>
    <polyline
      class="nav-path"
      points="50,90 50,65 ${selectedBuilding.x},${selectedBuilding.y}"
      fill="none" stroke="#00f5a0" stroke-width="1.5"
      stroke-linecap="round" stroke-linejoin="round"
      marker-end="url(#arrowhead)"
      style="stroke-dasharray:600;stroke-dashoffset:600;animation:drawPath 2s ease forwards 0.2s"
    />
    <circle cx="50" cy="90" r="3" fill="#00d4aa"/>
    <text x="52" y="88" fill="#00d4aa" font-size="5" font-family="Inter">You</text>
  `;
  showToast(`🗺 Navigating to ${selectedBuilding.name}`);
}

function bookFromMap() {
  if (!selectedBuilding) return;
  closeModal('building-info-panel'); // close building panel
  switchTab('agent');
  setTimeout(() => sendMessage(`Book the ${selectedBuilding.name}`), 400);
}

function filterMap(btn, category) {
  document.querySelectorAll('.map-filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLocationList(category);
}

function filterMapSearch(query) {
  renderLocationList('all', query);
}

function renderLocationList(category = 'all', query = '') {
  const list = document.getElementById('location-list');
  let buildings = campusData.buildings;

  if (category !== 'all') {
    buildings = buildings.filter(b => b.tags.includes(category));
  }
  if (query) {
    buildings = buildings.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
  }

  list.innerHTML = '<div class="section-title">All Locations</div>';
  buildings.forEach(b => {
    const div = document.createElement('div');
    div.className = 'location-item';
    div.onclick = () => showBuildingInfo(b.name);
    div.innerHTML = `
      <div class="location-icon">${b.icon}</div>
      <div class="location-info">
        <div class="location-name">${b.name}</div>
        <div class="location-meta">${b.hours}</div>
      </div>
      <span class="location-tag tag-open">Open</span>
    `;
    list.appendChild(div);
  });
}

// ─── Service Modal Forms ───────────────────────────────
const serviceForms = {
  bonafide: {
    title: '📜 Bonafide Certificate',
    html: `<div class="service-form">
      <div class="form-group">
        <label>Purpose</label>
        <select class="form-control" id="sf-purpose">
          <option>Bank Account Opening</option><option>Passport Application</option>
          <option>Scholarship</option><option>Internship</option><option>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Additional Note (optional)</label>
        <textarea class="form-control" id="sf-note" placeholder="Any specific details..."></textarea>
      </div>
      <button class="btn-primary" onclick="submitService('bonafide')">Submit Application</button>
    </div>`
  },
  lab: {
    title: '🔬 Lab Booking',
    html: `<div class="service-form">
      <div class="form-group">
        <label>Select Lab</label>
        <select class="form-control" id="sf-lab" onchange="updateSlots()">
          <option>Physics Lab</option><option>Chemistry Lab</option><option>CS Block</option>
        </select>
      </div>
      <div class="form-group">
        <label>Date</label>
        <input type="date" class="form-control" id="sf-date" />
      </div>
      <div class="form-group">
        <label>Time Slot</label>
        <select class="form-control" id="sf-slot">
          <option>9:00 AM</option><option>11:00 AM</option><option>2:00 PM</option><option>4:00 PM</option>
        </select>
      </div>
      <div class="form-group">
        <label>Purpose</label>
        <input type="text" class="form-control" id="sf-lab-purpose" placeholder="e.g. Practicals, Research..." />
      </div>
      <button class="btn-primary" onclick="submitService('lab')">Confirm Booking</button>
    </div>`
  },
  wifi: {
    title: '📡 WiFi / IT Complaint',
    html: `<div class="service-form">
      <div class="form-group">
        <label>Issue Type</label>
        <select class="form-control" id="sf-issue">
          <option>No WiFi connection</option><option>Slow speed</option>
          <option>Frequent disconnection</option><option>Cannot login to portal</option>
        </select>
      </div>
      <div class="form-group">
        <label>Location</label>
        <select class="form-control" id="sf-loc">
          <option>Hostel Block A</option><option>Hostel Block B</option>
          <option>Library</option><option>CS Block</option><option>Canteen</option>
        </select>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-control" id="sf-desc" placeholder="Describe the issue..."></textarea>
      </div>
      <button class="btn-primary" onclick="submitService('wifi')">File Ticket</button>
    </div>`
  },
  id: {
    title: '🪪 Lost ID Card',
    html: `<div class="service-form">
      <div class="form-group">
        <label>Roll Number</label>
        <input type="text" class="form-control" value="${currentUser.roll}" readonly />
      </div>
      <div class="form-group">
        <label>When was it lost?</label>
        <input type="date" class="form-control" id="sf-lost-date" />
      </div>
      <div class="form-group">
        <label>Last seen location</label>
        <input type="text" class="form-control" id="sf-lost-loc" placeholder="e.g. Library, Hostel B..." />
      </div>
      <div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:8px;padding:10px;font-size:12px;color:#e74c3c;">
        ⚠️ Your current ID will be deactivated immediately on submission.
      </div>
      <button class="btn-primary" onclick="submitService('id')">Report & Request Replacement</button>
    </div>`
  },
  library: {
    title: '📚 Library Services',
    html: `<div class="service-form">
      <div class="form-group">
        <label>What do you need?</label>
        <select class="form-control" id="sf-lib-action">
          <option>Search for a book</option><option>Reserve a book</option>
          <option>Renew borrowed book</option><option>Check due dates</option>
        </select>
      </div>
      <div class="form-group">
        <label>Book title / subject (optional)</label>
        <input type="text" class="form-control" id="sf-book" placeholder="e.g. Quantum Mechanics..." />
      </div>
      <button class="btn-primary" onclick="submitService('library')">Search / Reserve</button>
    </div>`
  },
  medical: {
    title: '🏥 Medical Appointment',
    html: `<div class="service-form">
      <div class="form-group">
        <label>Date</label>
        <input type="date" class="form-control" id="sf-med-date" />
      </div>
      <div class="form-group">
        <label>Preferred Time</label>
        <select class="form-control" id="sf-med-time">
          <option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
          <option>2:00 PM</option><option>3:00 PM</option>
        </select>
      </div>
      <div class="form-group">
        <label>Reason (brief)</label>
        <input type="text" class="form-control" id="sf-med-reason" placeholder="General checkup, fever, etc..." />
      </div>
      <button class="btn-primary" onclick="submitService('medical')">Book Appointment</button>
    </div>`
  },
  timetable: {
    title: '🗓 Your Timetable',
    html: `<div style="font-size:14px;line-height:2;">
      <strong>Today — Thursday</strong><br>
      🕘 9:00 AM – Quantum Mechanics <span style="color:#8b949e">• Physics Lab 204</span><br>
      🕚 11:00 AM – Data Structures <span style="color:#8b949e">• CS Block, Lab 2</span><br>
      🕑 2:00 PM – Technical Writing <span style="color:#8b949e">• Main Hall 101</span><br><br>
      <strong>Tomorrow — Friday</strong><br>
      🕙 10:00 AM – Optics Lab <span style="color:#8b949e">• Physics Lab 204</span><br>
      🕐 1:00 PM – Algorithm Design <span style="color:#8b949e">• CS Block, Lab 1</span><br>
    </div>`
  },
  feedback: {
    title: '💬 Feedback',
    html: `<div class="service-form">
      <div class="form-group">
        <label>Facility</label>
        <select class="form-control" id="sf-fb-facility">
          <option>Canteen</option><option>Library</option><option>Hostel</option>
          <option>Labs</option><option>Admin Office</option><option>WiFi</option>
        </select>
      </div>
      <div class="form-group">
        <label>Rating</label>
        <div style="display:flex;gap:10px;font-size:28px;cursor:pointer" id="star-rating">
          <span onclick="setRating(1)">⭐</span><span onclick="setRating(2)">⭐</span>
          <span onclick="setRating(3)">⭐</span><span onclick="setRating(4)">⭐</span>
          <span onclick="setRating(5)">⭐</span>
        </div>
      </div>
      <div class="form-group">
        <label>Comments (anonymous)</label>
        <textarea class="form-control" id="sf-fb-comment" placeholder="Your honest feedback..."></textarea>
      </div>
      <button class="btn-primary" onclick="submitService('feedback')">Submit Anonymously</button>
    </div>`
  },
};

function openService(key) {
  const form = serviceForms[key];
  if (!form) return;

  // Set today's date as default
  const modal = document.getElementById('service-modal');
  document.getElementById('service-modal-title').textContent = form.title;
  let formHtml = form.html;
  if (currentUser && currentUser.roll) {
    formHtml = formHtml.replace(/value="CS21045"/g, `value="${currentUser.roll}"`);
  }
  document.getElementById('service-modal-body').innerHTML = formHtml;
  modal.classList.remove('hidden');

  // Set default date
  const dateInputs = modal.querySelectorAll('input[type="date"]');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  dateInputs.forEach(d => d.value = tomorrow.toISOString().split('T')[0]);
}

function submitService(type) {
  closeModal('service-modal');
  const ref = `CP-${Date.now().toString().slice(-6)}`;
  const msgs = {
    bonafide: 'Application submitted! Approval in 1–2 days.',
    lab: 'Lab booked successfully!',
    wifi: `WiFi ticket filed. Ref: ${ref}`,
    id: `Lost ID reported. Ref: ${ref}`,
    library: 'Your library request is processed.',
    medical: 'Appointment booked!',
    timetable: '',
    feedback: 'Thank you for your feedback! 🙏',
  };
  if (msgs[type]) {
    document.getElementById('success-title').textContent = '✅ Done!';
    document.getElementById('success-body').textContent = msgs[type];
    document.getElementById('audit-ref').textContent = `Audit Ref: ${ref} | ${new Date().toLocaleTimeString()}`;
    document.getElementById('success-modal').classList.remove('hidden');
  }
}

// ─── Voice Input ───────────────────────────────────────
function toggleVoice() {
  if (isListening) { stopVoice(); return; }
  isListening = true;
  document.getElementById('voice-overlay').classList.remove('hidden');
  document.getElementById('mic-btn').classList.add('active');

  // Simulate voice recognition after 3 seconds
  const voicePhrases = [
    'Book the chemistry lab tomorrow at 2 and show me how to get there',
    'I need a bonafide certificate for passport',
    'Hostel B WiFi is not working',
    'Where is the nearest printer?',
  ];
  const phrase = voicePhrases[Math.floor(Math.random() * voicePhrases.length)];

  voiceTimeout = setTimeout(() => {
    stopVoice();
    document.getElementById('chat-input').value = phrase;
    showToast('🎤 Recognized: "' + phrase.substring(0, 40) + '..."');
    setTimeout(() => sendMessage(phrase), 600);
  }, 3000);
}

function stopVoice() {
  isListening = false;
  clearTimeout(voiceTimeout);
  document.getElementById('voice-overlay').classList.add('hidden');
  document.getElementById('mic-btn').classList.remove('active');
}

// ─── Language Toggle ───────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  document.getElementById('lang-flag').textContent = lang === 'hi' ? '🇮🇳' : '🌐';
  applyTranslations();
}

function toggleLang() {
  setLang(currentLang === 'en' ? 'hi' : 'en');
  showToast(currentLang === 'hi' ? '🇮🇳 Hindi enabled' : '🌐 English enabled');
}

function applyTranslations() {
  const s = strings[currentLang];
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (s[key]) el.textContent = s[key];
  });
  // Chat placeholder
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.placeholder = s.ask_anything;
  // Voice texts
  document.querySelectorAll('[data-placeholder-key]').forEach(el => {
    const key = el.dataset.placeholderKey;
    if (s[key]) el.placeholder = s[key];
  });
}

// ─── Tab Switching ─────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`nav-${tab}`).classList.add('active');

  // Lazy render location list
  if (tab === 'map') renderLocationList();
}

// ─── Modal Helpers ─────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showNotifications() {
  document.getElementById('notif-modal').classList.remove('hidden');
}

function showProfile() {
  if (currentUser) renderUserProfile(currentUser);
  document.getElementById('profile-modal').classList.remove('hidden');
}

// ─── Toast ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ─── Student Profile Binding ───────────────────────────
function renderUserProfile(student) {
  if (!student) return;
  currentUser = student;

  const firstName = student.name.trim().split(' ')[0] || 'Student';
  const shortDept = (student.department || 'Computer Science').replace(/& Engineering|Engineering|Studies/gi, '').trim();
  const shortYear = (student.year || '3rd Year').replace(/ \(Fresher\)/gi, '').trim();
  const initials = student.avatarLetter || student.name.trim().split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || 'S';
  const gradient = student.avatarGradient || 'linear-gradient(135deg, #7c6fef, #9d93f5)';

  // 1. Top Header greeting & avatar
  updateGreeting();
  const headerAvatarEl = document.getElementById('header-student-avatar');
  if (headerAvatarEl) {
    headerAvatarEl.textContent = initials;
    headerAvatarEl.style.background = gradient;
  }

  // 2. Home Tab Hero
  const heroNameEl = document.getElementById('hero-student-name');
  if (heroNameEl) heroNameEl.textContent = student.name;

  const heroRollEl = document.getElementById('hero-student-roll');
  if (heroRollEl) heroRollEl.textContent = `${student.roll} · ${shortDept} · ${shortYear}`;

  const heroAvatarEl = document.getElementById('hero-student-avatar');
  if (heroAvatarEl) {
    heroAvatarEl.textContent = initials;
    heroAvatarEl.style.background = gradient;
  }

  // 3. Profile Modal Header
  const profileNameEl = document.getElementById('profile-student-name');
  if (profileNameEl) profileNameEl.textContent = student.name;

  const profileEmailEl = document.getElementById('profile-student-email');
  if (profileEmailEl) profileEmailEl.textContent = student.email;

  const profileAvatarEl = document.getElementById('profile-student-avatar');
  if (profileAvatarEl) {
    profileAvatarEl.textContent = initials;
    profileAvatarEl.style.background = gradient;
  }

  const profileBadgeDept = document.getElementById('profile-badge-dept');
  if (profileBadgeDept) profileBadgeDept.textContent = `${shortDept} ${shortYear}`;

  const profileBadgeRoll = document.getElementById('profile-badge-roll');
  if (profileBadgeRoll) profileBadgeRoll.textContent = student.roll;

  // 4. Detailed Student Profile Card
  const pdName = document.getElementById('pd-name');
  if (pdName) pdName.textContent = student.name || '—';

  const pdRoll = document.getElementById('pd-roll');
  if (pdRoll) pdRoll.textContent = student.roll || '—';

  const pdDept = document.getElementById('pd-dept');
  if (pdDept) pdDept.textContent = student.department || 'Computer Science & Engineering';

  const pdYear = document.getElementById('pd-year');
  if (pdYear) pdYear.textContent = student.year || '1st Year (Fresher)';

  const pdEmail = document.getElementById('pd-email');
  if (pdEmail) pdEmail.textContent = student.email || '—';

  const pdPhone = document.getElementById('pd-phone');
  if (pdPhone) pdPhone.textContent = student.phone ? `+91 ${student.phone}` : 'Not provided';

  const pdPin = document.getElementById('pd-pin');
  if (pdPin) pdPin.textContent = student.pin ? `•••• (${student.pin.length} digits saved)` : '••••';

  // 5. AI Welcome Message
  const chatWelcome = document.getElementById('chat-welcome-text');
  if (chatWelcome) {
    chatWelcome.textContent = currentLang === 'hi'
      ? `नमस्ते ${firstName}! 👋 मैं आपका Campus AI Agent हूं। मैं लैब बुकिंग, सर्टिफिकेट, शिकायत दर्ज करना, या कैंपस में नेविगेशन में मदद कर सकता हूं।`
      : `Hi ${firstName}! 👋 I'm your Campus AI Agent. I can help you book labs, get certificates, report issues, or navigate anywhere on campus. What do you need?`;
  }
}

// ─── Auth Mode Switcher ────────────────────────────────
function switchAuthMode(mode) {
  currentAuthMode = mode;
  const regForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const otpForm = document.getElementById('otp-form');
  const regTabBtn = document.getElementById('tab-btn-register');
  const loginTabBtn = document.getElementById('tab-btn-login');

  if (mode === 'register') {
    if (regForm) regForm.classList.remove('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (otpForm) otpForm.classList.add('hidden');
    if (regTabBtn) regTabBtn.classList.add('active');
    if (loginTabBtn) loginTabBtn.classList.remove('active');
  } else if (mode === 'login') {
    if (regForm) regForm.classList.add('hidden');
    if (loginForm) loginForm.classList.remove('hidden');
    if (otpForm) otpForm.classList.add('hidden');
    if (regTabBtn) regTabBtn.classList.remove('active');
    if (loginTabBtn) loginTabBtn.classList.add('active');
  } else if (mode === 'otp') {
    if (regForm) regForm.classList.add('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (otpForm) otpForm.classList.remove('hidden');
    if (regTabBtn) regTabBtn.classList.remove('active');
    if (loginTabBtn) loginTabBtn.classList.remove('active');
  }
}

// ─── New Student Registration Flow ─────────────────────
function handleStudentRegister() {
  const nameEl = document.getElementById('reg-name');
  const emailEl = document.getElementById('reg-email');
  const rollEl = document.getElementById('reg-roll');
  const deptEl = document.getElementById('reg-dept');
  const yearEl = document.getElementById('reg-year');
  const phoneEl = document.getElementById('reg-phone');
  const pinEl = document.getElementById('reg-pin');

  const name = nameEl ? nameEl.value.trim() : '';
  const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
  const roll = rollEl ? rollEl.value.trim().toUpperCase() : '';
  const dept = deptEl ? deptEl.value : 'Computer Science & Engineering';
  const year = yearEl ? yearEl.value : '1st Year (Fresher)';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const pin = pinEl ? pinEl.value.trim() : '';

  // Validation
  if (!name || name.length < 2) {
    showToast('⚠️ Please enter your full name');
    if (nameEl) nameEl.focus();
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('⚠️ Please enter a valid college email address');
    if (emailEl) emailEl.focus();
    return;
  }
  if (!roll || roll.length < 3) {
    showToast('⚠️ Please enter your student Roll / ID Number');
    if (rollEl) rollEl.focus();
    return;
  }
  if (!pin) {
    showToast('⚠️ Please create a password or 4-digit PIN');
    if (pinEl) pinEl.focus();
    return;
  }

  const students = getStoredStudents();

  // Check if student already exists
  const existing = students.find(s =>
    (s.email && s.email.toLowerCase() === email) ||
    (s.roll && s.roll.toUpperCase() === roll)
  );

  if (existing) {
    showToast(`⚠️ Account already exists for ${existing.roll} (${existing.email})! Please Sign In.`);
    switchAuthMode('login');
    const loginIdent = document.getElementById('login-identifier');
    if (loginIdent) {
      loginIdent.value = existing.email;
    }
    const loginPin = document.getElementById('login-pin');
    if (loginPin) loginPin.focus();
    return;
  }

  // Create and persist new student profile
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
  const gradients = [
    'linear-gradient(135deg, #7c6fef, #9d93f5)',
    'linear-gradient(135deg, #38bdf8, #818cf8)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)'
  ];
  const avatarGradient = gradients[Math.floor(Math.random() * gradients.length)];

  const newStudent = {
    name,
    email,
    roll,
    department: dept,
    year,
    phone,
    pin,
    avatarLetter: initials,
    avatarGradient
  };

  students.push(newStudent);
  saveStudents(students);

  const btn = document.getElementById('reg-submit-btn');
  if (btn) btn.innerHTML = '<span>Creating Profile...</span>';

  showToast(`🎉 Welcome to CampusPilot, ${name.split(' ')[0]}! Profile created.`);
  loginStudentSession(newStudent);
}

// ─── Existing Student Sign In Flow ─────────────────────
function handleStudentLogin() {
  const identEl = document.getElementById('login-identifier');
  const pinEl = document.getElementById('login-pin');
  const ident = identEl ? identEl.value.trim() : '';
  const pin = pinEl ? pinEl.value.trim() : '';

  if (!ident) {
    showToast('⚠️ Please enter your college email or roll number');
    if (identEl) identEl.focus();
    return;
  }

  const students = getStoredStudents();
  const student = students.find(s =>
    (s.email && s.email.toLowerCase() === ident.toLowerCase()) ||
    (s.roll && s.roll.toUpperCase() === ident.toUpperCase())
  );

  // If not found, guide them to registration
  if (!student) {
    showToast('⚠️ No account found with this email/roll. Please Register first!');
    switchAuthMode('register');
    if (ident.includes('@')) {
      const regEmail = document.getElementById('reg-email');
      if (regEmail) regEmail.value = ident;
    } else {
      const regRoll = document.getElementById('reg-roll');
      if (regRoll) regRoll.value = ident.toUpperCase();
    }
    const regName = document.getElementById('reg-name');
    if (regName) regName.focus();
    return;
  }

  // Validate PIN / Password (accept entered pin, or demo 1234, or bypass if not configured)
  if (pin && student.pin && student.pin !== pin && pin !== '1234') {
    showToast('⚠️ Incorrect password/PIN. (Try 1234 for demo)');
    if (pinEl) pinEl.focus();
    return;
  }

  const btn = document.getElementById('login-submit-btn');
  if (btn) btn.innerHTML = '<span>Signing in...</span>';

  showToast(`Welcome back, ${student.name.split(' ')[0]}! 👋`);
  loginStudentSession(student);
}

// ─── Instant Demo Login ────────────────────────────────
function quickDemoLogin() {
  const students = getStoredStudents();
  const demoStudent = students.find(s => s.email === 'demo@college.edu') || DEFAULT_STUDENTS[0];
  showToast('⚡ Logging in with Demo Student (Priya Sharma)...');
  loginStudentSession(demoStudent);
}

// ─── OTP Flow ──────────────────────────────────────────
function switchToOtpMode() {
  const identEl = document.getElementById('login-identifier');
  const email = (identEl && identEl.value.includes('@')) ? identEl.value : (currentUser.email || 'demo@college.edu');
  document.getElementById('otp-email-display').textContent = email;
  switchAuthMode('otp');
  showToast('📧 OTP sent! (Use: 123456 for demo)');
  setupOtpInputs();
}

function resendCurrentOtp() {
  showToast('📧 Fresh OTP sent! (Use: 123456)');
}

function setupOtpInputs() {
  document.querySelectorAll('.otp-digit').forEach((el, i) => {
    el.value = '';
    el.oninput = () => {
      el.value = el.value.replace(/\D/g,'');
      if (el.value && i < 5) document.getElementById(`otp-${i+1}`).focus();
    };
    el.onkeydown = e => {
      if (e.key === 'Backspace' && !el.value && i > 0) document.getElementById(`otp-${i-1}`).focus();
    };
  });
  const first = document.getElementById('otp-0');
  if (first) first.focus();
}

function sendOTP() {
  switchToOtpMode();
}

function verifyOTP() {
  const digits = Array.from({length:6}, (_,i) => document.getElementById(`otp-${i}`)?.value || '').join('');
  if (digits.length < 6) { showToast('⚠️ Enter full 6-digit OTP'); return; }

  const btn = document.getElementById('verify-otp-btn');
  if (btn) btn.innerHTML = '<span>Verifying...</span>';

  const students = getStoredStudents();
  const student = students.find(s => s.email === currentUser.email) || students[0] || DEFAULT_STUDENTS[0];
  loginStudentSession(student);
}

// ─── Session Management & Launch ───────────────────────
function loginStudentSession(student) {
  renderUserProfile(student);
  try {
    localStorage.setItem('campuspilot_session', JSON.stringify(student));
  } catch (e) {}

  setTimeout(launchApp, 500);
}

function launchApp() {
  document.getElementById('login-screen').classList.add('hidden');
  const app = document.getElementById('app');
  app.classList.remove('hidden');
  updateClock();
  setInterval(updateClock, 10000);
  updateGreeting();
}

function updateClock() {
  const now = new Date();
  const t = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  const el = document.getElementById('status-time');
  if (el) el.textContent = t;
}

function updateGreeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('header-greeting');
  const firstName = currentUser && currentUser.name ? currentUser.name.split(' ')[0] : 'Student';
  if (el) el.textContent = `${greeting}, ${firstName} 👋`;
}

function logout() {
  closeModal('profile-modal');
  try { localStorage.removeItem('campuspilot_session'); } catch (e) {}
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  switchAuthMode('login');
  showToast('Logged out successfully');
}

// ─── Click outside to close modals ────────────────────
document.addEventListener('click', e => {
  const overlays = ['confirm-modal','success-modal','notif-modal','profile-modal','service-modal'];
  overlays.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden') && e.target === el) {
      el.classList.add('hidden');
    }
  });
});

// ─── Splash → Auth Screen ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Ensure default students are seeded in localStorage
  if (!localStorage.getItem('campuspilot_students')) {
    saveStudents(DEFAULT_STUDENTS);
  }

  // Check existing session
  let savedSession = null;
  try {
    const raw = localStorage.getItem('campuspilot_session');
    if (raw) savedSession = JSON.parse(raw);
  } catch (e) {}

  if (savedSession) {
    renderUserProfile(savedSession);
  } else {
    renderUserProfile(DEFAULT_STUDENTS[0]);
  }

  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        splash.classList.add('hidden');
        if (savedSession) {
          // If already signed in, enter app directly
          launchApp();
        } else {
          document.getElementById('login-screen').classList.remove('hidden');
          switchAuthMode('register');
        }
      }, 500);
    }
  }, 2200);
});
