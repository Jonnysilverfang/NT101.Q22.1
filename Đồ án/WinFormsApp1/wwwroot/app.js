// UI Navigation Tabs
const tabs = document.querySelectorAll('.nav-link');
const panels = document.querySelectorAll('.panel');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-tab');
    
    // Set active link
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Set active panel
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(`${target}Panel`).classList.add('active');
    
    // Update headers
    switch (target) {
      case 'dashboard':
        pageTitle.innerText = "Tổng quan hệ thống";
        pageSubtitle.innerText = "Trạng thái phòng lab mật mã học và hướng dẫn sử dụng.";
        break;
      case 'playfair':
        pageTitle.innerText = "Mã hóa Đối xứng Playfair";
        pageSubtitle.innerText = "Mô phỏng ma trận 5x5 và quy tắc thay thế từng cặp ký tự.";
        break;
      case 'rsa':
        pageTitle.innerText = "Mã hóa Bất đối xứng RSA";
        pageSubtitle.innerText = "Quản lý cặp khóa Public/Private, phân tích và mã hóa văn bản.";
        break;
      case 'file':
        pageTitle.innerText = "Mã hóa Tệp tin Lai (Hybrid)";
        pageSubtitle.innerText = "Mã hóa lai RSA + AES-256-GCM bảo vệ các tệp tin kích thước lớn.";
        break;
      case 'history':
        pageTitle.innerText = "Nhật ký & Lịch sử";
        pageSubtitle.innerText = "Lịch sử các thao tác mật mã cục bộ.";
        break;
    }
    
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
  });
});

// Mobile menu toggle
document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// App State
let playfairCurrentMatrix = [];
let loadedFile = null;

// ==========================================
// API Connection Health Check
// ==========================================
async function checkApiHealth() {
  const statusEl = document.getElementById('apiStatusText');
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      statusEl.innerText = "Kết nối API ổn định";
      statusEl.parentElement.classList.remove('border-red-800', 'bg-red-900/40', 'text-red-400');
      statusEl.parentElement.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
      statusEl.previousElementSibling.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse";
    } else {
      throw new Error();
    }
  } catch (err) {
    statusEl.innerText = "Mất kết nối API Backend";
    statusEl.parentElement.classList.remove('border-slate-800', 'bg-slate-900', 'text-slate-400');
    statusEl.parentElement.classList.add('border-red-800', 'bg-red-900/40', 'text-red-400');
    statusEl.previousElementSibling.className = "w-2.5 h-2.5 rounded-full bg-red-500";
  }
}
setInterval(checkApiHealth, 10000);
checkApiHealth();

// ==========================================
// Playfair Matrix & Visualizer Logic
// ==========================================
const keyInput = document.getElementById('playfairKey');
keyInput.addEventListener('input', () => {
  const cleanKey = keyInput.value.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  keyInput.value = cleanKey;
  renderClientMatrix(cleanKey);
});

// Build matrix client-side on the fly for instant preview
function renderClientMatrix(keyStr) {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // No 'J'
  const finalLetters = [];
  
  // key letters first
  for (let char of keyStr) {
    if (!finalLetters.includes(char) && alphabet.includes(char)) {
      finalLetters.push(char);
    }
  }
  
  // filler
  for (let char of alphabet) {
    if (!finalLetters.includes(char)) {
      finalLetters.push(char);
    }
  }
  
  // convert to 5x5 jagged array
  const matrix = [];
  for (let i = 0; i < 5; i++) {
    matrix.push(finalLetters.slice(i * 5, (i + 1) * 5));
  }
  
  playfairCurrentMatrix = matrix;
  drawMatrixHTML(matrix, keyStr);
}

// Render the 5x5 grid cells
function drawMatrixHTML(matrix, keyStr = "") {
  const container = document.getElementById('playfairMatrix');
  container.innerHTML = "";
  
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const letter = matrix[r][c];
      const cell = document.createElement('div');
      cell.className = "matrix-cell";
      cell.innerText = letter;
      cell.id = `cell-${r}-${c}`;
      cell.setAttribute('data-letter', letter);
      
      // If letter belongs to key, color it
      if (keyStr && keyStr.includes(letter)) {
        cell.classList.add('key-letter');
      }
      
      container.appendChild(cell);
    }
  }
}

