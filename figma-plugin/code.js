// ScholarSphere Design System Builder v2 — Full typography edition
figma.showUI(__html__, { width: 420, height: 560, title: "ScholarSphere DS Builder" });

// ─── Utilities ───────────────────────────────────────────────────────────────

function hex(h) {
  const r = parseInt(h.slice(1,3),16)/255, g = parseInt(h.slice(3,5),16)/255, b = parseInt(h.slice(5,7),16)/255;
  return { r, g, b };
}
function rgba(r,g,b,a=1){ return { r:r/255,g:g/255,b:b/255,a }; }
function solid(color, opacity=1){ return [{ type:"SOLID", color, opacity }]; }
function post(type,message,percent){ figma.ui.postMessage({ type,message,percent }); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// ─── Brand Tokens ─────────────────────────────────────────────────────────────

const C = {
  navy:      hex("#0f172a"), emerald: hex("#10b981"), amber:   hex("#f59e0b"),
  rose:      hex("#e11d48"), shell:   hex("#f8fafc"), surface: hex("#ffffff"),
  line:      hex("#e2e8f0"), muted:   hex("#64748b"), ink:     hex("#191c1e"),
  navyLight: hex("#1e293b"), navyMid: hex("#334155"),
  emeraldDk: hex("#059669"), emeraldBg: hex("#ecfdf5"),
  amberBg:   hex("#fffbeb"), roseBg:  hex("#fff1f2"),
  sky:       hex("#0ea5e9"), skyBg:   hex("#f0f9ff"),
  purple:    hex("#7c3aed"), purpleBg: hex("#f3e8ff"),
  sky700:    hex("#0369a1"), sky100:  hex("#e0f2fe"),
  amber600:  hex("#d97706"),
};

// ─── Shape helpers ────────────────────────────────────────────────────────────

function makeFrame(name, w, h) {
  const f = figma.createFrame();
  f.name = name; f.resize(w, h); f.clipsContent = true;
  return f;
}

function makeRect(w, h, color, opacity=1, radius=0) {
  const r = figma.createRectangle();
  r.resize(w, h); r.fills = solid(color, opacity); r.cornerRadius = radius;
  return r;
}

// ─── Text helper (call AFTER loadFonts) ──────────────────────────────────────

function txt(content, size, weight, color, opacity=1) {
  const t = figma.createText();
  try { t.fontName = { family:"Inter", style:weight }; }
  catch(e) { t.fontName = { family:"Inter", style:"Regular" }; }
  t.fontSize = size;
  t.fills = solid(color, opacity);
  t.characters = String(content);
  return t;
}

async function loadFonts() {
  for (const style of ["Regular","Medium","Semi Bold","Bold"]) {
    try { await figma.loadFontAsync({ family:"Inter", style }); } catch(e){}
  }
}

// ─── Color + Text + Shadow Styles ────────────────────────────────────────────

async function createColorStyles() {
  const existing = await figma.getLocalPaintStylesAsync();
  const colorDefs = [
    ["Brand/Navy",    C.navy],   ["Brand/Emerald", C.emerald],
    ["Brand/Amber",   C.amber],  ["Brand/Rose",    C.rose],
    ["Brand/Purple",  C.purple], ["UI/Shell",      C.shell],
    ["UI/Surface",    C.surface],["UI/Line",       C.line],
    ["UI/Muted",      C.muted],  ["UI/Ink",        C.ink],
  ];
  for (const [name, color] of colorDefs) {
    if (existing.find(s => s.name === name)) continue;
    const s = figma.createPaintStyle();
    s.name = name; s.paints = solid(color);
  }
}

async function createTextStyles() {
  const existing = await figma.getLocalTextStylesAsync();
  const defs = [
    ["Type/Display",    40,"Bold"],    ["Type/H1",     32,"Bold"],
    ["Type/H2",         24,"Bold"],    ["Type/H3",     20,"Semi Bold"],
    ["Type/Body-LG",    16,"Regular"], ["Type/Body",   14,"Regular"],
    ["Type/Body-SM",    12,"Regular"], ["Type/Caption", 11,"Regular"],
    ["Type/Label",      10,"Semi Bold"],
  ];
  for (const [name, size, weight] of defs) {
    if (existing.find(s => s.name === name)) continue;
    const s = figma.createTextStyle();
    s.name = name;
    try { s.fontName = { family:"Inter", style:weight }; } catch(e){}
    s.fontSize = size;
  }
}

async function createShadowStyles() {
  const existing = await figma.getLocalEffectStylesAsync();
  const defs = [
    ["Shadow/SM",  [{ type:"DROP_SHADOW", color:rgba(15,23,42,0.05), offset:{x:0,y:1},  radius:3,  spread:0, visible:true, blendMode:"NORMAL" }]],
    ["Shadow/MD",  [{ type:"DROP_SHADOW", color:rgba(15,23,42,0.08), offset:{x:0,y:4},  radius:12, spread:-2,visible:true, blendMode:"NORMAL" }]],
    ["Shadow/LG",  [{ type:"DROP_SHADOW", color:rgba(15,23,42,0.12), offset:{x:0,y:10}, radius:24, spread:-4,visible:true, blendMode:"NORMAL" }]],
    ["Shadow/XL",  [{ type:"DROP_SHADOW", color:rgba(15,23,42,0.16), offset:{x:0,y:20}, radius:40, spread:-8,visible:true, blendMode:"NORMAL" }]],
  ];
  for (const [name, effects] of defs) {
    if (existing.find(s => s.name === name)) continue;
    const s = figma.createEffectStyle();
    s.name = name; s.effects = effects;
  }
}

// ─── Phase 1: Foundation ──────────────────────────────────────────────────────

async function buildFoundation() {
  post("head","Phase 1 — Foundation");
  await loadFonts();

  let page = figma.root.children.find(p => p.name === "🎨 Foundation");
  if (!page) { page = figma.createPage(); page.name = "🎨 Foundation"; }
  await figma.setCurrentPageAsync(page);
  page.children.forEach(c => c.remove());

  post("progress","Color palette…",15);
  const colorFrame = buildColorPalette();
  colorFrame.x = 0; colorFrame.y = 0;
  page.appendChild(colorFrame);
  post("step","Color palette");

  post("progress","Typography scale…",40);
  const typeFrame = buildTypographyScale();
  typeFrame.x = 0; typeFrame.y = colorFrame.height + 80;
  page.appendChild(typeFrame);
  post("step","Typography");

  post("progress","Spacing & shadows…",65);
  const spacingFrame = buildSpacingFrame();
  spacingFrame.x = colorFrame.width + 80; spacingFrame.y = 0;
  page.appendChild(spacingFrame);
  post("step","Spacing & shadows");

  post("progress","Creating styles…",85);
  await createColorStyles();
  await createTextStyles();
  await createShadowStyles();
  post("step","Styles registered");

  figma.viewport.scrollAndZoomIntoView(page.children);
  post("progress","Done!",100); post("done");
}

function buildColorPalette() {
  const palette = [
    { name:"Navy",    hex:"#0f172a", color:C.navy,    light:false, tag:"Primary" },
    { name:"Emerald", hex:"#10b981", color:C.emerald, light:false, tag:"Success / CTA" },
    { name:"Amber",   hex:"#f59e0b", color:C.amber,   light:true,  tag:"Warning" },
    { name:"Rose",    hex:"#e11d48", color:C.rose,    light:false, tag:"Danger" },
    { name:"Purple",  hex:"#7c3aed", color:C.purple,  light:false, tag:"Super Admin" },
    { name:"Shell",   hex:"#f8fafc", color:C.shell,   light:true,  tag:"Background" },
    { name:"Muted",   hex:"#64748b", color:C.muted,   light:false, tag:"Secondary Text" },
    { name:"Line",    hex:"#e2e8f0", color:C.line,    light:true,  tag:"Border / Divider" },
  ];

  const COLS = palette.length;
  const SW = 130, SH = 200, GAP = 16, PAD = 40;
  const W = PAD*2 + COLS*(SW+GAP) - GAP;
  const frame = makeFrame("Color Palette", W, SH + PAD*2 + 60);
  frame.fills = solid(C.surface);

  const heading = txt("Color Palette", 20, "Bold", C.ink);
  heading.x = PAD; heading.y = 20;
  frame.appendChild(heading);
  const sub = txt("Brand colors & semantic tokens — ScholarSphere", 12, "Regular", C.muted);
  sub.x = PAD; sub.y = 46;
  frame.appendChild(sub);

  palette.forEach((p, i) => {
    const x = PAD + i*(SW+GAP);
    const y = 72;
    const textColor = p.light ? C.ink : C.surface;

    const card = makeRect(SW, SH, C.shell, 1, 10);
    card.strokes = [{ type:"SOLID", color:C.line }]; card.strokeWeight = 1;
    card.x = x; card.y = y;
    frame.appendChild(card);

    const swatch = makeRect(SW, 120, p.color, 1, 0);
    swatch.topLeftRadius = 10; swatch.topRightRadius = 10;
    swatch.x = x; swatch.y = y;
    frame.appendChild(swatch);

    const nameT = txt(p.name, 11, "Semi Bold", C.ink);
    nameT.x = x+10; nameT.y = y+128;
    frame.appendChild(nameT);

    const hexT = txt(p.hex, 10, "Regular", C.muted);
    hexT.x = x+10; hexT.y = y+144;
    frame.appendChild(hexT);

    const tagT = txt(p.tag, 9, "Regular", C.muted);
    tagT.x = x+10; tagT.y = y+160;
    frame.appendChild(tagT);
  });

  return frame;
}

function buildTypographyScale() {
  const styles = [
    { label:"Display",    size:40, weight:"Bold",      sample:"ScholarSphere SMS" },
    { label:"Heading 1",  size:32, weight:"Bold",      sample:"Admin Dashboard" },
    { label:"Heading 2",  size:24, weight:"Bold",      sample:"Student Records" },
    { label:"Heading 3",  size:20, weight:"Semi Bold", sample:"Active Enrollments" },
    { label:"Body Large", size:16, weight:"Regular",   sample:"Manage attendance, grades, and fee payments" },
    { label:"Body Base",  size:14, weight:"Regular",   sample:"Kofi Asante · Grade 10B · ID: STU-2024-001" },
    { label:"Body Small", size:12, weight:"Regular",   sample:"Last login: Today at 9:41 AM · Role: Super Admin" },
    { label:"Caption",    size:11, weight:"Regular",   sample:"Updated 2 minutes ago" },
    { label:"Label",      size:10, weight:"Semi Bold", sample:"ACTIVE · TEACHER · ENROLLED · PENDING" },
  ];

  const frame = makeFrame("Typography Scale", 1000, 100);
  frame.fills = solid(C.surface);

  const heading = txt("Typography Scale", 20, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);
  const sub = txt("Inter typeface — all weights and sizes", 12, "Regular", C.muted);
  sub.x = 40; sub.y = 46;
  frame.appendChild(sub);

  let y = 80;
  styles.forEach(s => {
    const lbl = txt(s.label, 10, "Semi Bold", C.muted);
    lbl.x = 40; lbl.y = y + Math.max(0, s.size - 14);
    frame.appendChild(lbl);

    const sample = txt(s.sample, s.size, s.weight, C.ink);
    sample.x = 200; sample.y = y;
    frame.appendChild(sample);

    const div = makeRect(920, 1, C.line);
    div.x = 40; div.y = y + s.size + 16;
    frame.appendChild(div);

    y += s.size + 40;
  });

  frame.resize(1000, y + 40);
  return frame;
}

function buildSpacingFrame() {
  const frame = makeFrame("Spacing & Shadows", 500, 100);
  frame.fills = solid(C.surface);

  const heading = txt("Spacing Scale", 20, "Bold", C.ink);
  heading.x = 32; heading.y = 20;
  frame.appendChild(heading);
  const sub = txt("8px grid system", 12, "Regular", C.muted);
  sub.x = 32; sub.y = 46;
  frame.appendChild(sub);

  const tokens = [2, 4, 8, 12, 16, 24, 32, 48, 64, 80];
  let y = 72;
  tokens.forEach(s => {
    const bar = makeRect(s, 20, C.emerald, 0.7, 4);
    bar.x = 160; bar.y = y;
    frame.appendChild(bar);

    const lbl = txt(`${s}px`, 10, "Regular", C.muted);
    lbl.x = 32; lbl.y = y + 3;
    frame.appendChild(lbl);

    y += 32;
  });

  const sh = txt("Shadow Tokens", 20, "Bold", C.ink);
  sh.x = 32; sh.y = y + 24;
  frame.appendChild(sh);

  const shadows = [
    { name:"shadow-sm", r:3,  offset:1,  c:rgba(15,23,42,0.05) },
    { name:"shadow-md", r:12, offset:4,  c:rgba(15,23,42,0.08) },
    { name:"shadow-lg", r:24, offset:10, c:rgba(15,23,42,0.12) },
    { name:"shadow-xl", r:40, offset:20, c:rgba(15,23,42,0.16) },
  ];
  let sy = y + 64;
  shadows.forEach(s => {
    const card = makeRect(180, 72, C.surface, 1, 10);
    card.effects = [{ type:"DROP_SHADOW", color:s.c, offset:{x:0,y:s.offset}, radius:s.r, spread:0, visible:true, blendMode:"NORMAL" }];
    card.x = 32; card.y = sy;
    frame.appendChild(card);

    const lbl = txt(s.name, 11, "Semi Bold", C.muted);
    lbl.x = 230; lbl.y = sy + 26;
    frame.appendChild(lbl);
    sy += 92;
  });

  frame.resize(500, sy + 40);
  return frame;
}

// ─── Phase 2: Components ──────────────────────────────────────────────────────

async function buildComponents() {
  post("head","Phase 2 — Components");
  await loadFonts();

  let page = figma.root.children.find(p => p.name === "🧩 Components");
  if (!page) { page = figma.createPage(); page.name = "🧩 Components"; }
  await figma.setCurrentPageAsync(page);
  page.children.forEach(c => c.remove());

  post("progress","Buttons…",20);
  const btnFrame = buildButtonComponents();
  btnFrame.x = 0; btnFrame.y = 0;
  page.appendChild(btnFrame);

  post("progress","Badges…",38);
  const badgeFrame = buildBadgeComponents();
  badgeFrame.x = 0; badgeFrame.y = btnFrame.height + 60;
  page.appendChild(badgeFrame);

  post("progress","Inputs…",55);
  const inputFrame = buildInputComponents();
  inputFrame.x = btnFrame.width + 80; inputFrame.y = 0;
  page.appendChild(inputFrame);

  post("progress","Avatars…",70);
  const avatarFrame = buildAvatarComponents();
  avatarFrame.x = 0; avatarFrame.y = btnFrame.height + badgeFrame.height + 120;
  page.appendChild(avatarFrame);

  post("progress","Toggles…",85);
  const toggleFrame = buildToggleComponents();
  toggleFrame.x = 0; toggleFrame.y = btnFrame.height + badgeFrame.height + avatarFrame.height + 180;
  page.appendChild(toggleFrame);

  figma.viewport.scrollAndZoomIntoView(page.children);
  post("progress","Done!",100); post("done");
}

function buildButtonComponents() {
  const variants = [
    { name:"Primary",   bg:C.navy,    textC:C.surface, border:null,     shadow:rgba(16,185,129,0.22) },
    { name:"Secondary", bg:C.surface, textC:C.navy,    border:C.line,   shadow:null },
    { name:"Ghost",     bg:null,      textC:C.emerald, border:C.emerald,shadow:null },
    { name:"Danger",    bg:C.rose,    textC:C.surface, border:null,     shadow:rgba(225,29,72,0.22) },
    { name:"Disabled",  bg:C.shell,   textC:C.muted,   border:C.line,   shadow:null, opacity:0.6 },
  ];
  const sizes = [
    { name:"SM", h:32, px:12, fs:11, fw:"Semi Bold" },
    { name:"MD", h:40, px:16, fs:12, fw:"Semi Bold" },
    { name:"LG", h:48, px:20, fs:13, fw:"Semi Bold" },
  ];
  const labels = {
    Primary:"Sign In", Secondary:"Cancel", Ghost:"View All", Danger:"Delete Record", Disabled:"Not Available"
  };

  const PAD = 40;
  const frame = makeFrame("Buttons", 1100, 100);
  frame.fills = solid(C.shell);

  const heading = txt("Button Components", 16, "Bold", C.ink);
  heading.x = PAD; heading.y = 20;
  frame.appendChild(heading);

  // Column headers
  sizes.forEach((s, si) => {
    const h = txt(s.name, 10, "Semi Bold", C.muted);
    h.x = PAD + 180 + si*180; h.y = 52;
    frame.appendChild(h);
  });

  let y = 70;
  variants.forEach((v, vi) => {
    const rowLabel = txt(v.name, 11, "Semi Bold", C.muted);
    rowLabel.x = PAD; rowLabel.y = y + 12;
    frame.appendChild(rowLabel);

    sizes.forEach((s, si) => {
      const btnW = 140;
      const x = PAD + 180 + si*180;

      const btn = makeRect(btnW, s.h, v.bg ?? C.surface, v.opacity ?? 1, 8);
      if (!v.bg) btn.fills = [{ type:"SOLID", color:C.emerald, opacity:0.06 }];
      if (v.border) { btn.strokes=[{ type:"SOLID", color:v.border }]; btn.strokeWeight=1; }
      if (v.shadow) btn.effects=[{ type:"DROP_SHADOW", color:v.shadow, offset:{x:0,y:4}, radius:12, spread:0, visible:true, blendMode:"NORMAL" }];
      btn.x = x; btn.y = y;
      frame.appendChild(btn);

      const label = txt(labels[v.name], s.fs, s.fw, v.textC, v.opacity ?? 1);
      label.x = x + Math.round((btnW - label.width) / 2);
      label.y = y + Math.round((s.h - label.height) / 2);
      frame.appendChild(label);
    });

    y += 60;
  });

  frame.resize(1100, y + PAD);
  return frame;
}

function buildBadgeComponents() {
  const badges = [
    { label:"Active",      bg:C.emeraldBg, textC:C.emeraldDk },
    { label:"Inactive",    bg:C.shell,     textC:C.muted },
    { label:"Pending",     bg:C.amberBg,   textC:C.amber600 },
    { label:"Blocked",     bg:C.roseBg,    textC:C.rose },
    { label:"Super Admin", bg:C.purpleBg,  textC:C.purple },
    { label:"Teacher",     bg:C.emeraldBg, textC:C.emeraldDk },
    { label:"Student",     bg:C.sky100,    textC:C.sky700 },
    { label:"Guardian",    bg:C.roseBg,    textC:C.rose },
    { label:"Info",        bg:C.skyBg,     textC:C.sky },
    { label:"Warning",     bg:C.amberBg,   textC:C.amber600 },
  ];

  const frame = makeFrame("Badges & Status Chips", 1100, 100);
  frame.fills = solid(C.surface);

  const heading = txt("Badges & Status Chips", 16, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);

  let x = 40;
  badges.forEach(b => {
    const pillW = Math.max(72, b.label.length * 7 + 24);
    const pill = makeRect(pillW, 26, b.bg, 1, 13);
    pill.x = x; pill.y = 60;
    frame.appendChild(pill);

    const lbl = txt(b.label, 10, "Semi Bold", b.textC);
    lbl.x = x + Math.round((pillW - lbl.width)/2);
    lbl.y = 67;
    frame.appendChild(lbl);

    x += pillW + 12;
  });

  frame.resize(x + 40, 110);
  return frame;
}

async function buildInputComponents() {
  const frame = makeFrame("Form Inputs", 520, 100);
  frame.fills = solid(C.shell);

  const heading = txt("Form Inputs", 16, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);

  const states = [
    { state:"Default",  border:C.line,    bg:C.surface, placeholder:"Enter student name…",   labelText:"Student Name", focus:false },
    { state:"Focus",    border:C.emerald, bg:C.surface, placeholder:"kofi.asante@school.gh", labelText:"Email Address", focus:true  },
    { state:"Filled",   border:C.line,    bg:C.surface, placeholder:"10B",                   labelText:"Class / Form",  focus:false },
    { state:"Error",    border:C.rose,    bg:C.surface, placeholder:"Required field",         labelText:"Phone Number",  focus:false, error:"Phone number is required" },
    { state:"Disabled", border:C.line,    bg:C.shell,   placeholder:"Not editable",           labelText:"School ID",     focus:false, disabled:true },
  ];

  let y = 56;
  for (const s of states) {
    const stateLbl = txt(s.state, 9, "Semi Bold", C.muted);
    stateLbl.x = 40; stateLbl.y = y;
    frame.appendChild(stateLbl);

    const fieldLbl = txt(s.labelText, 11, "Semi Bold", s.disabled ? C.muted : C.ink);
    fieldLbl.x = 120; fieldLbl.y = y;
    frame.appendChild(fieldLbl);

    const input = makeRect(340, 40, s.bg, 1, 8);
    input.strokes = [{ type:"SOLID", color:s.border }];
    input.strokeWeight = s.focus ? 1.5 : 1;
    if (s.disabled) input.opacity = 0.55;
    if (s.focus) input.effects = [{ type:"DROP_SHADOW", color:rgba(16,185,129,0.15), offset:{x:0,y:0}, radius:0, spread:3, visible:true, blendMode:"NORMAL" }];
    if (s.error === "Phone number is required") input.effects = [{ type:"DROP_SHADOW", color:rgba(225,29,72,0.15), offset:{x:0,y:0}, radius:0, spread:3, visible:true, blendMode:"NORMAL" }];
    input.x = 120; input.y = y + 18;
    frame.appendChild(input);

    const ph = txt(s.placeholder, 12, "Regular", C.muted);
    ph.x = 132; ph.y = y + 28;
    frame.appendChild(ph);

    if (s.error) {
      const errT = txt(s.error, 10, "Regular", C.rose);
      errT.x = 120; errT.y = y + 64;
      frame.appendChild(errT);
    }

    y += s.error ? 90 : 72;
  }

  frame.resize(520, y + 40);
  return frame;
}

function buildAvatarComponents() {
  const frame = makeFrame("Avatars", 700, 160);
  frame.fills = solid(C.surface);

  const heading = txt("Avatars", 16, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);

  const sizes = [{ s:24,lbl:"XS"},{s:36,lbl:"SM"},{s:48,lbl:"MD"},{s:64,lbl:"LG"}];
  const roleColors = [
    { c:C.purple, lbl:"SA"  },
    { c:C.navy,   lbl:"AD"  },
    { c:C.emerald,lbl:"TE"  },
    { c:C.amber600,lbl:"ST" },
    { c:C.sky700, lbl:"GU"  },
    { c:C.rose,   lbl:"BU"  },
  ];
  const initials = ["KA","JO","MN","AB"];

  let x = 40;
  sizes.forEach((sz, i) => {
    const circle = makeRect(sz.s, sz.s, C.navy, 1, sz.s/2);
    circle.x = x; circle.y = 56;
    frame.appendChild(circle);

    const init = txt(initials[i], Math.round(sz.s*0.3), "Semi Bold", C.surface);
    init.x = x + Math.round((sz.s-init.width)/2);
    init.y = 56 + Math.round((sz.s-init.height)/2);
    frame.appendChild(init);

    const lbl = txt(sz.lbl, 9, "Regular", C.muted);
    lbl.x = x + Math.round((sz.s - lbl.width)/2); lbl.y = 56 + sz.s + 6;
    frame.appendChild(lbl);

    x += sz.s + 20;
  });

  x += 40;
  roleColors.forEach(rc => {
    const circle = makeRect(40, 40, rc.c, 1, 20);
    circle.x = x; circle.y = 60;
    frame.appendChild(circle);

    const init = txt(rc.lbl, 12, "Semi Bold", C.surface);
    init.x = x + Math.round((40-init.width)/2);
    init.y = 60 + Math.round((40-init.height)/2);
    frame.appendChild(init);

    x += 56;
  });

  frame.resize(x + 40, 140);
  return frame;
}

function buildToggleComponents() {
  const frame = makeFrame("Toggles & Checkboxes", 760, 160);
  frame.fills = solid(C.surface);

  const heading = txt("Toggles & Checkboxes", 16, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);

  // Toggle ON
  const tOn = makeRect(44, 24, C.emerald, 1, 12);
  tOn.x = 40; tOn.y = 68; frame.appendChild(tOn);
  const thumbOn = makeRect(18,18,C.surface,1,9);
  thumbOn.x = 43+44-21; thumbOn.y = 71;
  thumbOn.effects=[{ type:"DROP_SHADOW", color:rgba(15,23,42,0.1), offset:{x:0,y:1}, radius:4, spread:0, visible:true, blendMode:"NORMAL" }];
  frame.appendChild(thumbOn);
  const onLbl = txt("On", 11, "Regular", C.muted); onLbl.x=40; onLbl.y=98; frame.appendChild(onLbl);

  // Toggle OFF
  const tOff = makeRect(44,24,C.muted,0.3,12);
  tOff.x = 120; tOff.y = 68; frame.appendChild(tOff);
  const thumbOff = makeRect(18,18,C.surface,1,9);
  thumbOff.x=123; thumbOff.y=71;
  thumbOff.effects=thumbOn.effects;
  frame.appendChild(thumbOff);
  const offLbl = txt("Off",11,"Regular",C.muted); offLbl.x=120; offLbl.y=98; frame.appendChild(offLbl);

  // Checkbox checked
  const cbOn = makeRect(20,20,C.navy,1,4); cbOn.x=220; cbOn.y=70; frame.appendChild(cbOn);
  const ck = txt("✓",11,"Bold",C.surface); ck.x=224; ck.y=71; frame.appendChild(ck);
  const cbOnL = txt("Checked",11,"Regular",C.muted); cbOnL.x=248; cbOnL.y=75; frame.appendChild(cbOnL);

  // Checkbox unchecked
  const cbOff = makeRect(20,20,C.surface,1,4);
  cbOff.strokes=[{ type:"SOLID", color:C.line }]; cbOff.strokeWeight=1.5;
  cbOff.x=350; cbOff.y=70; frame.appendChild(cbOff);
  const cbOffL = txt("Unchecked",11,"Regular",C.muted); cbOffL.x=378; cbOffL.y=75; frame.appendChild(cbOffL);

  // Radio ON
  const rdOn = makeRect(20,20,C.navy,1,10); rdOn.x=490; rdOn.y=70; frame.appendChild(rdOn);
  const rdOnI = makeRect(8,8,C.surface,1,4); rdOnI.x=496; rdOnI.y=76; frame.appendChild(rdOnI);
  const rdOnL = txt("Selected",11,"Regular",C.muted); rdOnL.x=518; rdOnL.y=75; frame.appendChild(rdOnL);

  // Radio OFF
  const rdOff = makeRect(20,20,C.surface,1,10);
  rdOff.strokes=[{ type:"SOLID", color:C.line }]; rdOff.strokeWeight=1.5;
  rdOff.x=620; rdOff.y=70; frame.appendChild(rdOff);
  const rdOffL = txt("Unselected",11,"Regular",C.muted); rdOffL.x=648; rdOffL.y=75; frame.appendChild(rdOffL);

  frame.resize(760, 130);
  return frame;
}

// ─── Phase 3: Composite Components ───────────────────────────────────────────

async function buildComposite() {
  post("head","Phase 3 — Composite Components");
  await loadFonts();

  let page = figma.root.children.find(p => p.name === "🏗️ Composite");
  if (!page) { page = figma.createPage(); page.name = "🏗️ Composite"; }
  await figma.setCurrentPageAsync(page);
  page.children.forEach(c => c.remove());

  post("progress","Cards…",20);
  const cardFrame = buildCardComponents();
  cardFrame.x = 0; cardFrame.y = 0; page.appendChild(cardFrame);

  post("progress","Modals…",38);
  const modalFrame = buildModalComponents();
  modalFrame.x = 0; modalFrame.y = cardFrame.height + 80; page.appendChild(modalFrame);

  post("progress","Toasts…",55);
  const toastFrame = buildToastComponents();
  toastFrame.x = cardFrame.width + 80; toastFrame.y = 0; page.appendChild(toastFrame);

  post("progress","Empty states…",70);
  const emptyFrame = buildEmptyStates();
  emptyFrame.x = cardFrame.width + 80; emptyFrame.y = toastFrame.height + 80; page.appendChild(emptyFrame);

  post("progress","Table…",85);
  const tableFrame = buildTableComponent();
  tableFrame.x = 0; tableFrame.y = cardFrame.height + modalFrame.height + 160; page.appendChild(tableFrame);

  figma.viewport.scrollAndZoomIntoView(page.children);
  post("progress","Done!",100); post("done");
}

function buildCardComponents() {
  const frame = makeFrame("Cards", 980, 400);
  frame.fills = solid(C.shell);

  const heading = txt("Card Components", 16, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);

  // Base card
  const base = makeRect(260, 200, C.surface, 1, 12);
  base.effects=[{ type:"DROP_SHADOW", color:rgba(15,23,42,0.06), offset:{x:0,y:4}, radius:12, spread:-2, visible:true, blendMode:"NORMAL" }];
  base.x=40; base.y=60; frame.appendChild(base);
  frame.appendChild(Object.assign(makeRect(260,1,C.line),{x:40,y:112}));
  const bT = txt("Student Profile", 13, "Semi Bold", C.ink); bT.x=56; bT.y=74; frame.appendChild(bT);
  const bS = txt("Grade 10B · Active", 11, "Regular", C.muted); bS.x=56; bS.y=93; frame.appendChild(bS);
  const bBody = txt("Kofi Asante has maintained\nan attendance rate of 94%\nthis term with 3 subjects.", 12, "Regular", C.muted);
  bBody.x=56; bBody.y=124; bBody.lineHeight={unit:"PIXELS",value:19};
  frame.appendChild(bBody);
  const viewBtn = makeRect(80,30,C.navy,1,6); viewBtn.x=200; viewBtn.y=218; frame.appendChild(viewBtn);
  const viewT = txt("View",11,"Semi Bold",C.surface); viewT.x=220; viewT.y=226; frame.appendChild(viewT);

  // Metric card
  const metric = makeRect(260, 130, C.surface, 1, 12);
  metric.effects=base.effects; metric.x=340; metric.y=60; frame.appendChild(metric);
  const bar = makeRect(4,60,C.emerald,1,2); bar.x=360; bar.y=90; frame.appendChild(bar);
  const mLabel = txt("Total Students", 10, "Semi Bold", C.muted); mLabel.x=376; mLabel.y=86; frame.appendChild(mLabel);
  const mVal = txt("1,247", 28, "Bold", C.ink); mVal.x=376; mVal.y=102; frame.appendChild(mVal);
  const mSub = txt("↑ 12% from last term", 10, "Regular", C.emerald); mSub.x=376; mSub.y=140; frame.appendChild(mSub);

  // Action card
  const action = makeRect(260, 220, C.surface, 1, 12);
  action.effects=base.effects; action.x=640; action.y=60; frame.appendChild(action);
  const aTitle = txt("Fee Payment", 13, "Semi Bold", C.ink); aTitle.x=656; aTitle.y=74; frame.appendChild(aTitle);
  const aSub = txt("GHS 850.00 outstanding", 11, "Regular", C.muted); aSub.x=656; aSub.y=93; frame.appendChild(aSub);
  frame.appendChild(Object.assign(makeRect(260,1,C.line),{x:640,y:112}));
  const aDue = txt("Due: 15 Jan 2025", 11, "Regular", C.rose); aDue.x=656; aDue.y=124; frame.appendChild(aDue);
  const aDesc = txt("Term 1 tuition · Boarding fees\nincluded in this balance.", 11, "Regular", C.muted);
  aDesc.x=656; aDesc.y=144; aDesc.lineHeight={unit:"PIXELS",value:18}; frame.appendChild(aDesc);
  frame.appendChild(Object.assign(makeRect(260,1,C.line),{x:640,y:232}));
  const payBtn = makeRect(100,32,C.emerald,1,6);
  payBtn.effects=[{ type:"DROP_SHADOW", color:rgba(16,185,129,0.25), offset:{x:0,y:4}, radius:12, spread:0, visible:true, blendMode:"NORMAL" }];
  payBtn.x=784; payBtn.y=240; frame.appendChild(payBtn);
  const payT = txt("Pay Now",11,"Semi Bold",C.surface); payT.x=804; payT.y=248; frame.appendChild(payT);
  const cancelT = txt("Remind later",10,"Regular",C.muted); cancelT.x=660; cancelT.y=248; frame.appendChild(cancelT);

  frame.resize(980, 310);
  return frame;
}

function buildModalComponents() {
  const frame = makeFrame("Modals", 1260, 500);
  frame.fills = solid(C.shell);

  const heading = txt("Modal Dialogs", 16, "Bold", C.ink);
  heading.x = 40; heading.y = 20;
  frame.appendChild(heading);

  const modals = [
    { w:400, h:220, title:"Confirm Deletion", body:"Are you sure you want to remove Kofi Asante from the system? This action cannot be undone.", confirmLabel:"Delete", confirmColor:C.rose },
    { w:520, h:380, title:"Edit Student Record", body:"Update the student's personal details and academic information below.", confirmLabel:"Save Changes", confirmColor:C.navy },
    { w:680, h:440, title:"Generate Report", body:"Select the report type and date range to generate a detailed academic report.", confirmLabel:"Generate PDF", confirmColor:C.emerald },
  ];

  let x = 40;
  modals.forEach(m => {
    const overlay = makeRect(m.w, m.h, C.navy, 0.04, 16);
    overlay.x = x; overlay.y = 60; frame.appendChild(overlay);

    const modal = makeRect(m.w, m.h, C.surface, 1, 16);
    modal.effects=[{ type:"DROP_SHADOW", color:rgba(15,23,42,0.14), offset:{x:0,y:12}, radius:24, spread:-4, visible:true, blendMode:"NORMAL" }];
    modal.x = x; modal.y = 60; frame.appendChild(modal);

    frame.appendChild(Object.assign(makeRect(m.w,1,C.line),{x, y:60+56}));
    frame.appendChild(Object.assign(makeRect(m.w,1,C.line),{x, y:60+m.h-56}));

    const mTitle = txt(m.title, 15, "Semi Bold", C.ink); mTitle.x=x+24; mTitle.y=76; frame.appendChild(mTitle);
    const close = txt("✕", 12, "Regular", C.muted); close.x=x+m.w-32; close.y=76; frame.appendChild(close);

    const mBody = txt(m.body, 12, "Regular", C.muted);
    mBody.textAutoResize="HEIGHT"; mBody.resize(m.w-48, mBody.height);
    mBody.lineHeight={unit:"PIXELS",value:20};
    mBody.x=x+24; mBody.y=80; frame.appendChild(mBody);

    const cancelBtn = makeRect(80,34,C.surface,1,8);
    cancelBtn.strokes=[{ type:"SOLID", color:C.line }]; cancelBtn.strokeWeight=1;
    cancelBtn.x=x+m.w-204; cancelBtn.y=60+m.h-45; frame.appendChild(cancelBtn);
    const cancelT = txt("Cancel",11,"Semi Bold",C.muted); cancelT.x=x+m.w-204+20; cancelT.y=60+m.h-39; frame.appendChild(cancelT);

    const confirmBtn = makeRect(112,34,m.confirmColor,1,8);
    confirmBtn.effects=[{ type:"DROP_SHADOW", color:rgba(16,185,129,0.2), offset:{x:0,y:4}, radius:12, spread:0, visible:true, blendMode:"NORMAL" }];
    confirmBtn.x=x+m.w-112-16; confirmBtn.y=60+m.h-45; frame.appendChild(confirmBtn);
    const confT = txt(m.confirmLabel, 11, "Semi Bold", C.surface);
    confT.x=x+m.w-112-16+Math.round((112-confT.width)/2); confT.y=60+m.h-39; frame.appendChild(confT);

    // Form fields in medium modal
    if (m.w === 520) {
      const fields = [["First Name","Kofi"],["Last Name","Asante"],["Class","Grade 10B"],["Status","Active"]];
      let fy = 60+100; let fx = x+24;
      fields.forEach((f,fi) => {
        const col = fi%2===0 ? fx : fx+232;
        if (fi%2===0 && fi>0) fy += 64;
        const fLbl = txt(f[0],10,"Semi Bold",C.muted); fLbl.x=col; fLbl.y=fy; frame.appendChild(fLbl);
        const field = makeRect(220,36,C.shell,1,6);
        field.strokes=[{ type:"SOLID", color:C.line }]; field.strokeWeight=1;
        field.x=col; field.y=fy+16; frame.appendChild(field);
        const fVal = txt(f[1],12,"Regular",C.ink); fVal.x=col+12; fVal.y=fy+25; frame.appendChild(fVal);
      });
    }

    x += m.w + 40;
  });

  frame.resize(x + 40, 520);
  return frame;
}

function buildToastComponents() {
  const frame = makeFrame("Toast Notifications", 440, 100);
  frame.fills = solid(C.shell);

  const heading = txt("Toast Notifications", 16, "Bold", C.ink);
  heading.x = 32; heading.y = 20;
  frame.appendChild(heading);

  const toasts = [
    { type:"Success", bg:C.emeraldBg, border:C.emerald, dot:C.emerald, msg:"Student record saved successfully.", action:"Undo" },
    { type:"Warning", bg:C.amberBg,   border:C.amber,   dot:C.amber,   msg:"Fee payment is 3 days overdue.",    action:"View" },
    { type:"Error",   bg:C.roseBg,    border:C.rose,    dot:C.rose,    msg:"Failed to export report. Try again.", action:"Retry" },
    { type:"Info",    bg:C.skyBg,     border:C.sky,     dot:C.sky,     msg:"New timetable published for Term 2.", action:"Open" },
  ];

  let y = 56;
  toasts.forEach(t => {
    const toast = makeRect(376, 56, t.bg, 1, 10);
    toast.strokes=[{ type:"SOLID", color:t.border, opacity:0.35 }]; toast.strokeWeight=1;
    toast.effects=[{ type:"DROP_SHADOW", color:rgba(15,23,42,0.08), offset:{x:0,y:4}, radius:12, spread:0, visible:true, blendMode:"NORMAL" }];
    toast.x=32; toast.y=y; frame.appendChild(toast);

    const bar = makeRect(4,56,t.border,0.6,0);
    bar.topLeftRadius=10; bar.bottomLeftRadius=10;
    bar.x=32; bar.y=y; frame.appendChild(bar);

    const typeLbl = txt(t.type, 10, "Semi Bold", t.dot); typeLbl.x=52; typeLbl.y=y+10; frame.appendChild(typeLbl);
    const msgLbl  = txt(t.msg,  11, "Regular",   C.ink);  msgLbl.x=52;  msgLbl.y=y+26; frame.appendChild(msgLbl);
    const actLbl  = txt(t.action,10,"Semi Bold",  t.dot);  actLbl.x=370-actLbl.width;  actLbl.y=y+24; frame.appendChild(actLbl);

    y += 72;
  });

  frame.resize(440, y + 32);
  return frame;
}

function buildEmptyStates() {
  const states = [
    { icon:"—", title:"No Records Found",    sub:"There are no records matching your filters.",  border:C.line,    color:C.muted   },
    { icon:"○", title:"No Search Results",   sub:"Try adjusting your search terms or filters.",  border:C.line,    color:C.muted   },
    { icon:"✕", title:"Access Denied",        sub:"You don't have permission to view this page.", border:C.rose,    color:C.rose    },
    { icon:"·", title:"No Connection",        sub:"Check your internet connection and try again.", border:C.amber,  color:C.amber   },
    { icon:"✓", title:"All Caught Up",        sub:"No pending actions. Everything is up to date.", border:C.emerald,color:C.emerald },
  ];

  const frame = makeFrame("Empty States", 360, 100);
  frame.fills = solid(C.surface);

  const heading = txt("Empty States", 16, "Bold", C.ink);
  heading.x = 32; heading.y = 20;
  frame.appendChild(heading);

  let y = 56;
  states.forEach(s => {
    const card = makeRect(300, 110, C.shell, 1, 12);
    card.strokes=[{ type:"SOLID", color:s.border, opacity:0.3 }]; card.strokeWeight=1;
    card.strokeDashes=[6,4]; card.x=30; card.y=y; frame.appendChild(card);

    const iconT = txt(s.icon, 22, "Bold", s.color); iconT.x=50; iconT.y=y+18; frame.appendChild(iconT);
    const titleT = txt(s.title, 13, "Semi Bold", C.ink); titleT.x=88; titleT.y=y+22; frame.appendChild(titleT);
    const subT   = txt(s.sub,   11, "Regular",   C.muted);
    subT.textAutoResize="HEIGHT"; subT.resize(192, subT.height);
    subT.lineHeight={unit:"PIXELS",value:17}; subT.x=88; subT.y=y+42; frame.appendChild(subT);

    y += 126;
  });

  frame.resize(360, y + 32);
  return frame;
}

function buildTableComponent() {
  const cols = [
    { label:"Student",    w:260 },
    { label:"Class",      w:120 },
    { label:"Status",     w:120 },
    { label:"Attendance", w:130 },
    { label:"Fee Status", w:140 },
    { label:"Actions",    w:100 },
  ];
  const students = [
    { name:"Kofi Asante",    id:"STU-001", class:"10B", status:"Active",   att:"94%", fee:"Paid",    feeC:C.emerald },
    { name:"Ama Boateng",    id:"STU-002", class:"10A", status:"Active",   att:"88%", fee:"Pending", feeC:C.amber   },
    { name:"Kwame Mensah",   id:"STU-003", class:"11C", status:"Inactive", att:"62%", fee:"Overdue", feeC:C.rose    },
    { name:"Abena Asare",    id:"STU-004", class:"10B", status:"Active",   att:"97%", fee:"Paid",    feeC:C.emerald },
    { name:"Yaw Darko",      id:"STU-005", class:"12A", status:"Active",   att:"81%", fee:"Pending", feeC:C.amber   },
    { name:"Efua Sarpong",   id:"STU-006", class:"11B", status:"Active",   att:"91%", fee:"Paid",    feeC:C.emerald },
  ];

  const totalW = cols.reduce((s,c) => s+c.w, 0) + 40;
  const frame = makeFrame("Data Table — Students", totalW, 100);
  frame.fills = solid(C.surface);

  const heading = txt("Data Table — Students List", 16, "Bold", C.ink);
  heading.x = 20; heading.y = 20;
  frame.appendChild(heading);

  // Search + Add row
  const searchBox = makeRect(280,36,C.shell,1,8);
  searchBox.strokes=[{ type:"SOLID", color:C.line }]; searchBox.strokeWeight=1;
  searchBox.x=20; searchBox.y=54; frame.appendChild(searchBox);
  const srchF2 = iconF(12); iSearch(srchF2, C.muted, 12); srchF2.x=32; srchF2.y=63; frame.appendChild(srchF2);
  const searchPh = txt("Search students…", 12, "Regular", C.muted); searchPh.x=50; searchPh.y=63; frame.appendChild(searchPh);

  const addBtn = makeRect(140,36,C.navy,1,8);
  addBtn.effects=[{ type:"DROP_SHADOW", color:rgba(16,185,129,0.2), offset:{x:0,y:4}, radius:12, spread:0, visible:true, blendMode:"NORMAL" }];
  addBtn.x=totalW-160; addBtn.y=54; frame.appendChild(addBtn);
  const addT = txt("+ Add Student",11,"Semi Bold",C.surface); addT.x=totalW-140; addT.y=63; frame.appendChild(addT);

  // Header row
  const header = makeRect(totalW, 44, C.navy, 0.05, 0);
  header.x=0; header.y=102; frame.appendChild(header);

  let hx = 20;
  cols.forEach(c => {
    const hT = txt(c.label, 10, "Semi Bold", C.muted); hT.x=hx; hT.y=116; frame.appendChild(hT);
    hx += c.w;
  });

  // Data rows
  let ry = 146;
  students.forEach((s, i) => {
    const row = makeRect(totalW, 52, i%2===0 ? C.surface : C.shell, 1, 0);
    row.x=0; row.y=ry; frame.appendChild(row);
    const rowDiv = makeRect(totalW,1,C.line); rowDiv.x=0; rowDiv.y=ry+51; frame.appendChild(rowDiv);

    if (i===2) { // Hover state
      const hov = makeRect(totalW,52,C.emerald,0.04,0); hov.x=0; hov.y=ry; frame.appendChild(hov);
    }

    // Avatar
    const av = makeRect(32,32,C.navy,0.15,16); av.x=20; av.y=ry+10; frame.appendChild(av);
    const avI = txt(s.name.split(" ").map(w=>w[0]).join(""),10,"Semi Bold",C.navy); avI.x=26; avI.y=ry+19; frame.appendChild(avI);

    // Name + ID
    const nameT = txt(s.name, 12, "Semi Bold", C.ink); nameT.x=62; nameT.y=ry+10; frame.appendChild(nameT);
    const idT   = txt(s.id,   10, "Regular",  C.muted); idT.x=62;   idT.y=ry+28; frame.appendChild(idT);

    // Class
    const classT = txt(s.class, 12, "Regular", C.ink); classT.x=300; classT.y=ry+19; frame.appendChild(classT);

    // Status badge
    const isActive = s.status==="Active";
    const badge = makeRect(70,22, isActive ? C.emeraldBg : C.shell, 1, 11);
    badge.x=420; badge.y=ry+15; frame.appendChild(badge);
    const badgeT = txt(s.status, 10, "Semi Bold", isActive ? C.emeraldDk : C.muted); badgeT.x=436; badgeT.y=ry+20; frame.appendChild(badgeT);

    // Attendance
    const attT = txt(s.att, 12, "Regular", C.ink); attT.x=550; attT.y=ry+19; frame.appendChild(attT);

    // Fee status
    const feeBg = s.fee==="Paid" ? C.emeraldBg : s.fee==="Pending" ? C.amberBg : C.roseBg;
    const feePill = makeRect(76,22,feeBg,1,11); feePill.x=690; feePill.y=ry+15; frame.appendChild(feePill);
    const feeT = txt(s.fee,10,"Semi Bold",s.feeC); feeT.x=704; feeT.y=ry+20; frame.appendChild(feeT);

    // Actions
    const editBtn = makeRect(48,26,C.shell,1,6);
    editBtn.strokes=[{ type:"SOLID", color:C.line }]; editBtn.strokeWeight=1;
    editBtn.x=800; editBtn.y=ry+13; frame.appendChild(editBtn);
    const editT = txt("Edit",10,"Semi Bold",C.muted); editT.x=812; editT.y=ry+19; frame.appendChild(editT);

    ry += 52;
  });

  // Pagination
  const footerBg = makeRect(totalW, 48, C.shell, 1, 0);
  footerBg.x=0; footerBg.y=ry; frame.appendChild(footerBg);
  const pageInfo = txt("Showing 1–6 of 1,247 students", 11, "Regular", C.muted); pageInfo.x=20; pageInfo.y=ry+15; frame.appendChild(pageInfo);

  const prevBtn = makeRect(72,30,C.surface,1,6); prevBtn.strokes=[{ type:"SOLID", color:C.line }]; prevBtn.strokeWeight=1;
  prevBtn.x=totalW-172; prevBtn.y=ry+9; frame.appendChild(prevBtn);
  const prevT = txt("← Prev",10,"Semi Bold",C.muted); prevT.x=totalW-162; prevT.y=ry+16; frame.appendChild(prevT);

  const nextBtn = makeRect(72,30,C.navy,1,6); nextBtn.x=totalW-92; nextBtn.y=ry+9; frame.appendChild(nextBtn);
  const nextT = txt("Next →",10,"Semi Bold",C.surface); nextT.x=totalW-82; nextT.y=ry+16; frame.appendChild(nextT);

  frame.resize(totalW, ry + 48);
  return frame;
}

// ─── Geometric Icon System (no emoji) ────────────────────────────────────────

function iconF(size) {
  const f = figma.createFrame();
  f.resize(size, size); f.fills = []; f.clipsContent = false;
  return f;
}

function el(w, h, c, o=1) {
  const e = figma.createEllipse(); e.resize(w,h); e.fills = solid(c,o); return e;
}
function elStroke(w, h, c, sw=1.5) {
  const e = figma.createEllipse(); e.resize(w,h); e.fills = []; e.strokes=[{type:"SOLID",color:c}]; e.strokeWeight=sw; return e;
}
function ln(w, h, c, o=1) { return makeRect(w,h,c,o,1); }

function iHome(f,c,s=16) {
  const sq=Math.floor(s*0.42), g2=Math.floor(s*0.14);
  [[0,0],[sq+g2,0],[0,sq+g2],[sq+g2,sq+g2]].forEach(([x,y]) => {
    const r=makeRect(sq,sq,c,1,2); r.x=x+Math.floor((s-sq*2-g2)/2); r.y=y+Math.floor((s-sq*2-g2)/2); f.appendChild(r);
  });
}
function iUsers(f,c,s=16) {
  const h1=el(Math.floor(s*.44),Math.floor(s*.44),c); h1.x=Math.floor(s*.06); h1.y=0; f.appendChild(h1);
  const h2=el(Math.floor(s*.36),Math.floor(s*.36),c,0.45); h2.x=Math.floor(s*.5); h2.y=Math.floor(s*.04); f.appendChild(h2);
  const b1=makeRect(Math.floor(s*.54),Math.floor(s*.32),c,1,3); b1.x=Math.floor(s*.06); b1.y=Math.floor(s*.6); f.appendChild(b1);
  const b2=makeRect(Math.floor(s*.44),Math.floor(s*.28),c,.4,3); b2.x=Math.floor(s*.48); b2.y=Math.floor(s*.64); f.appendChild(b2);
}
function iCalendar(f,c,s=16) {
  const b=makeRect(Math.floor(s*.82),Math.floor(s*.72),c,0,2); b.strokes=[{type:"SOLID",color:c}]; b.strokeWeight=1.5; b.x=Math.floor(s*.09); b.y=Math.floor(s*.22); f.appendChild(b);
  const top=makeRect(Math.floor(s*.82),Math.floor(s*.24),c,1,0); top.topLeftRadius=2; top.topRightRadius=2; top.x=Math.floor(s*.09); top.y=Math.floor(s*.22); f.appendChild(top);
  [[.26,.58],[.5,.58],[.74,.58],[.26,.79],[.5,.79]].forEach(([cx,cy]) => {
    const d=makeRect(2,2,c,1,1); d.x=Math.floor(s*cx)-1; d.y=Math.floor(s*cy)-1; f.appendChild(d);
  });
}
function iChart(f,c,s=16) {
  [[0,.52],[.33,.88],[.66,.66]].forEach(([bx,bh]) => {
    const bw=Math.floor(s*.24), bH=Math.floor(s*bh);
    const r=makeRect(bw,bH,c,1,2); r.x=Math.floor(s*bx+s*.04); r.y=s-bH-2; f.appendChild(r);
  });
  const base=makeRect(s-2,1.5,c); base.x=1; base.y=s-2; f.appendChild(base);
}
function iCoin(f,c,s=16) {
  const o=elStroke(s-2,s-2,c,1.5); o.x=1; o.y=1; f.appendChild(o);
  const v=ln(1.5,Math.floor(s*.5),c); v.x=Math.floor(s/2)-.75; v.y=Math.floor(s*.25); f.appendChild(v);
  const h1=ln(Math.floor(s*.38),1.5,c); h1.x=Math.floor(s*.31); h1.y=Math.floor(s*.38); f.appendChild(h1);
  const h2=ln(Math.floor(s*.38),1.5,c); h2.x=Math.floor(s*.31); h2.y=Math.floor(s*.62); f.appendChild(h2);
}
function iDoc(f,c,s=16) {
  const b=makeRect(Math.floor(s*.72),Math.floor(s*.84),c,0,2); b.strokes=[{type:"SOLID",color:c}]; b.strokeWeight=1.5; b.x=Math.floor(s*.14); b.y=Math.floor(s*.08); f.appendChild(b);
  [[.36,.36],[.36,.52],[.36,.68]].forEach(([lx,ly]) => {
    const r=ln(Math.floor(s*.44),1.5,c); r.x=Math.floor(s*lx); r.y=Math.floor(s*ly); f.appendChild(r);
  });
}
function iGear(f,c,s=16) {
  const o=elStroke(Math.floor(s*.64),Math.floor(s*.64),c,1.5); o.x=Math.floor(s*.18); o.y=Math.floor(s*.18); f.appendChild(o);
  const i=elStroke(Math.floor(s*.28),Math.floor(s*.28),c,1.5); i.x=Math.floor(s*.36); i.y=Math.floor(s*.36); f.appendChild(i);
  [[s/2-1.5,0],[s/2-1.5,s-3],[0,s/2-1.5],[s-3,s/2-1.5]].forEach(([tx,ty]) => {
    const t=makeRect(3,3,c,1,.5); t.x=Math.floor(tx); t.y=Math.floor(ty); f.appendChild(t);
  });
}
function iBell(f,c,s=16) {
  const body=makeRect(Math.floor(s*.66),Math.floor(s*.58),c,1,0); body.topLeftRadius=Math.floor(s*.33); body.topRightRadius=Math.floor(s*.33); body.x=Math.floor(s*.17); body.y=Math.floor(s*.12); f.appendChild(body);
  const base=ln(Math.floor(s*.7),Math.floor(s*.12),c); base.x=Math.floor(s*.15); base.y=Math.floor(s*.7); f.appendChild(base);
  const cap=el(Math.floor(s*.26),Math.floor(s*.2),c); cap.x=Math.floor(s*.37); cap.y=Math.floor(s*.82); f.appendChild(cap);
}
function iSearch(f,c,s=16) {
  const o=elStroke(Math.floor(s*.6),Math.floor(s*.6),c,1.5); o.x=0; o.y=0; f.appendChild(o);
  const h=ln(1.5,Math.floor(s*.34),c); h.x=Math.floor(s*.63); h.y=Math.floor(s*.56); f.appendChild(h);
  const d=ln(Math.floor(s*.14),1.5,c); d.x=Math.floor(s*.55); d.y=Math.floor(s*.55); f.appendChild(d);
}
function iPlus(f,c,s=16) {
  const h=ln(Math.floor(s*.78),1.5,c); h.x=Math.floor(s*.11); h.y=Math.floor(s/2)-.75; f.appendChild(h);
  const v=ln(1.5,Math.floor(s*.78),c); v.x=Math.floor(s/2)-.75; v.y=Math.floor(s*.11); f.appendChild(v);
}
function iArrowRight(f,c,s=16) {
  const h=ln(Math.floor(s*.72),1.5,c); h.x=Math.floor(s*.08); h.y=Math.floor(s/2)-.75; f.appendChild(h);
  const u=ln(1.5,Math.floor(s*.32),c); u.x=Math.floor(s*.73); u.y=Math.floor(s*.2); f.appendChild(u);
  const d=ln(1.5,Math.floor(s*.32),c); d.x=Math.floor(s*.73); d.y=Math.floor(s*.49); f.appendChild(d);
}

function icn(name, parent, color, size=16) {
  const f = iconF(size);
  if      (name==="home")    iHome(f,color,size);
  else if (name==="users")   iUsers(f,color,size);
  else if (name==="calendar")iCalendar(f,color,size);
  else if (name==="chart")   iChart(f,color,size);
  else if (name==="coin")    iCoin(f,color,size);
  else if (name==="doc")     iDoc(f,color,size);
  else if (name==="gear")    iGear(f,color,size);
  else if (name==="bell")    iBell(f,color,size);
  else if (name==="search")  iSearch(f,color,size);
  else if (name==="plus")    iPlus(f,color,size);
  else if (name==="arrow")   iArrowRight(f,color,size);
  parent.appendChild(f);
  return f;
}

// ─── Sidebar (desktop) ────────────────────────────────────────────────────────

const NAV = [
  { icon:"home",     label:"Dashboard"  },
  { icon:"users",    label:"Students"   },
  { icon:"users",    label:"Teachers"   },
  { icon:"calendar", label:"Timetable"  },
  { icon:"chart",    label:"Attendance" },
  { icon:"coin",     label:"Fees"       },
  { icon:"doc",      label:"Exams"      },
];

function buildSidebarV2(screen, accent, activeIdx, role, userInitials, userName) {
  const bg = makeRect(240,900,C.navy,1,0); bg.x=0; bg.y=0; screen.appendChild(bg);

  // Logo
  const logoBg = makeRect(30,30,C.emerald,1,8); logoBg.x=20; logoBg.y=18; screen.appendChild(logoBg);
  const logoT = txt("S",13,"Bold",C.surface); logoT.x=27; logoT.y=22; screen.appendChild(logoT);
  const brandT = txt("ScholarSphere",12,"Semi Bold",C.surface); brandT.x=58; brandT.y=21; screen.appendChild(brandT);

  // Divider
  const d1=makeRect(200,1,C.surface,0.07); d1.x=20; d1.y=60; screen.appendChild(d1);

  // Menu label
  const menuL = txt("MAIN MENU",8,"Semi Bold",C.surface,0.28); menuL.x=20; menuL.y=72; screen.appendChild(menuL);

  NAV.forEach((item, i) => {
    const y = 90 + i*44;
    const active = i === activeIdx;

    if (active) {
      const activeBg = makeRect(216,36,C.surface,0.07,8); activeBg.x=12; activeBg.y=y+2; screen.appendChild(activeBg);
      const bar = makeRect(3,22,accent,1,1.5); bar.x=12; bar.y=y+9; screen.appendChild(bar);
    }

    const iColor = active ? accent : C.surface;
    const iF = iconF(16);
    if      (item.icon==="home")    iHome(iF,iColor,16);
    else if (item.icon==="users")   iUsers(iF,iColor,16);
    else if (item.icon==="calendar")iCalendar(iF,iColor,16);
    else if (item.icon==="chart")   iChart(iF,iColor,16);
    else if (item.icon==="coin")    iCoin(iF,iColor,16);
    else if (item.icon==="doc")     iDoc(iF,iColor,16);
    if (!active) iF.opacity = 0.4;
    iF.x=24; iF.y=y+10; screen.appendChild(iF);

    const lT = txt(item.label,12,active?"Semi Bold":"Regular",C.surface,active?1:0.4);
    lT.x=48; lT.y=y+11; screen.appendChild(lT);
  });

  // Settings
  const d2=makeRect(200,1,C.surface,0.07); d2.x=20; d2.y=90+NAV.length*44+4; screen.appendChild(d2);
  const sY=90+NAV.length*44+16;
  const sgF=iconF(16); iGear(sgF,C.surface,16); sgF.opacity=0.35; sgF.x=24; sgF.y=sY+10; screen.appendChild(sgF);
  const sgT=txt("Settings",12,"Regular",C.surface,0.35); sgT.x=48; sgT.y=sY+11; screen.appendChild(sgT);

  // User profile
  const d3=makeRect(200,1,C.surface,0.07); d3.x=20; d3.y=846; screen.appendChild(d3);
  const avBg=makeRect(30,30,accent,0.18,15); avBg.x=20; avBg.y=854; screen.appendChild(avBg);
  const avT=txt(userInitials,10,"Semi Bold",C.surface); avT.x=26; avT.y=862; screen.appendChild(avT);
  const unT=txt(userName,11,"Semi Bold",C.surface); unT.x=58; unT.y=856; screen.appendChild(unT);
  const urT=txt(role,9,"Regular",C.surface,0.38); urT.x=58; urT.y=870; screen.appendChild(urT);
}

// ─── Topbar (desktop) ─────────────────────────────────────────────────────────

function buildTopbarV2(screen, title, sub) {
  const tb=makeRect(1200,60,C.surface,1,0);
  tb.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:1},radius:3,spread:0,visible:true,blendMode:"NORMAL"}];
  tb.x=240; tb.y=0; screen.appendChild(tb);

  const titleT=txt(title,15,"Semi Bold",C.ink); titleT.x=264; titleT.y=16; screen.appendChild(titleT);
  if(sub){ const subT=txt(sub,10,"Regular",C.muted); subT.x=264; subT.y=34; screen.appendChild(subT); }

  // Search
  const sb=makeRect(200,32,C.shell,1,8); sb.strokes=[{type:"SOLID",color:C.line}]; sb.strokeWeight=1; sb.x=1076; sb.y=14; screen.appendChild(sb);
  const sF=iconF(13); iSearch(sF,C.muted,13); sF.x=1084; sF.y=24; screen.appendChild(sF);
  const sPh=txt("Search…",11,"Regular",C.muted); sPh.x=1102; sPh.y=22; screen.appendChild(sPh);

  // Bell
  const bBg=makeRect(32,32,C.shell,1,8); bBg.x=1284; bBg.y=14; screen.appendChild(bBg);
  const bF=iconF(15); iBell(bF,C.muted,15); bF.x=1292; bF.y=23; screen.appendChild(bF);
  const bDot=makeRect(6,6,C.rose,1,3); bDot.x=1305; bDot.y=12; screen.appendChild(bDot);

  // Avatar
  const avBg=makeRect(32,32,C.navy,1,16); avBg.x=1324; avBg.y=14; screen.appendChild(avBg);
  const avT=txt("JO",10,"Semi Bold",C.surface); avT.x=1331; avT.y=22; screen.appendChild(avT);
}

