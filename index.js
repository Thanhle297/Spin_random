const rand = (a, b) => Math.random() * (b - a) + a;
const PI2 = Math.PI * 2;
const byId = (id) => document.getElementById(id);
const itemsEl = byId("items");
const statusEl = byId("status");
const noRepeatEl = byId("noRepeat");
const overlay = byId("overlay");
const winnerText = byId("winnerText");
const wheel = byId("wheel");
const ctx = wheel.getContext("2d");
const sample = [
  "Trắc nghiệm",
  "Vấn đáp",
  "Thực hành",
  "Bốc thăm",
  "Nộp bài sớm",
  "Cộng điểm",
  "Quà bí ẩn",
];
itemsEl.value = sample.join("\n");
let items = [],
  angle = 0,
  angVel = 0,
  spinning = false,
  chosenIndex = -1;
const removed = new Set();
function parseItems() {
  items = itemsEl.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s, i, self) => self.indexOf(s) === i);
}
function drawWheel() {
  const W = wheel.width,
    H = wheel.height;
  const R = Math.min(W, H) / 2 - 8;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(angle);
  const n = Math.max(items.length, 1);
  const step = PI2 / n;
  for (let i = 0; i < n; i++) {
    const start = i * step;
    const end = start + step;
    const hue = ((i * 360) / n + 40) % 360;
    ctx.fillStyle = `hsl(${hue}deg 75% 55% / 0.95)`;
    if (noRepeatEl.checked && removed.has(items[i]))
      ctx.fillStyle = `hsl(${hue}deg 10% 30% / 0.6)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, start, end);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#0b1324";
    ctx.stroke();
    ctx.save();
    ctx.fillStyle = "#0b1324";
    ctx.font = `${Math.max(
      18,
      Math.min(40, 900 / (n + 2))
    )}px system-ui,-apple-system,Segoe UI,Roboto`;
    ctx.rotate(start + step / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.translate(R - 16, 0);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffffaa";
    ctx.strokeText(items[i] || "—", 0, 0);
    ctx.fillText(items[i] || "—", 0, 0);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.fillStyle = "#e2e8f0";
  ctx.arc(0, 0, R * 0.12, 0, PI2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#0b1324";
  ctx.stroke();
  ctx.restore();
}
function step() {
  if (!spinning) {
    drawWheel();
    return;
  }
  angle += angVel;
  angVel *= 0.95;
  if (angVel < 0.002) {
    angVel = 0;
    spinning = false;
    onStop();
    return;
  }
  drawWheel();
  requestAnimationFrame(step);
}
function currentIndex() {
  const n = items.length;
  if (!n) return -1;
  const a = ((-angle % PI2) + PI2) % PI2;
  const step = PI2 / n;
  const idx = Math.floor(a / step);
  return idx;
}
function onStop() {
  chosenIndex = currentIndex();
  const winner = items[chosenIndex];
  if (!winner) {
    statusEl.textContent = "Thiếu dữ liệu.";
    return;
  }
  statusEl.textContent = `Trúng: ${winner}`;
  winnerText.textContent = winner;
  if (noRepeatEl.checked) removed.add(winner);
  showOverlay();
  burstConfetti();
}
function spin() {
  parseItems();
  const valid = items.filter((x) => !(noRepeatEl.checked && removed.has(x)));
  if (items.length < 2) {
    statusEl.textContent = "Nhập tối thiểu 2 mục.";
    return;
  }
  if (valid.length === 0) {
    statusEl.textContent =
      'Tất cả mục đã trúng. Hãy bỏ chọn "Không lặp lại" hoặc nhập thêm.';
    return;
  }
  angle = rand(0, PI2);
  angVel = rand(0.25, 0.5);
  spinning = true;
  statusEl.textContent = "Đang quay...";
  requestAnimationFrame(step);
}
const c = byId("confetti");
const cctx = c.getContext("2d");
function resize() {
  c.width = innerWidth;
  c.height = innerHeight;
  drawWheel();
}
addEventListener("resize", resize);
resize();
let confettis = [];
function burstConfetti() {
  const N = 180;
  confettis = Array.from({ length: N }, (_, i) => ({
    x: innerWidth / 2 + rand(-60, 60),
    y: innerHeight / 2 + rand(-40, 40),
    vx: rand(-6, 6),
    vy: rand(-11, -5),
    g: rand(0.18, 0.32),
    s: rand(4, 7),
    r: rand(0, Math.PI),
    rv: rand(-0.2, 0.2),
    hue: i * (360 / N) + rand(-20, 20),
  }));
  animateConfetti();
}
function animateConfetti() {
  cctx.clearRect(0, 0, c.width, c.height);
  let alive = false;
  for (const p of confettis) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.rv;
    if (p.y < c.height + 40) {
      alive = true;
    }
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.r);
    cctx.fillStyle = `hsl(${p.hue}deg 90% 60%)`;
    cctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.6);
    cctx.restore();
  }
  if (alive) requestAnimationFrame(animateConfetti);
}
function showOverlay() {
  overlay.classList.add("show");
}
function hideOverlay() {
  overlay.classList.remove("show");
}
byId("btnSpin").addEventListener("click", spin);
byId("btnSample").addEventListener("click", () => {
  const now = itemsEl.value.trim();
  const add = sample.filter((s) => !now.includes(s)).join("\n");
  itemsEl.value = (now ? now + "\n" : "") + add;
  parseItems();
  drawWheel();
});
byId("btnClear").addEventListener("click", () => {
  itemsEl.value = "";
  parseItems();
  drawWheel();
  removed.clear();
  statusEl.textContent = "Đã xóa.";
});
byId("playAgain").addEventListener("click", () => {
  hideOverlay();
  setTimeout(spin, 150);
});
byId("copyResult").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(winnerText.textContent);
    statusEl.textContent = "Đã sao chép.";
  } catch {
    statusEl.textContent = "Không sao chép được.";
  }
});
byId("closeOverlay").addEventListener("click", hideOverlay);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) hideOverlay();
});
document.querySelector(".pin").addEventListener("click", spin);

// Excel import
document
  .getElementById("excelFile")
  .addEventListener("change", handleFile, false);
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Bỏ dòng tiêu đề, duyệt từng dòng
    const values = rows
      .slice(1)
      .map((r) => {
        const stt = r[0] || "";
        const msv = r[1] || "";
        const hoLot = r[2] || "";
        const ten = r[3] || "";
        return `${stt} - ${msv} - ${hoLot} ${ten}`.trim();
      })
      .filter(Boolean);
    itemsEl.value = values.join("\n");
    parseItems();
    drawWheel();
  };
  reader.readAsArrayBuffer(file);
}

parseItems();
drawWheel();