// Visual Hover Highlights
function highlightMatrixStep(step) {
  // Clear any existing highlights
  document.querySelectorAll('.matrix-cell').forEach(c => {
    c.classList.remove('highlight-active', 'highlight-rect');
  });
  
  if (!step) return;
  
  const oPair = step.originalPair || step.OriginalPair;
  const pPair = step.resultPair || step.ResultPair || step.processedPair || step.ProcessedPair;
  const rule = step.rule || step.Rule;
  
  if (!oPair || oPair.length < 2) return;
  
  const l1 = oPair[0];
  const l2 = oPair[1];
  
  const pos1 = findLetterCoords(l1);
  const pos2 = findLetterCoords(l2);
  
  if (!pos1 || !pos2) return;
  
  // Highlight inputs
  const cell1 = document.getElementById(`cell-${pos1.r}-${pos1.c}`);
  const cell2 = document.getElementById(`cell-${pos2.r}-${pos2.c}`);
  if (cell1) cell1.classList.add('highlight-active');
  if (cell2) cell2.classList.add('highlight-active');
  
  if (rule === "Hàng") {
    // Highlight the entire row
    for (let c = 0; c < 5; c++) {
      const cell = document.getElementById(`cell-${pos1.r}-${c}`);
      if (cell && c !== pos1.c && c !== pos2.c) cell.classList.add('highlight-rect');
    }
  } else if (rule === "Cột") {
    // Highlight the entire column
    for (let r = 0; r < 5; r++) {
      const cell = document.getElementById(`cell-${r}-${pos1.c}`);
      if (cell && r !== pos1.r && r !== pos2.r) cell.classList.add('highlight-rect');
    }
  } else if (rule === "Hình chữ nhật") {
    // Highlight corner intersections
    const cellCorner1 = document.getElementById(`cell-${pos1.r}-${pos2.c}`);
    const cellCorner2 = document.getElementById(`cell-${pos2.r}-${pos1.c}`);
    if (cellCorner1) cellCorner1.classList.add('highlight-rect');
    if (cellCorner2) cellCorner2.classList.add('highlight-rect');
  }
}

function findLetterCoords(letter) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (playfairCurrentMatrix[r][c] === letter) {
        return { r, c };
      }
    }
  }
  return null;
}

// Initial draw
renderClientMatrix("MONARCHY");

// Playfair Encrypt & Decrypt Actions
document.getElementById('btnPlayfairEncrypt').addEventListener('click', () => runPlayfairAction('encrypt-steps'));
document.getElementById('btnPlayfairDecrypt').addEventListener('click', () => runPlayfairAction('decrypt-steps'));

async function runPlayfairAction(actionPath) {
  const key = document.getElementById('playfairKey').value;
  const isEncrypt = actionPath.includes('encrypt');
  const text = isEncrypt 
    ? document.getElementById('playfairPlain').value 
    : document.getElementById('playfairCipherIn').value;
    
  if (!key) {
    alert("Vui lòng nhập khóa Playfair.");
    return;
  }
  if (!text) {
    alert("Vui lòng nhập nội dung đầu vào.");
    return;
  }
  
  const statusEl = document.getElementById('playfairStatus');
  statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Đang xử lý...`;
  
  try {
    const res = await fetch(`/api/playfair/${actionPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, key })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gặp lỗi khi xử lý Playfair");
    }
    
    // Update inputs/outputs
    document.getElementById('playfairOutput').value = data.result;
    
    // Synchronize 5x5 Matrix from backend payload
    if (data.matrix) {
      playfairCurrentMatrix = data.matrix;
      drawMatrixHTML(data.matrix, key);
    }
    
    // Populate detailed steps
    const stepsContainer = document.getElementById('playfairStepsContainer');
    stepsContainer.innerHTML = "";
    
    if (data.steps && data.steps.length > 0) {
      data.steps.forEach((step, idx) => {
        const oPair = step.originalPair || step.OriginalPair;
        const pPair = step.resultPair || step.ResultPair || step.processedPair || step.ProcessedPair;
        const rule = step.rule || step.Rule;
        const item = document.createElement('div');
        item.className = "step-item p-2.5 rounded-lg flex justify-between items-center";
        item.innerHTML = `
          <div>
            <span class="font-bold text-slate-400">#${idx + 1}</span>
            <span class="ml-2 font-mono bg-slate-900 px-1.5 py-0.5 rounded text-white border border-slate-800">${oPair}</span>
            <span class="mx-2 text-slate-500">→</span>
            <span class="font-mono bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/40">${pPair}</span>
          </div>
          <span class="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">${rule}</span>
        `;
        
        // Add events for highlighting
        item.addEventListener('mouseenter', () => {
          document.querySelectorAll('.step-item').forEach(x => x.classList.remove('active-step'));
          item.classList.add('active-step');
          highlightMatrixStep(step);
        });
        
        item.addEventListener('mouseleave', () => {
          item.classList.remove('active-step');
          highlightMatrixStep(null);
        });
        
        stepsContainer.appendChild(item);
      });
    } else {
      stepsContainer.innerHTML = `<div class="text-slate-500 text-center py-8 font-medium">Không tạo ra bước xử lý nào.</div>`;
    }
    
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Xử lý thành công.`;
    
    // Add local audit log
    addAuditLog("Playfair", isEncrypt ? "Mã hóa" : "Giải mã", text.length, key, `Đầu ra: ${data.result.substring(0, 15)}...`);
    
  } catch (err) {
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Lỗi: ${err.message}`;
  }
}