// ─── Phase 4: Screens ────────────────────────────────────────────────────────

async function buildScreens() {
  post("head","Phase 4 — Screens");
  await loadFonts();

  let page = figma.root.children.find(p => p.name === "Screens");
  if (!page) { page = figma.createPage(); page.name = "Screens"; }
  await figma.setCurrentPageAsync(page);
  page.children.forEach(c => c.remove());

  post("progress","Login — Desktop…",8);
  const loginD = buildLoginDesktop();
  loginD.x=0; loginD.y=0; page.appendChild(loginD);

  post("progress","Admin Dashboard — Desktop…",20);
  const adminDash = buildDashboardDesktop("Super Admin",[
    { label:"Total Students", value:"1,247", sub:"12% growth this term", color:C.purple },
    { label:"Active Staff",   value:"89",    sub:"3 currently on leave", color:C.navy   },
    { label:"Fee Collection", value:"GHS 42,500", sub:"68% of total target", color:C.emerald},
    { label:"Open Alerts",    value:"3",     sub:"Require your review",  color:C.rose   },
  ], C.purple, 0, "Super Admin");
  adminDash.x=1520; adminDash.y=0; page.appendChild(adminDash);

  post("progress","Teacher Dashboard — Desktop…",35);
  const teachDash = buildDashboardDesktop("Teacher",[
    { label:"My Subjects",     value:"4",   sub:"Maths, English, Science, ICT", color:C.emerald },
    { label:"Students",        value:"148", sub:"Across 4 classes",             color:C.navy    },
    { label:"Upcoming Exams",  value:"2",   sub:"Next exam: 14 Jan 2025",       color:C.amber   },
    { label:"Avg Class Grade", value:"B2",  sub:"78% pass rate this term",      color:C.sky     },
  ], C.emerald, 1, "Teacher");
  teachDash.x=3040; teachDash.y=0; page.appendChild(teachDash);

  post("progress","Student Portal — Desktop…",48);
  const studentD = buildStudentPortalDesktop();
  studentD.x=0; studentD.y=980; page.appendChild(studentD);

  post("progress","Students List — Desktop…",60);
  const studList = buildStudentsListDesktop();
  studList.x=1520; studList.y=980; page.appendChild(studList);

  post("progress","Login — Mobile…",72);
  const mLogin = buildMobileLogin();
  mLogin.x=0; mLogin.y=2060; page.appendChild(mLogin);

  post("progress","Dashboard — Mobile…",82);
  const mDash = buildMobileDash();
  mDash.x=415; mDash.y=2060; page.appendChild(mDash);

  post("progress","Student Portal — Mobile…",92);
  const mPortal = buildMobilePortal();
  mPortal.x=830; mPortal.y=2060; page.appendChild(mPortal);

  figma.viewport.scrollAndZoomIntoView(page.children);
  post("progress","Done!",100); post("done");
}