// Clear outputs and inputs
document.getElementById('btnPlayfairClear').addEventListener('click', () => {
  document.getElementById('playfairPlain').value = "";
  document.getElementById('playfairCipherIn').value = "";
  document.getElementById('playfairOutput').value = "";
  document.getElementById('playfairStepsContainer').innerHTML = `
    <div class="text-slate-500 text-center py-8 font-medium">Nhập liệu và mã hóa/giải mã để xem các bước xử lý chi tiết.</div>
  `;
  document.getElementById('playfairStatus').innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-600"></span> Bộ nhớ đệm đã được xóa.`;
  highlightMatrixStep(null);
});

// Swap cipher output to decryption input area
document.getElementById('btnPlayfairSwap').addEventListener('click', () => {
  const result = document.getElementById('playfairOutput').value;
  if (result) {
    document.getElementById('playfairCipherIn').value = result;
    document.getElementById('playfairOutput').value = "";
  }
});

// Copy output content to clipboard
document.getElementById('btnCopyPlayfair').addEventListener('click', () => {
  const outVal = document.getElementById('playfairOutput').value;
  if (outVal) {
    navigator.clipboard.writeText(outVal);
    alert("Đã sao chép kết quả vào Clipboard!");
  }
});

// ==========================================
// RSA Keypair & Cryptography Lab
// ==========================================
const keySizeSelect = document.getElementById('rsaKeySize');
keySizeSelect.addEventListener('change', updateRsaSafetyBar);

function updateRsaSafetyBar() {
  const size = parseInt(keySizeSelect.value);
  const bar = document.getElementById('rsaStrengthBar');
  const text = document.getElementById('rsaSafetyText');
  
  if (size === 1024) {
    bar.style.width = "25%";
    bar.className = "strength-fill bg-red-500";
    text.innerText = "Yếu (Không an toàn)";
    text.className = "text-red-500 font-bold";
  } else if (size === 2048) {
    bar.style.width = "50%";
    bar.className = "strength-fill bg-yellow-500";
    text.innerText = "Đạt chuẩn thương mại";
    text.className = "text-yellow-500 font-bold";
  } else if (size === 3072) {
    bar.style.width = "75%";
    bar.className = "strength-fill bg-cyan-500";
    text.innerText = "Mạnh mẽ";
    text.className = "text-cyan-400 font-bold";
  } else if (size === 4096) {
    bar.style.width = "100%";
    bar.className = "strength-fill bg-emerald-500";
    text.innerText = "Tuyệt đối an toàn";
    text.className = "text-emerald-500 font-bold";
  }
}
updateRsaSafetyBar();

// Generator trigger
document.getElementById('btnRsaGenerate').addEventListener('click', async () => {
  const size = parseInt(keySizeSelect.value);
  const statusEl = document.getElementById('rsaStatusText');
  statusEl.innerText = `Đang tạo cặp khóa RSA ${size}-bit... (Quá trình này có thể tốn 1-3 giây)`;
  
  try {
    const res = await fetch('/api/rsa/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keySize: size })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi khi sinh khóa");
    
    document.getElementById('rsaPublicKey').value = data.publicKey;
    document.getElementById('rsaPrivateKey').value = data.privateKey;
    
    // Also mirror to file page automatically
    document.getElementById('filePublicKey').value = data.publicKey;
    document.getElementById('filePrivateKey').value = data.privateKey;
    
    statusEl.innerText = `Cặp khóa ${size}-bit đã được sinh và thiết lập thành công.`;
    addAuditLog("RSA", "Tạo khóa", size, `RSA ${size}-bit`, "Sinh cặp khóa công khai và bí mật thành công.");
  } catch (err) {
    statusEl.innerText = `Lỗi: ${err.message}`;
  }
});

// RSA Encryption
document.getElementById('btnRsaEncrypt').addEventListener('click', async () => {
  const text = document.getElementById('rsaPlainIn').value;
  const pubKey = document.getElementById('rsaPublicKey').value;
  const statusEl = document.getElementById('rsaStatusText');
  
  if (!text || !pubKey) {
    alert("Vui lòng cung cấp văn bản và Khóa công khai RSA.");
    return;
  }
  
  try {
    const res = await fetch('/api/rsa/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, publicKey: pubKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ghi lỗi mã hóa RSA");
    
    document.getElementById('rsaCipherOut').value = data.result;
    statusEl.innerText = "Mã hóa RSA thành công.";
    addAuditLog("RSA", "Mã hóa", text.length, "RSA PubKey", `Mã hóa Base64: ${data.result.substring(0, 15)}...`);
  } catch (err) {
    statusEl.innerText = `Lỗi: ${err.message}`;
  }
});

// RSA Decryption
document.getElementById('btnRsaDecrypt').addEventListener('click', async () => {
  const text = document.getElementById('rsaCipherIn').value;
  const privKey = document.getElementById('rsaPrivateKey').value;
  const statusEl = document.getElementById('rsaStatusText');
  
  if (!text || !privKey) {
    alert("Vui lòng cung cấp văn bản Base64 và Khóa bí mật RSA.");
    return;
  }
  
  try {
    const res = await fetch('/api/rsa/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, privateKey: privKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ghi lỗi giải mã RSA");
    
    document.getElementById('rsaPlainOut').value = data.result;
    statusEl.innerText = "Giải mã RSA thành công.";
    addAuditLog("RSA", "Giải mã", text.length, "RSA PrivKey", `Giải mã thành công.`);
  } catch (err) {
    statusEl.innerText = `Lỗi: ${err.message}`;
  }
});

// RSA clear all fields
document.getElementById('btnRsaClear').addEventListener('click', () => {
  document.getElementById('rsaPlainIn').value = "";
  document.getElementById('rsaCipherOut').value = "";
  document.getElementById('rsaCipherIn').value = "";
  document.getElementById('rsaPlainOut').value = "";
  document.getElementById('keyInspectorPanel').classList.add('hidden');
  document.getElementById('rsaStatusText').innerText = "Đã xóa sạch bộ nhớ tạm RSA.";
});

// Copy outputs to inputs
document.getElementById('btnRsaMove').addEventListener('click', () => {
  const val = document.getElementById('rsaCipherOut').value;
  if (val) {
    document.getElementById('rsaCipherIn').value = val;
    document.getElementById('rsaCipherOut').value = "";
  }
});

// ==========================================
// RSA Key PEM Inspector API Call
// ==========================================
async function btnInspectKey(textareaId) {
  const pem = document.getElementById(textareaId).value;
  if (!pem || !pem.trim()) {
    alert("Vui lòng nhập nội dung khóa PEM cần phân tích.");
    return;
  }
  
  const statusEl = document.getElementById('rsaStatusText');
  statusEl.innerText = "Đang phân tích khóa PEM...";
  
  try {
    const res = await fetch('/api/rsa/inspect-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: pem })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi định dạng PEM key.");
    
    document.getElementById('inspectKeyType').innerText = data.type;
    document.getElementById('inspectKeySize').innerText = `${data.keySize}-bit`;
    document.getElementById('inspectKeyExponent').innerText = data.exponent;
    document.getElementById('inspectKeySafety').innerText = data.securityAssessment;
    document.getElementById('inspectKeyModulus').innerText = data.modulusHex;
    
    // Unhide Inspector
    document.getElementById('keyInspectorPanel').classList.remove('hidden');
    
    statusEl.innerText = "Phân tích khóa PEM thành công.";
    addAuditLog("RSA Key Inspector", "Phân tích", pem.length, `${data.type} (${data.keySize}b)`, `e=${data.exponent}`);
  } catch (err) {
    statusEl.innerText = `Lỗi phân tích: ${err.message}`;
    alert(`Không thể phân tích khóa: ${err.message}`);
  }
}

// ==========================================
// Secure Hybrid File Transfer (RSA + AES)
// ==========================================
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileDetails = document.getElementById('fileDetails');
const detailsFileName = document.getElementById('detailsFileName');
const detailsFileSize = document.getElementById('detailsFileSize');

// Drag and drop events
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleSelectedFile(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    handleSelectedFile(fileInput.files[0]);
  }
});

function handleSelectedFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    alert("Dung lượng tệp tin vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.");
    return;
  }
  loadedFile = file;
  detailsFileName.innerText = file.name;
  detailsFileSize.innerText = formatBytes(file.size);
  fileDetails.classList.remove('hidden');
}