// ─── Desktop: Login ──────────────────────────────────────────────────────────

function buildLoginDesktop() {
  const s = makeFrame("Login — Desktop (1440×900)", 1440, 900);
  s.fills = solid(C.shell);

  // Left brand panel
  const left = makeRect(640, 900, C.navy, 1, 0); left.x=0; left.y=0; s.appendChild(left);
  // Decorative circles
  const dA = makeRect(360,360,C.emerald,0.05,180); dA.x=360; dA.y=540; s.appendChild(dA);
  const dB = makeRect(200,200,C.emerald,0.04,100); dB.x=-50; dB.y=680; s.appendChild(dB);
  const dC = makeRect(100,100,C.purple,0.1,50); dC.x=540; dC.y=60; s.appendChild(dC);

  // Logo
  const logoOrb = makeRect(48,48,C.emerald,1,12);
  logoOrb.effects=[{type:"DROP_SHADOW",color:rgba(16,185,129,0.35),offset:{x:0,y:8},radius:20,spread:0,visible:true,blendMode:"NORMAL"}];
  logoOrb.x=64; logoOrb.y=64; s.appendChild(logoOrb);
  const logoT = txt("S",20,"Bold",C.surface); logoT.x=74; logoT.y=71; s.appendChild(logoT);
  const logoName = txt("ScholarSphere",18,"Bold",C.surface); logoName.x=124; logoName.y=71; s.appendChild(logoName);
  const logoSub = txt("School Management Platform",10,"Regular",C.surface,0.4); logoSub.x=124; logoSub.y=93; s.appendChild(logoSub);

  // Hero copy
  const heroT = txt("Empowering\nAcademic Excellence",36,"Bold",C.surface);
  heroT.lineHeight={unit:"PIXELS",value:46}; heroT.x=64; heroT.y=280; s.appendChild(heroT);
  const heroSub = txt("A unified platform for Ghana's leading\nschools — attendance, fees, exams and more.",14,"Regular",C.surface,0.55);
  heroSub.lineHeight={unit:"PIXELS",value:22}; heroSub.x=64; heroSub.y=380; s.appendChild(heroSub);

  // Feature bullets (geometric dots, no emoji)
  const feats = ["Role-based access for all staff","Real-time attendance tracking","Integrated fee management","Academic reports & analytics"];
  feats.forEach((f, i) => {
    const dot = makeRect(5,5,C.emerald,1,2.5); dot.x=64; dot.y=460+i*26+3; s.appendChild(dot);
    const ft = txt(f,12,"Regular",C.surface,0.5); ft.x=80; ft.y=460+i*26; s.appendChild(ft);
  });

  // Form card
  const card = makeRect(400,540,C.surface,1,16);
  card.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.12),offset:{x:0,y:20},radius:48,spread:-8,visible:true,blendMode:"NORMAL"}];
  card.x=760; card.y=180; s.appendChild(card);

  const cardTitle = txt("Welcome back",24,"Bold",C.ink); cardTitle.x=800; cardTitle.y=216; s.appendChild(cardTitle);
  const cardSub = txt("Sign in to your account",12,"Regular",C.muted); cardSub.x=800; cardSub.y=248; s.appendChild(cardSub);

  // Role selector tabs
  const roles=[{l:"Admin",x:800},{l:"Teacher",x:880},{l:"Student",x:972}];
  const tabBar=makeRect(320,36,C.shell,1,8); tabBar.strokes=[{type:"SOLID",color:C.line}]; tabBar.strokeWeight=1;
  tabBar.x=800; tabBar.y=276; s.appendChild(tabBar);
  roles.forEach((r,i) => {
    if(i===0){const tab=makeRect(70,28,C.surface,1,6);tab.x=804;tab.y=280;s.appendChild(tab);}
    const rt=txt(r.l,10,i===0?"Semi Bold":"Regular",i===0?C.ink:C.muted); rt.x=r.x+6; rt.y=288; s.appendChild(rt);
  });

  // Email field
  const eLbl=txt("Email address",10,"Semi Bold",C.ink); eLbl.x=800; eLbl.y=328; s.appendChild(eLbl);
  const eF=makeRect(320,42,C.shell,1,8); eF.strokes=[{type:"SOLID",color:C.line}]; eF.strokeWeight=1; eF.x=800; eF.y=344; s.appendChild(eF);
  const ePh=txt("admin@schoolname.edu.gh",12,"Regular",C.muted); ePh.x=816; ePh.y=356; s.appendChild(ePh);

  // Password field
  const pLbl=txt("Password",10,"Semi Bold",C.ink); pLbl.x=800; pLbl.y=400; s.appendChild(pLbl);
  const pF=makeRect(320,42,C.shell,1,8); pF.strokes=[{type:"SOLID",color:C.line}]; pF.strokeWeight=1; pF.x=800; pF.y=416; s.appendChild(pF);
  const pPh=txt("Enter your password",12,"Regular",C.muted); pPh.x=816; pPh.y=428; s.appendChild(pPh);
  const eyeF=iconF(14); iSearch(eyeF,C.muted,14); eyeF.x=1090; eyeF.y=423; s.appendChild(eyeF);

  const fgT=txt("Forgot password?",10,"Regular",C.emerald); fgT.x=916; fgT.y=468; s.appendChild(fgT);

  // Sign in button
  const signBtn=makeRect(320,44,C.navy,1,8);
  signBtn.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.15),offset:{x:0,y:4},radius:12,spread:0,visible:true,blendMode:"NORMAL"}];
  signBtn.x=800; signBtn.y=488; s.appendChild(signBtn);
  const signT=txt("Sign In",13,"Semi Bold",C.surface); signT.x=930; signT.y=499; s.appendChild(signT);

  // Divider
  const divL=makeRect(130,1,C.line); divL.x=800; divL.y=548; s.appendChild(divL);
  const divR=makeRect(130,1,C.line); divR.x=990; divR.y=548; s.appendChild(divR);
  const divT=txt("or",10,"Regular",C.muted); divT.x=959; divT.y=540; s.appendChild(divT);

  // Google SSO
  const gBtn=makeRect(320,42,C.surface,1,8); gBtn.strokes=[{type:"SOLID",color:C.line}]; gBtn.strokeWeight=1; gBtn.x=800; gBtn.y=560; s.appendChild(gBtn);
  const gL=makeRect(16,16,C.rose,0.15,8); gL.x=822; gL.y=573; s.appendChild(gL);
  const gT2=txt("Continue with Google",11,"Semi Bold",C.ink); gT2.x=848; gT2.y=573; s.appendChild(gT2);

  const helpT=txt("Don't have an account? Contact your school administrator.",10,"Regular",C.muted); helpT.x=800; helpT.y=620; s.appendChild(helpT);

  return s;
}