document.getElementById('btnRemoveFile').addEventListener('click', (e) => {
  e.stopPropagation();
  loadedFile = null;
  fileInput.value = "";
  fileDetails.classList.add('hidden');
});

// Trigger Hybrid File Encryption
document.getElementById('btnFileEncrypt').addEventListener('click', () => runFileAction('encrypt-file'));
document.getElementById('btnFileDecrypt').addEventListener('click', () => runFileAction('decrypt-file'));

async function runFileAction(apiPath) {
  if (!loadedFile) {
    alert("Vui lòng nạp hoặc kéo thả tệp tin cần xử lý.");
    return;
  }
  
  const isEncrypt = apiPath === 'encrypt-file';
  const rsaKey = isEncrypt
    ? document.getElementById('filePublicKey').value
    : document.getElementById('filePrivateKey').value;
    
  if (!rsaKey || !rsaKey.trim()) {
    alert(`Vui lòng cung cấp khóa RSA ${isEncrypt ? 'Công khai' : 'Bí mật'} tương ứng.`);
    return;
  }
  
  const formData = new FormData();
  formData.append('file', loadedFile);
  if (isEncrypt) {
    formData.append('publicKey', rsaKey);
  } else {
    formData.append('privateKey', rsaKey);
  }
  
  try {
    const res = await fetch(`/api/rsa/${apiPath}`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Xử lý file thất bại");
    }
    
    // Receive binary stream
    const blob = await res.blob();
    
    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Set matching file download name
    let downloadName = loadedFile.name;
    if (isEncrypt) {
      if (!downloadName.endsWith('.enc')) downloadName += '.enc';
    } else {
      if (downloadName.endsWith('.enc')) downloadName = downloadName.slice(0, -4);
      else downloadName = 'decrypted_' + downloadName;
    }
    a.download = downloadName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert(`File đã được xử lý và tải xuống thành công: ${downloadName}`);
    addAuditLog("RSA-AES Hybrid File", isEncrypt ? "Mã hóa" : "Giải mã", loadedFile.size, "RSA + AES-GCM", `File: ${downloadName}`);
  } catch (err) {
    alert(`Lỗi xử lý file: ${err.message}`);
  }
}