// ─── Desktop: Dashboard ──────────────────────────────────────────────────────

function buildDashboardDesktop(role, stats, accent, activeIdx, userRole) {
  const s = makeFrame(`${role} Dashboard — Desktop (1440×900)`, 1440, 900);
  s.fills = solid(C.shell);

  buildSidebarV2(s, accent, activeIdx||0, userRole||role, "JO", "John Owusu");
  buildTopbarV2(s, "Dashboard", `Good morning, John · Wednesday, 8 January 2025`);

  // KPI cards
  const CARD_W=256, CARD_H=108, GAP=20;
  stats.forEach((st,i) => {
    const cx=264+i*(CARD_W+GAP);
    const card=makeRect(CARD_W,CARD_H,C.surface,1,10);
    card.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.05),offset:{x:0,y:2},radius:8,spread:-1,visible:true,blendMode:"NORMAL"}];
    card.x=cx; card.y=80; s.appendChild(card);

    const accentBar=makeRect(4,52,st.color,1,2); accentBar.x=cx+16; accentBar.y=106; s.appendChild(accentBar);
    const lbl=txt(st.label,9,"Semi Bold",C.muted); lbl.x=cx+32; lbl.y=96; s.appendChild(lbl);
    const val=txt(st.value,22,"Bold",C.ink); val.x=cx+32; val.y=112; s.appendChild(val);
    const sub=txt(st.sub,9,"Regular",C.muted); sub.x=cx+32; sub.y=152; s.appendChild(sub);

    const iF=iconF(14); const iconFns={purple:()=>iHome(iF,st.color,14),navy:()=>iUsers(iF,st.color,14),emerald:()=>iCoin(iF,st.color,14),rose:()=>iBell(iF,st.color,14)};
    Object.values(iconFns)[i%4]();
    iF.x=cx+CARD_W-30; iF.y=92; iF.opacity=0.5; s.appendChild(iF);
  });

  // Main content area: activity table + quick actions
  const tableCard=makeRect(796,400,C.surface,1,10);
  tableCard.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:2},radius:8,spread:-1,visible:true,blendMode:"NORMAL"}];
  tableCard.x=264; tableCard.y=216; s.appendChild(tableCard);

  const tHdr=makeRect(796,44,C.shell,1,0); tHdr.topLeftRadius=10; tHdr.topRightRadius=10; tHdr.x=264; tHdr.y=216; s.appendChild(tHdr);
  const tTitle=txt("Recent Activity",13,"Semi Bold",C.ink); tTitle.x=284; tTitle.y=232; s.appendChild(tTitle);
  const tAll=txt("View all",10,"Regular",C.emerald); tAll.x=1016; tAll.y=234; s.appendChild(tAll);
  const arF=iconF(10); iArrowRight(arF,C.emerald,10); arF.x=1054; arF.y=234; s.appendChild(arF);
  const tDivider=makeRect(796,1,C.line); tDivider.x=264; tDivider.y=260; s.appendChild(tDivider);

  const tColLabels=["STUDENT","ACTION","MODULE","TIME"];
  const tColX=[284,484,660,820];
  tColLabels.forEach((c,i)=>{
    const h=txt(c,8,"Semi Bold",C.muted); h.x=tColX[i]; h.y=272; s.appendChild(h);
  });
  const tHdrDiv=makeRect(796,1,C.line); tHdrDiv.x=264; tHdrDiv.y=288; s.appendChild(tHdrDiv);

  const rows=[
    ["Kofi Asante","Marked attendance","Attendance","9:05 AM"],
    ["Ama Boateng","Fee payment received","Finance","8:52 AM"],
    ["Kwame Mensah","Exam result uploaded","Exams","8:40 AM"],
    ["Abena Asare","Account login","Auth","8:31 AM"],
    ["Yaw Darko","Profile updated","Students","8:15 AM"],
    ["Efua Sarpong","Leave request","HR","7:58 AM"],
  ];
  rows.forEach((r,i)=>{
    const ry=296+i*50;
    if(i%2===1){const bg=makeRect(796,50,C.shell); bg.x=264; bg.y=ry; s.appendChild(bg);}
    const av=makeRect(28,28,accent,0.1,14); av.x=284; av.y=ry+11; s.appendChild(av);
    const avI=txt(r[0].split(" ").map(w=>w[0]).join(""),9,"Semi Bold",accent); avI.x=289; avI.y=ry+19; s.appendChild(avI);
    const nm=txt(r[0],11,"Semi Bold",C.ink); nm.x=320; nm.y=ry+18; s.appendChild(nm);
    const ac=txt(r[1],11,"Regular",C.muted); ac.x=484; ac.y=ry+18; s.appendChild(ac);
    const mBg=makeRect(70,20,C.shell,1,10); mBg.x=660; mBg.y=ry+15; s.appendChild(mBg);
    const mc=txt(r[2],9,"Semi Bold",C.muted); mc.x=669; mc.y=ry+19; s.appendChild(mc);
    const tc=txt(r[3],10,"Regular",C.muted); tc.x=820; tc.y=ry+18; s.appendChild(tc);
    const rd=makeRect(796,1,C.line); rd.x=264; rd.y=ry+49; s.appendChild(rd);
  });

  // Quick actions
  const qa=makeRect(300,400,C.surface,1,10);
  qa.effects=tableCard.effects; qa.x=1076; qa.y=216; s.appendChild(qa);
  const qaHdr=makeRect(300,44,C.shell,1,0); qaHdr.topLeftRadius=10; qaHdr.topRightRadius=10; qaHdr.x=1076; qaHdr.y=216; s.appendChild(qaHdr);
  const qaTitle=txt("Quick Actions",13,"Semi Bold",C.ink); qaTitle.x=1096; qaTitle.y=232; s.appendChild(qaTitle);
  const qaDivider=makeRect(300,1,C.line); qaDivider.x=1076; qaDivider.y=260; s.appendChild(qaDivider);

  const qaItems=[
    {label:"Add New Student",  icon:"plus",  color:C.navy   },
    {label:"Record Attendance",icon:"chart",  color:C.emerald},
    {label:"Generate Report",  icon:"doc",   color:C.purple },
    {label:"Send Broadcast",   icon:"bell",  color:C.amber  },
    {label:"Manage Fees",      icon:"coin",  color:C.rose   },
  ];
  qaItems.forEach((q,i)=>{
    const btn=makeRect(260,40,q.color,0.07,8); btn.x=1096; btn.y=276+i*52; s.appendChild(btn);
    const dotBg=makeRect(24,24,q.color,0.12,6); dotBg.x=1104; dotBg.y=284+i*52; s.appendChild(dotBg);
    const qiF=iconF(12);
    if(q.icon==="plus")iPlus(qiF,q.color,12);
    else if(q.icon==="chart")iChart(qiF,q.color,12);
    else if(q.icon==="doc")iDoc(qiF,q.color,12);
    else if(q.icon==="bell")iBell(qiF,q.color,12);
    else if(q.icon==="coin")iCoin(qiF,q.color,12);
    qiF.x=1110; qiF.y=290+i*52; s.appendChild(qiF);
    const ql=txt(q.label,11,"Semi Bold",q.color); ql.x=1136; ql.y=287+i*52; s.appendChild(ql);
    const qaF=iconF(10); iArrowRight(qaF,q.color,10); qaF.x=1320; qaF.y=290+i*52; qaF.opacity=0.5; s.appendChild(qaF);
  });

  return s;
}

// ─── Desktop: Student Portal ─────────────────────────────────────────────────

function buildStudentPortalDesktop() {
  const s = makeFrame("Student Portal — Desktop (1440×900)", 1440, 900);
  s.fills = solid(C.shell);

  buildSidebarV2(s, C.sky, 0, "Student", "KA", "Kofi Asante");
  buildTopbarV2(s, "My Portal", "Academic Year 2024–2025 · Term 1");

  // Welcome banner
  const banner=makeRect(1128,80,C.navy,1,12);
  banner.x=264; banner.y=80; s.appendChild(banner);
  const bAccent=makeRect(4,80,C.sky,1,0); bAccent.topLeftRadius=12; bAccent.x=264; bAccent.y=80; s.appendChild(bAccent);
  const bTitle=txt("Welcome back, Kofi Asante",18,"Bold",C.surface); bTitle.x=296; bTitle.y=94; s.appendChild(bTitle);
  const bSub=txt("Grade 10B  ·  ID: STU-2024-001  ·  Attendance: 94% this term",11,"Regular",C.surface,0.55); bSub.x=296; bSub.y=120; s.appendChild(bSub);
  const bBadge=makeRect(172,24,C.sky,0.15,12); bBadge.x=1156; bBadge.y=96; s.appendChild(bBadge);
  const bBT=txt("Term 2 timetable available",9,"Semi Bold",C.sky); bBT.x=1165; bBT.y=102; s.appendChild(bBT);

  // Grade cards (4 subjects)
  const subs=[
    {name:"Mathematics",grade:"A1",score:"91/100",color:C.emerald},
    {name:"English Language",grade:"B2",score:"78/100",color:C.sky},
    {name:"Integrated Science",grade:"A2",score:"87/100",color:C.purple},
    {name:"Social Studies",grade:"B1",score:"82/100",color:C.amber},
  ];
  subs.forEach((su,i)=>{
    const cx=264+i*280;
    const card=makeRect(260,120,C.surface,1,10);
    card.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:2},radius:8,spread:-1,visible:true,blendMode:"NORMAL"}];
    card.x=cx; card.y=184; s.appendChild(card);
    const cBar=makeRect(260,4,su.color,1,0); cBar.topLeftRadius=10; cBar.topRightRadius=10; cBar.x=cx; cBar.y=184; s.appendChild(cBar);
    const sName=txt(su.name,10,"Semi Bold",C.muted); sName.x=cx+16; sName.y=202; s.appendChild(sName);
    const grd=txt(su.grade,28,"Bold",su.color); grd.x=cx+16; grd.y=218; s.appendChild(grd);
    const scr=txt(su.score,10,"Regular",C.muted); scr.x=cx+16; scr.y=262; s.appendChild(scr);
    const tF=iconF(20); iDoc(tF,su.color,20); tF.x=cx+228; tF.y=192; tF.opacity=0.35; s.appendChild(tF);
  });

  // Attendance card
  const attCard=makeRect(520,264,C.surface,1,10);
  attCard.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:2},radius:8,spread:-1,visible:true,blendMode:"NORMAL"}];
  attCard.x=264; attCard.y=328; s.appendChild(attCard);
  const atHdr=makeRect(520,44,C.shell,1,0); atHdr.topLeftRadius=10; atHdr.topRightRadius=10; atHdr.x=264; atHdr.y=328; s.appendChild(atHdr);
  const atTitle=txt("Attendance Summary",12,"Semi Bold",C.ink); atTitle.x=284; atTitle.y=344; s.appendChild(atTitle);
  const atD=makeRect(520,1,C.line); atD.x=264; atD.y=372; s.appendChild(atD);

  const atPct=txt("94%",36,"Bold",C.emerald); atPct.x=284; atPct.y=388; s.appendChild(atPct);
  const atSub=txt("Present this term",11,"Regular",C.muted); atSub.x=284; atSub.y=436; s.appendChild(atSub);
  const atBars=[94,88,97,76,91,84,95];
  const barW=36, barGap=12, barStartX=430;
  atBars.forEach((v,i)=>{
    const bH=Math.round(v*1.4);
    const bg=makeRect(barW,100,C.shell,1,4); bg.x=barStartX+i*(barW+barGap); bg.y=450-100+28; s.appendChild(bg);
    const b=makeRect(barW,bH,C.emerald,0.5+(v/200),4); b.x=barStartX+i*(barW+barGap); b.y=478-bH; s.appendChild(b);
    const wl=txt(`W${i+1}`,8,"Regular",C.muted); wl.x=barStartX+i*(barW+barGap)+8; wl.y=484; s.appendChild(wl);
  });

  // Fee balance card
  const feeCard=makeRect(340,264,C.surface,1,10);
  feeCard.effects=attCard.effects; feeCard.x=808; feeCard.y=328; s.appendChild(feeCard);
  const fHdr=makeRect(340,44,C.shell,1,0); fHdr.topLeftRadius=10; fHdr.topRightRadius=10; fHdr.x=808; fHdr.y=328; s.appendChild(fHdr);
  const fTitle=txt("Fee Balance",12,"Semi Bold",C.ink); fTitle.x=828; fTitle.y=344; s.appendChild(fTitle);
  const fD=makeRect(340,1,C.line); fD.x=808; fD.y=372; s.appendChild(fD);
  const fAmt=txt("GHS 850.00",28,"Bold",C.rose); fAmt.x=828; fAmt.y=390; s.appendChild(fAmt);
  const fStat=txt("Outstanding",10,"Semi Bold",C.rose); fStat.x=828; fStat.y=432; s.appendChild(fStat);
  const fDue=txt("Due: 15 January 2025",10,"Regular",C.muted); fDue.x=828; fDue.y=450; s.appendChild(fDue);
  const payBtn=makeRect(160,38,C.emerald,1,8);
  payBtn.effects=[{type:"DROP_SHADOW",color:rgba(16,185,129,0.2),offset:{x:0,y:4},radius:10,spread:0,visible:true,blendMode:"NORMAL"}];
  payBtn.x=828; payBtn.y=500; s.appendChild(payBtn);
  const payT=txt("Pay Now",11,"Semi Bold",C.surface); payT.x=882; payT.y=511; s.appendChild(payT);

  // Timetable next class card
  const ttCard=makeRect(340,264,C.surface,1,10);
  ttCard.effects=attCard.effects; ttCard.x=1172; ttCard.y=328; s.appendChild(ttCard);
  const ttHdr=makeRect(340,44,C.shell,1,0); ttHdr.topLeftRadius=10; ttHdr.topRightRadius=10; ttHdr.x=1172; ttHdr.y=328; s.appendChild(ttHdr);
  const ttTitle=txt("Next Class",12,"Semi Bold",C.ink); ttTitle.x=1192; ttTitle.y=344; s.appendChild(ttTitle);
  const ttD=makeRect(340,1,C.line); ttD.x=1172; ttD.y=372; s.appendChild(ttD);
  const ttTime=txt("10:00 AM",22,"Bold",C.navy); ttTime.x=1192; ttTime.y=390; s.appendChild(ttTime);
  const ttSub=txt("Mathematics",14,"Semi Bold",C.ink); ttSub.x=1192; ttSub.y=424; s.appendChild(ttSub);
  const ttRoom=txt("Room 2A  ·  Mr. Asante-Mensah",10,"Regular",C.muted); ttRoom.x=1192; ttRoom.y=444; s.appendChild(ttRoom);
  const ttBadge=makeRect(80,22,C.emeraldBg,1,11); ttBadge.x=1192; ttBadge.y=466; s.appendChild(ttBadge);
  const ttBT=txt("In 18 mins",9,"Semi Bold",C.emeraldDk); ttBT.x=1201; ttBT.y=471; s.appendChild(ttBT);

  return s;
}