// File page auto-generate keys trigger
document.getElementById('btnFileGenerateKeys').addEventListener('click', async () => {
  const btn = document.getElementById('btnFileGenerateKeys');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">autorenew</span> Đang sinh khóa...`;
  
  try {
    const res = await fetch('/api/rsa/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keySize: 2048 })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi khi sinh khóa");
    
    document.getElementById('filePublicKey').value = data.publicKey;
    document.getElementById('filePrivateKey').value = data.privateKey;
    
    // Also update RSA panel so they match
    document.getElementById('rsaPublicKey').value = data.publicKey;
    document.getElementById('rsaPrivateKey').value = data.privateKey;
    
    alert("Đã tự động tạo và điền cặp khóa RSA 2048-bit mới!");
    addAuditLog("RSA", "Tạo khóa (File page)", 2048, "RSA 2048-bit", "Sinh cặp khóa công khai và bí mật thành công từ trang truyền file.");
  } catch (err) {
    alert(`Không thể sinh khóa: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// ==========================================
// LocalStorage Audit Logs History System
// ==========================================
const historyTableBody = document.getElementById('historyTableBody');
const btnClearHistory = document.getElementById('btnClearHistory');

function addAuditLog(algo, action, length, keyUsed, details) {
  const logs = getAuditLogs();
  const newLog = {
    timestamp: new Date().toLocaleString('vi-VN'),
    algo,
    action,
    length,
    keyUsed: keyUsed.substring(0, 30) + (keyUsed.length > 30 ? '...' : ''),
    details
  };
  
  logs.unshift(newLog); // Put at top
  // limit logs to 50
  if (logs.length > 50) logs.pop();
  
  localStorage.setItem('cryptolab_history', JSON.stringify(logs));
  renderAuditLogs();
}

function getAuditLogs() {
  const stored = localStorage.getItem('cryptolab_history');
  return stored ? JSON.parse(stored) : [];
}

function renderAuditLogs() {
  const logs = getAuditLogs();
  
  // Update counter in overview
  document.getElementById('quickLogsCount').innerText = `${logs.length} bản ghi lưu`;
  
  if (logs.length === 0) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-500 font-medium">Chưa có bản ghi nhật ký nào.</td>
      </tr>
    `;
    return;
  }
  
  historyTableBody.innerHTML = "";
  logs.forEach((log, index) => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-900 hover:bg-slate-900/30 transition-colors";
    
    // determine lengths
    const lenStr = log.algo.includes("File") ? formatBytes(log.length) : `${log.length} ký tự`;
    
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-[11px] text-slate-400">${log.timestamp}</td>
      <td class="py-3 px-4 font-semibold text-white">${log.algo}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${log.action.includes('Mã hóa') || log.action.includes('Tạo') ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 'bg-cyan-950 text-cyan-400 border border-cyan-900/40'}">
          ${log.action}
        </span>
      </td>
      <td class="py-3 px-4 text-slate-400">${lenStr}</td>
      <td class="py-3 px-4 font-mono text-[11px] text-slate-400" title="${log.keyUsed}">${log.keyUsed}</td>
      <td class="py-3 px-4 text-right">
        <button onclick="viewLogDetails(${index})" class="text-cyan-400 hover:underline hover:text-cyan-300">Chi tiết</button>
      </td>
    `;
    historyTableBody.appendChild(tr);
  });
}

function viewLogDetails(index) {
  const logs = getAuditLogs();
  const log = logs[index];
  if (!log) return;
  
  const title = `Chi tiết bản ghi nhật ký #${logs.length - index}`;
  const body = `
    <strong>Thời gian:</strong> ${log.timestamp}
    <strong>Thuật toán:</strong> ${log.algo}
    <strong>Thao tác:</strong> ${log.action}
    <strong>Dung lượng đầu vào:</strong> ${log.algo.includes("File") ? formatBytes(log.length) : `${log.length} ký tự`}
    <strong>Khóa sử dụng:</strong> ${log.keyUsed}
    
    <strong>Nội dung bổ sung:</strong>
    ${log.details}
  `;
  
  showDialog(title, body);
}

btnClearHistory.addEventListener('click', () => {
  if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử bản ghi mật mã?")) {
    localStorage.removeItem('cryptolab_history');
    renderAuditLogs();
  }
});

// ==========================================
// Dialog Utility Functions
// ==========================================
const infoDialog = document.getElementById('infoDialog');
const dialogTitle = document.getElementById('dialogTitle');
const dialogBody = document.getElementById('dialogBody');

function showDialog(title, htmlContent) {
  dialogTitle.innerText = title;
  dialogBody.innerHTML = htmlContent;
  infoDialog.showModal();
}

function showInfoDialog(type) {
  if (type === 'playfair') {
    const title = "Hướng dẫn sử dụng mã hóa Playfair";
    const body = `
      <strong>Quy tắc nạp khóa:</strong>
      1. Khóa được viết hoa toàn bộ, các chữ trùng lặp và khoảng trắng sẽ bị lược bỏ.
      2. Ký tự 'J' được đồng hóa thành 'I'.
      3. Ma trận 5x5 sẽ được điền đầy bằng các ký tự bảng chữ cái còn lại từ A đến Z (không có J).
      
      <strong>Quy tắc mã hóa cặp ký tự:</strong>
      - Bản rõ được chia thành từng cặp 2 chữ cái. Nếu xuất hiện cặp ký tự trùng nhau (ví dụ: EE) hoặc lẻ ký tự cuối, hệ thống tự động thêm ký tự đệm 'X' (hoặc 'Q') vào giữa.
      - <strong>Hàng dọc (Cột):</strong> Lấy ký tự ngay dưới (dịch xuống vòng quanh).
      - <strong>Hàng ngang:</strong> Lấy ký tự ngay bên phải (dịch phải vòng quanh).
      - <strong>Hình chữ nhật:</strong> Thay thế bằng ký tự ở góc cùng hàng của chữ kia.
    `;
    showDialog(title, body);
  }
}

// Helper formats
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Initial renders
renderAuditLogs();
window.viewLogDetails = viewLogDetails;