// ─── Desktop: Students List ───────────────────────────────────────────────────

function buildStudentsListDesktop() {
  const s = makeFrame("Students — List View (1440×900)", 1440, 900);
  s.fills = solid(C.shell);

  buildSidebarV2(s, C.purple, 1, "Super Admin", "JO", "John Owusu");
  buildTopbarV2(s, "Students", "Manage student enrollments, records and academic profiles");

  // Toolbar
  const toolbar=makeRect(1128,52,C.surface,1,10);
  toolbar.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.03),offset:{x:0,y:1},radius:4,spread:0,visible:true,blendMode:"NORMAL"}];
  toolbar.x=264; toolbar.y=80; s.appendChild(toolbar);

  // Search box
  const srch=makeRect(280,34,C.shell,1,8); srch.strokes=[{type:"SOLID",color:C.line}]; srch.strokeWeight=1; srch.x=280; srch.y=89; s.appendChild(srch);
  const srchF=iconF(13); iSearch(srchF,C.muted,13); srchF.x=292; srchF.y=97; s.appendChild(srchF);
  const srchPh=txt("Search students…",11,"Regular",C.muted); srchPh.x=312; srchPh.y=99; s.appendChild(srchPh);

  // Filter chips
  const chips=["All Classes","All Statuses","Active only"];
  chips.forEach((c,i)=>{
    const chip=makeRect(100,30,C.shell,1,20); chip.strokes=[{type:"SOLID",color:C.line}]; chip.strokeWeight=1; chip.x=576+i*116; chip.y=93; s.appendChild(chip);
    const chT=txt(c,9,"Regular",C.muted); chT.x=596+i*116; chT.y=100; s.appendChild(chT);
  });

  // Add student button
  const addBtn=makeRect(136,34,C.purple,1,8);
  addBtn.effects=[{type:"DROP_SHADOW",color:rgba(124,58,237,0.15),offset:{x:0,y:3},radius:8,spread:0,visible:true,blendMode:"NORMAL"}];
  addBtn.x=1240; addBtn.y=89; s.appendChild(addBtn);
  const addF=iconF(12); iPlus(addF,C.surface,12); addF.x=1252; addF.y=96; s.appendChild(addF);
  const addT=txt("Add Student",10,"Semi Bold",C.surface); addT.x=1270; addT.y=99; s.appendChild(addT);

  // Table card
  const tbl=makeRect(1128,720,C.surface,1,10);
  tbl.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:2},radius:8,spread:-1,visible:true,blendMode:"NORMAL"}];
  tbl.x=264; tbl.y=148; s.appendChild(tbl);

  // Table header
  const tblHdr=makeRect(1128,44,C.shell,1,0); tblHdr.topLeftRadius=10; tblHdr.topRightRadius=10; tblHdr.x=264; tblHdr.y=148; s.appendChild(tblHdr);
  const cols=[{l:"STUDENT",x:284,w:240},{l:"CLASS",x:544,w:80},{l:"STATUS",x:648,w:100},{l:"ATTENDANCE",x:772,w:100},{l:"FEE STATUS",x:900,w:110},{l:"ENROLLED",x:1040,w:110},{l:"ACTIONS",x:1172,w:80}];
  cols.forEach(c=>{const h=txt(c.l,8,"Semi Bold",C.muted); h.x=c.x; h.y=163; s.appendChild(h);});
  const tblHdrDiv=makeRect(1128,1,C.line); tblHdrDiv.x=264; tblHdrDiv.y=192; s.appendChild(tblHdrDiv);

  const students=[
    {name:"Kofi Asante",id:"STU-001",cls:"10B",status:"Active",att:"94%",fee:"Paid",enrolled:"12 Sep 2024"},
    {name:"Ama Boateng",id:"STU-002",cls:"10A",status:"Active",att:"88%",fee:"Pending",enrolled:"12 Sep 2024"},
    {name:"Kwame Mensah",id:"STU-003",cls:"11C",status:"Inactive",att:"62%",fee:"Overdue",enrolled:"01 Jan 2024"},
    {name:"Abena Asare",id:"STU-004",cls:"10B",status:"Active",att:"97%",fee:"Paid",enrolled:"12 Sep 2024"},
    {name:"Yaw Darko",id:"STU-005",cls:"12A",status:"Active",att:"81%",fee:"Pending",enrolled:"01 Sep 2023"},
    {name:"Efua Sarpong",id:"STU-006",cls:"11B",status:"Active",att:"91%",fee:"Paid",enrolled:"12 Sep 2024"},
    {name:"Nana Agyei",id:"STU-007",cls:"9A",status:"Active",att:"86%",fee:"Paid",enrolled:"15 Sep 2024"},
    {name:"Adwoa Frempong",id:"STU-008",cls:"12B",status:"Active",att:"79%",fee:"Overdue",enrolled:"01 Sep 2022"},
    {name:"Kofi Boateng",id:"STU-009",cls:"10A",status:"Active",att:"92%",fee:"Paid",enrolled:"12 Sep 2024"},
    {name:"Esi Asante",id:"STU-010",cls:"11A",status:"Inactive",att:"55%",fee:"Overdue",enrolled:"12 Sep 2023"},
    {name:"Kweku Mensah",id:"STU-011",cls:"9B",status:"Active",att:"89%",fee:"Paid",enrolled:"15 Sep 2024"},
    {name:"Akua Darko",id:"STU-012",cls:"12A",status:"Active",att:"95%",fee:"Paid",enrolled:"01 Sep 2022"},
  ];
  const feeC={Paid:C.emerald,Pending:C.amber,Overdue:C.rose};
  const feeBg={Paid:C.emeraldBg,Pending:C.amberBg,Overdue:C.roseBg};
  const statC={Active:C.emeraldDk,Inactive:C.muted};
  const statBg={Active:C.emeraldBg,Inactive:C.shell};
  const ROW_H=48;

  students.forEach((st,i)=>{
    const ry=196+i*ROW_H;
    if(i%2===1){const bg=makeRect(1128,ROW_H,C.shell); bg.x=264; bg.y=ry; s.appendChild(bg);}
    if(i===1){const hl=makeRect(1128,ROW_H,C.purple,0.04); hl.x=264; hl.y=ry; s.appendChild(hl);}

    // Avatar
    const av=makeRect(28,28,C.purple,0.1,14); av.x=284; av.y=ry+10; s.appendChild(av);
    const avI=txt(st.name.split(" ").map(w=>w[0]).join(""),8,"Semi Bold",C.purple); avI.x=289; avI.y=ry+18; s.appendChild(avI);
    const nm=txt(st.name,11,"Semi Bold",C.ink); nm.x=322; nm.y=ry+10; s.appendChild(nm);
    const sid=txt(st.id,9,"Regular",C.muted); sid.x=322; sid.y=ry+26; s.appendChild(sid);

    const cls=txt(st.cls,11,"Regular",C.ink); cls.x=544; cls.y=ry+17; s.appendChild(cls);

    const sBg=makeRect(64,20,statBg[st.status],1,10); sBg.x=648; sBg.y=ry+14; s.appendChild(sBg);
    const sT=txt(st.status,8,"Semi Bold",statC[st.status]); sT.x=657; sT.y=ry+19; s.appendChild(sT);

    const attT=txt(st.att,11,"Regular",C.ink); attT.x=772; attT.y=ry+17; s.appendChild(attT);

    const fBg=makeRect(70,20,feeBg[st.fee],1,10); fBg.x=900; fBg.y=ry+14; s.appendChild(fBg);
    const fT=txt(st.fee,8,"Semi Bold",feeC[st.fee]); fT.x=909; fT.y=ry+19; s.appendChild(fT);

    const enT=txt(st.enrolled,10,"Regular",C.muted); enT.x=1040; enT.y=ry+17; s.appendChild(enT);

    const eBtn=makeRect(48,26,C.shell,1,6); eBtn.strokes=[{type:"SOLID",color:C.line}]; eBtn.strokeWeight=1; eBtn.x=1172; eBtn.y=ry+11; s.appendChild(eBtn);
    const eBT=txt("Edit",9,"Semi Bold",C.muted); eBT.x=1182; eBT.y=ry+17; s.appendChild(eBT);

    const rd=makeRect(1128,1,C.line); rd.x=264; rd.y=ry+ROW_H-1; s.appendChild(rd);
  });

  // Pagination footer
  const pgFtr=makeRect(1128,44,C.shell,1,0); pgFtr.bottomLeftRadius=10; pgFtr.bottomRightRadius=10; pgFtr.x=264; pgFtr.y=820; s.appendChild(pgFtr);
  const pgInfo=txt("Showing 1–12 of 1,247 students",10,"Regular",C.muted); pgInfo.x=284; pgInfo.y=833; s.appendChild(pgInfo);
  const pgPrev=makeRect(68,28,C.surface,1,6); pgPrev.strokes=[{type:"SOLID",color:C.line}]; pgPrev.strokeWeight=1; pgPrev.x=1252; pgPrev.y=826; s.appendChild(pgPrev);
  const pgPT=txt("Prev",9,"Semi Bold",C.muted); pgPT.x=1268; pgPT.y=832; s.appendChild(pgPT);
  const pgNext=makeRect(68,28,C.purple,1,6); pgNext.x=1328; pgNext.y=826; s.appendChild(pgNext);
  const pgNT=txt("Next",9,"Semi Bold",C.surface); pgNT.x=1344; pgNT.y=832; s.appendChild(pgNT);

  return s;
}

// ─── Mobile helpers ───────────────────────────────────────────────────────────

function mobileStatusBar(s) {
  const sb=makeRect(375,44,C.navy,1,0); sb.x=0; sb.y=0; s.appendChild(sb);
  const time=txt("9:41",12,"Semi Bold",C.surface); time.x=16; time.y=15; s.appendChild(time);
  const sigBars=[10,14,18].map((h,i)=>{const r=makeRect(3,h,C.surface,1,1);r.x=330+i*5;r.y=44-h-8;s.appendChild(r);return r;});
}

function mobileBottomNav(s, items, activeIdx) {
  const nav=makeRect(375,72,C.surface,1,0);
  nav.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.1),offset:{x:0,y:-1},radius:8,spread:0,visible:true,blendMode:"NORMAL"}];
  nav.x=0; nav.y=740; s.appendChild(nav);
  const navDiv=makeRect(375,1,C.line); navDiv.x=0; navDiv.y=740; s.appendChild(navDiv);

  const itemW=375/items.length;
  items.forEach((n,i)=>{
    const active=i===activeIdx;
    const cx=Math.floor(i*itemW+itemW/2);
    const iF=iconF(18);
    if(n.icon==="home")iHome(iF,active?C.emerald:C.muted,18);
    else if(n.icon==="users")iUsers(iF,active?C.emerald:C.muted,18);
    else if(n.icon==="calendar")iCalendar(iF,active?C.emerald:C.muted,18);
    else if(n.icon==="coin")iCoin(iF,active?C.emerald:C.muted,18);
    else if(n.icon==="gear")iGear(iF,active?C.emerald:C.muted,18);
    else if(n.icon==="chart")iChart(iF,active?C.emerald:C.muted,18);
    else if(n.icon==="doc")iDoc(iF,active?C.emerald:C.muted,18);
    iF.x=cx-9; iF.y=750; s.appendChild(iF);
    const lT=txt(n.label,8,active?"Semi Bold":"Regular",active?C.emerald:C.muted);
    lT.x=cx-Math.floor(n.label.length*2.4); lT.y=772; s.appendChild(lT);
    if(active){const dot=makeRect(4,4,C.emerald,1,2);dot.x=cx-2;dot.y=800;s.appendChild(dot);}
  });
}

// ─── Mobile: Login ────────────────────────────────────────────────────────────

function buildMobileLogin() {
  const s = makeFrame("Login — Mobile (375×812)", 375, 812);
  s.fills = solid(C.navy);

  // Background decoration
  const dA=makeRect(280,280,C.emerald,0.05,140); dA.x=140; dA.y=520; s.appendChild(dA);
  const dB=makeRect(160,160,C.purple,0.07,80); dB.x=-40; dB.y=640; s.appendChild(dB);

  mobileStatusBar(s);

  // Logo area
  const logoOrb=makeRect(44,44,C.emerald,1,11);
  logoOrb.effects=[{type:"DROP_SHADOW",color:rgba(16,185,129,0.35),offset:{x:0,y:6},radius:16,spread:0,visible:true,blendMode:"NORMAL"}];
  logoOrb.x=40; logoOrb.y=80; s.appendChild(logoOrb);
  const logoI=txt("S",18,"Bold",C.surface); logoI.x=49; logoI.y=87; s.appendChild(logoI);
  const logoN=txt("ScholarSphere",15,"Bold",C.surface); logoN.x=96; logoN.y=87; s.appendChild(logoN);
  const logoS=txt("School Management Platform",8,"Regular",C.surface,0.4); logoS.x=96; logoS.y=107; s.appendChild(logoS);

  const heroT=txt("Sign in to\nyour account",28,"Bold",C.surface);
  heroT.lineHeight={unit:"PIXELS",value:36}; heroT.x=40; heroT.y=168; s.appendChild(heroT);
  const heroS=txt("Enter your credentials to continue",11,"Regular",C.surface,0.5); heroS.x=40; heroS.y=242; s.appendChild(heroS);

  // Form card
  const card=makeRect(343,368,C.surface,1,20);
  card.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.18),offset:{x:0,y:16},radius:40,spread:-4,visible:true,blendMode:"NORMAL"}];
  card.x=16; card.y=272; s.appendChild(card);

  const eLbl=txt("Email address",10,"Semi Bold",C.ink); eLbl.x=36; eLbl.y=292; s.appendChild(eLbl);
  const eF=makeRect(299,42,C.shell,1,8); eF.strokes=[{type:"SOLID",color:C.line}]; eF.strokeWeight=1; eF.x=36; eF.y=308; s.appendChild(eF);
  const ePh=txt("admin@school.edu.gh",11,"Regular",C.muted); ePh.x=52; ePh.y=320; s.appendChild(ePh);

  const pLbl=txt("Password",10,"Semi Bold",C.ink); pLbl.x=36; pLbl.y=364; s.appendChild(pLbl);
  const pF=makeRect(299,42,C.shell,1,8); pF.strokes=[{type:"SOLID",color:C.line}]; pF.strokeWeight=1; pF.x=36; pF.y=380; s.appendChild(pF);
  const pPh=txt("Enter your password",11,"Regular",C.muted); pPh.x=52; pPh.y=392; s.appendChild(pPh);
  const eyF=iconF(13); iSearch(eyF,C.muted,13); eyF.x=311; eyF.y=387; s.appendChild(eyF);

  const fgT=txt("Forgot password?",10,"Regular",C.emerald); fgT.x=222; fgT.y=432; s.appendChild(fgT);

  const loginBtn=makeRect(299,46,C.navy,1,10);
  loginBtn.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.12),offset:{x:0,y:4},radius:12,spread:0,visible:true,blendMode:"NORMAL"}];
  loginBtn.x=36; loginBtn.y=452; s.appendChild(loginBtn);
  const loginT=txt("Sign In",13,"Semi Bold",C.surface); loginT.x=148; loginT.y=464; s.appendChild(loginT);

  const divL=makeRect(118,1,C.line); divL.x=36; divL.y=512; s.appendChild(divL);
  const divR=makeRect(118,1,C.line); divR.x=217; divR.y=512; s.appendChild(divR);
  const divT=txt("or",9,"Regular",C.muted); divT.x=176; divT.y=504; s.appendChild(divT);

  const gBtn=makeRect(299,42,C.surface,1,10); gBtn.strokes=[{type:"SOLID",color:C.line}]; gBtn.strokeWeight=1; gBtn.x=36; gBtn.y=524; s.appendChild(gBtn);
  const gDot=makeRect(14,14,C.rose,0.15,7); gDot.x=54; gDot.y=533; s.appendChild(gDot);
  const gT=txt("Continue with Google",11,"Semi Bold",C.ink); gT.x=76; gT.y=535; s.appendChild(gT);

  return s;
}

// ─── Mobile: Dashboard ───────────────────────────────────────────────────────

function buildMobileDash() {
  const s = makeFrame("Dashboard — Mobile (375×812)", 375, 812);
  s.fills = solid(C.shell);

  mobileStatusBar(s);

  // Header bar
  const hdr=makeRect(375,64,C.navy,1,0); hdr.x=0; hdr.y=44; s.appendChild(hdr);
  const hTitle=txt("Dashboard",16,"Bold",C.surface); hTitle.x=20; hTitle.y=58; s.appendChild(hTitle);
  const hGreet=txt("Good morning, John",10,"Regular",C.surface,0.5); hGreet.x=20; hGreet.y=80; s.appendChild(hGreet);
  const bellBg=makeRect(32,32,C.surface,0.1,8); bellBg.x=330; bellBg.y=54; s.appendChild(bellBg);
  const bellF=iconF(16); iBell(bellF,C.surface,16); bellF.x=338; bellF.y=62; s.appendChild(bellF);
  const bellDot=makeRect(6,6,C.rose,1,3); bellDot.x=352; bellDot.y=52; s.appendChild(bellDot);

  // KPI grid
  const kpis=[
    {label:"Students",value:"1,247",color:C.purple,icon:"users"},
    {label:"Staff",value:"89",color:C.navy,icon:"users"},
    {label:"Fees Due",value:"42.5K",color:C.rose,icon:"coin"},
    {label:"Attendance",value:"94%",color:C.emerald,icon:"chart"},
  ];
  kpis.forEach((k,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const cx=12+col*183, cy=120+row*96;
    const card=makeRect(171,84,C.surface,1,10);
    card.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.05),offset:{x:0,y:2},radius:6,spread:0,visible:true,blendMode:"NORMAL"}];
    card.x=cx; card.y=cy; s.appendChild(card);
    const bar=makeRect(4,40,k.color,1,2); bar.x=cx+12; bar.y=cy+22; s.appendChild(bar);
    const lbl=txt(k.label,8,"Semi Bold",C.muted); lbl.x=cx+24; lbl.y=cy+16; s.appendChild(lbl);
    const val=txt(k.value,18,"Bold",C.ink); val.x=cx+24; val.y=cy+30; s.appendChild(val);
    const kF=iconF(14);
    if(k.icon==="users")iUsers(kF,k.color,14);
    else if(k.icon==="coin")iCoin(kF,k.color,14);
    else if(k.icon==="chart")iChart(kF,k.color,14);
    kF.x=cx+147; kF.y=cy+14; kF.opacity=0.3; s.appendChild(kF);
  });

  // Recent activity card
  const actCard=makeRect(351,288,C.surface,1,12);
  actCard.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.05),offset:{x:0,y:2},radius:6,spread:0,visible:true,blendMode:"NORMAL"}];
  actCard.x=12; actCard.y=320; s.appendChild(actCard);
  const actHdr=makeRect(351,44,C.shell,1,0); actHdr.topLeftRadius=12; actHdr.topRightRadius=12; actHdr.x=12; actHdr.y=320; s.appendChild(actHdr);
  const actTitle=txt("Recent Activity",12,"Semi Bold",C.ink); actTitle.x=28; actTitle.y=336; s.appendChild(actTitle);
  const actAllF=iconF(10); iArrowRight(actAllF,C.emerald,10); actAllF.x=342; actAllF.y=337; s.appendChild(actAllF);
  const actD=makeRect(351,1,C.line); actD.x=12; actD.y=364; s.appendChild(actD);

  const acts=[
    {name:"Kofi Asante",action:"Marked present",time:"9:05 AM"},
    {name:"Ama Boateng",action:"Fee payment",time:"8:52 AM"},
    {name:"Kwame Mensah",action:"Result uploaded",time:"8:40 AM"},
    {name:"Abena Asare",action:"Profile update",time:"8:31 AM"},
  ];
  acts.forEach((a,i)=>{
    const ry=372+i*58;
    const av=makeRect(32,32,C.navy,0.08,16); av.x=28; av.y=ry; s.appendChild(av);
    const avI=txt(a.name.split(" ").map(w=>w[0]).join(""),9,"Semi Bold",C.navy); avI.x=34; avI.y=ry+10; s.appendChild(avI);
    const nm=txt(a.name,11,"Semi Bold",C.ink); nm.x=70; nm.y=ry+2; s.appendChild(nm);
    const ac=txt(a.action,9,"Regular",C.muted); ac.x=70; ac.y=ry+18; s.appendChild(ac);
    const tc=txt(a.time,9,"Regular",C.muted); tc.x=310; tc.y=ry+10; s.appendChild(tc);
    if(i<3){const rd=makeRect(351,1,C.line); rd.x=12; rd.y=ry+56; s.appendChild(rd);}
  });

  mobileBottomNav(s,[
    {icon:"home",label:"Home"},{icon:"users",label:"Students"},
    {icon:"calendar",label:"Schedule"},{icon:"coin",label:"Fees"},
    {icon:"gear",label:"Settings"},
  ], 0);

  return s;
}

// ─── Mobile: Student Portal ───────────────────────────────────────────────────

function buildMobilePortal() {
  const s = makeFrame("Student Portal — Mobile (375×812)", 375, 812);
  s.fills = solid(C.shell);

  mobileStatusBar(s);

  // Profile header
  const profHdr=makeRect(375,96,C.navy,1,0); profHdr.x=0; profHdr.y=44; s.appendChild(profHdr);
  const av=makeRect(44,44,C.emerald,0.2,22); av.x=20; av.y=62; s.appendChild(av);
  const avI=txt("KA",14,"Semi Bold",C.surface); avI.x=28; avI.y=73; s.appendChild(avI);
  const hName=txt("Kofi Asante",14,"Semi Bold",C.surface); hName.x=74; hName.y=70; s.appendChild(hName);
  const hSub=txt("Grade 10B  ·  STU-2024-001",10,"Regular",C.surface,0.5); hSub.x=74; hSub.y=90; s.appendChild(hSub);
  const attBadge=makeRect(76,22,C.emerald,0.15,11); attBadge.x=284; attBadge.y=72; s.appendChild(attBadge);
  const attBT=txt("94% Att.",8,"Semi Bold",C.surface); attBT.x=292; attBT.y=78; s.appendChild(attBT);

  // Grades section
  const gTitle=txt("My Grades",12,"Semi Bold",C.ink); gTitle.x=20; gTitle.y=160; s.appendChild(gTitle);
  const gAll=txt("View all",10,"Regular",C.emerald); gAll.x=330; gAll.y=161; s.appendChild(gAll);

  const subs=[
    {name:"Mathematics",grade:"A1",score:"91/100",color:C.emerald},
    {name:"English Language",grade:"B2",score:"78/100",color:C.sky},
    {name:"Integrated Science",grade:"A2",score:"87/100",color:C.purple},
  ];
  subs.forEach((su,i)=>{
    const card=makeRect(351,68,C.surface,1,10);
    card.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:2},radius:6,spread:0,visible:true,blendMode:"NORMAL"}];
    card.x=12; card.y=180+i*80; s.appendChild(card);
    const cBar=makeRect(4,68,su.color,1,0); cBar.topLeftRadius=10; cBar.bottomLeftRadius=10; cBar.x=12; cBar.y=180+i*80; s.appendChild(cBar);
    const sN=txt(su.name,11,"Semi Bold",C.ink); sN.x=30; sN.y=192+i*80; s.appendChild(sN);
    const scr=txt(su.score,9,"Regular",C.muted); scr.x=30; scr.y=212+i*80; s.appendChild(scr);
    const grd=txt(su.grade,20,"Bold",su.color); grd.x=312; grd.y=192+i*80; s.appendChild(grd);
    const arrF=iconF(12); iArrowRight(arrF,C.muted,12); arrF.x=342; arrF.y=200+i*80; s.appendChild(arrF);
  });

  // Fee card
  const feeCard=makeRect(351,80,C.surface,1,10);
  feeCard.effects=[{type:"DROP_SHADOW",color:rgba(15,23,42,0.04),offset:{x:0,y:2},radius:6,spread:0,visible:true,blendMode:"NORMAL"}];
  feeCard.x=12; feeCard.y=428; s.appendChild(feeCard);
  const fAccent=makeRect(4,80,C.rose,1,0); fAccent.topLeftRadius=10; fAccent.bottomLeftRadius=10; fAccent.x=12; fAccent.y=428; s.appendChild(fAccent);
  const fTitle=txt("Fee Balance",10,"Semi Bold",C.muted); fTitle.x=30; fTitle.y=442; s.appendChild(fTitle);
  const fAmt=txt("GHS 850.00",18,"Bold",C.rose); fAmt.x=30; fAmt.y=460; s.appendChild(fAmt);
  const fDue=txt("Due: 15 Jan 2025",9,"Regular",C.muted); fDue.x=30; fDue.y=490; s.appendChild(fDue);
  const payBtn=makeRect(96,32,C.emerald,1,8); payBtn.x=248; payBtn.y=456; s.appendChild(payBtn);
  const payT=txt("Pay Now",10,"Semi Bold",C.surface); payT.x=268; payT.y=465; s.appendChild(payT);

  // Next class card
  const ncCard=makeRect(351,80,C.surface,1,10);
  ncCard.effects=feeCard.effects; ncCard.x=12; ncCard.y=524; s.appendChild(ncCard);
  const ncAccent=makeRect(4,80,C.sky,1,0); ncAccent.topLeftRadius=10; ncAccent.bottomLeftRadius=10; ncAccent.x=12; ncAccent.y=524; s.appendChild(ncAccent);
  const ncTitle=txt("Next Class",10,"Semi Bold",C.muted); ncTitle.x=30; ncTitle.y=538; s.appendChild(ncTitle);
  const ncSub=txt("Mathematics",13,"Semi Bold",C.ink); ncSub.x=30; ncSub.y=556; s.appendChild(ncSub);
  const ncTime=txt("10:00 AM  ·  Room 2A  ·  Mr. Asante-Mensah",9,"Regular",C.muted); ncTime.x=30; ncTime.y=578; s.appendChild(ncTime);
  const ncBadge=makeRect(60,20,C.emeraldBg,1,10); ncBadge.x=278; ncBadge.y=544; s.appendChild(ncBadge);
  const ncBT=txt("18 mins",8,"Semi Bold",C.emeraldDk); ncBT.x=286; ncBT.y=550; s.appendChild(ncBT);

  // Attendance card
  const attCard=makeRect(351,72,C.surface,1,10);
  attCard.effects=feeCard.effects; attCard.x=12; attCard.y=620; s.appendChild(attCard);
  const attAccent=makeRect(4,72,C.emerald,1,0); attAccent.topLeftRadius=10; attAccent.bottomLeftRadius=10; attAccent.x=12; attAccent.y=620; s.appendChild(attAccent);
  const attTitle=txt("Attendance",10,"Semi Bold",C.muted); attTitle.x=30; attTitle.y=634; s.appendChild(attTitle);
  const attPct=txt("94%",18,"Bold",C.emerald); attPct.x=30; attPct.y=652; s.appendChild(attPct);
  const attSub=txt("Present this term  ·  3 days absent",9,"Regular",C.muted); attSub.x=30; attSub.y=680; s.appendChild(attSub);

  mobileBottomNav(s,[
    {icon:"home",label:"Home"},{icon:"doc",label:"Results"},
    {icon:"coin",label:"Fees"},{icon:"calendar",label:"Timetable"},
    {icon:"chart",label:"Profile"},
  ], 0);

  return s;
}

// ─── Bridge Command Executor ──────────────────────────────────────────────────

async function executeBridgeCommand(cmd) {
  switch (cmd.action) {
    case "ping": return "pong";
    case "get_pages": return figma.root.children.map(p => ({ id:p.id, name:p.name }));
    case "set_page": {
      let p = figma.root.children.find(x => x.name === cmd.name);
      if (!p) { p = figma.createPage(); p.name = cmd.name; }
      await figma.setCurrentPageAsync(p);
      return { id:p.id, name:p.name };
    }
    case "clear_page": {
      figma.currentPage.children.forEach(c => c.remove());
      return "cleared";
    }
    case "create_frame": {
      const f = figma.createFrame();
      f.name = cmd.name||"Frame"; f.resize(cmd.width||1440, cmd.height||900);
      f.fills = cmd.fill ? [{ type:"SOLID", color:hex(cmd.fill) }] : solid(C.shell);
      if (cmd.radius) f.cornerRadius = cmd.radius;
      if (cmd.x !== undefined) f.x = cmd.x;
      if (cmd.y !== undefined) f.y = cmd.y;
      figma.currentPage.appendChild(f);
      return { id:f.id, name:f.name };
    }
    case "create_rect": {
      const r = figma.createRectangle();
      r.name = cmd.name||"Rect"; r.resize(cmd.width||100, cmd.height||100);
      r.fills = cmd.fill ? [{ type:"SOLID", color:hex(cmd.fill), opacity:cmd.opacity??1 }] : solid(C.surface);
      if (cmd.radius) r.cornerRadius = cmd.radius;
      if (cmd.x !== undefined) r.x = cmd.x;
      if (cmd.y !== undefined) r.y = cmd.y;
      if (cmd.stroke) { r.strokes=[{ type:"SOLID", color:hex(cmd.stroke) }]; r.strokeWeight=cmd.strokeWeight||1; }
      if (cmd.shadow) r.effects=[{ type:"DROP_SHADOW", color:rgba(...cmd.shadow.color), offset:cmd.shadow.offset||{x:0,y:4}, radius:cmd.shadow.radius||12, spread:cmd.shadow.spread||0, visible:true, blendMode:"NORMAL" }];
      const parent = cmd.parentId ? figma.getNodeById(cmd.parentId) : null;
      if (parent && "appendChild" in parent) parent.appendChild(r); else figma.currentPage.appendChild(r);
      return { id:r.id };
    }
    case "create_text": {
      const style = cmd.fontStyle||"Regular";
      try { await figma.loadFontAsync({ family:"Inter", style }); } catch(e) { await figma.loadFontAsync({ family:"Inter", style:"Regular" }); }
      const t = figma.createText();
      t.fontName = { family:"Inter", style };
      t.fontSize = cmd.fontSize||14; t.characters = cmd.text||"";
      t.fills = cmd.color ? [{ type:"SOLID", color:hex(cmd.color) }] : solid(C.ink);
      if (cmd.x !== undefined) t.x = cmd.x;
      if (cmd.y !== undefined) t.y = cmd.y;
      if (cmd.width) { t.textAutoResize="HEIGHT"; t.resize(cmd.width, t.height); }
      const parent = cmd.parentId ? figma.getNodeById(cmd.parentId) : null;
      if (parent && "appendChild" in parent) parent.appendChild(t); else figma.currentPage.appendChild(t);
      return { id:t.id };
    }
    case "append_child": {
      const parent=figma.getNodeById(cmd.parentId), child=figma.getNodeById(cmd.childId);
      if (parent && child && "appendChild" in parent) { parent.appendChild(child); return "ok"; }
      return "not found";
    }
    case "set_position": {
      const node = figma.getNodeById(cmd.nodeId);
      if (node && "x" in node) { node.x=cmd.x; node.y=cmd.y; }
      return "ok";
    }
    case "zoom_fit":
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
      return "ok";
    case "run_phase":
      if (cmd.phase==="foundation")  await buildFoundation();
      else if (cmd.phase==="components") await buildComponents();
      else if (cmd.phase==="composite")  await buildComposite();
      else if (cmd.phase==="screens")    await buildScreens();
      return "phase complete";
    default:
      return { error:"Unknown action: "+cmd.action };
  }
}

// ─── Message Handler ──────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  if (msg.type === "run") {
    try {
      if (msg.phase==="foundation")  await buildFoundation();
      else if (msg.phase==="components") await buildComponents();
      else if (msg.phase==="composite")  await buildComposite();
      else if (msg.phase==="screens")    await buildScreens();
    } catch(e) {
      figma.ui.postMessage({ type:"error", message: e.message });
    }
  }
  if (msg.type === "bridge_command") {
    const result = await executeBridgeCommand(msg.cmd).catch(e => ({ error:e.message }));
    figma.ui.postMessage({ type:"bridge_result", id:msg.cmd.id, result });
  }
};
