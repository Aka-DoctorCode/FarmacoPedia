const API = "/api";
const $ = (id) => document.getElementById(id);
const state = { kind: "drugs", items: [], current: null, original: null, isNew: false };
const STRIP = ["_id", "__v"];

// ---------- auth ----------
async function unlockIfSession() {
  const t = sessionStorage.getItem("tok");
  if (!t) return;
  const r = await fetch("/session", { headers: { Authorization: "Bearer " + t } });
  if (r.ok) showApp();
}
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const r = await fetch("/auth", { method: "POST", body: JSON.stringify({ password: $("password").value }) });
  if (!r.ok) { $("login-error").textContent = "Contraseña incorrecta"; return; }
  sessionStorage.setItem("tok", (await r.json()).token);
  showApp();
});
function showApp() { $("login").hidden = true; $("app").hidden = false; loadList(); }

// ---------- api ----------
const base = () => (state.kind === "drugs" ? "/drugs" : "/pending-drugs");
async function api(method, url, body) {
  const r = await fetch(API + url, {
    method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessionStorage.getItem("tok") }, body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(j.error || j.message || "HTTP " + r.status);
  return j;
}
const clean = (o) => { const c = { ...o }; STRIP.forEach((k) => delete c[k]); return c; };

// ---------- list ----------
async function loadList() {
  setStatus("Cargando… (Render puede tardar si estaba dormido)");
  try {
    const q = $("search").value.trim();
    const url = state.kind === "drugs" ? "/drugs" + (q ? "?q=" + encodeURIComponent(q) : "") : "/pending-drugs?all=true";
    state.items = (await api("GET", url)).data;
    renderList();
    setStatus(state.items.length + " entradas");
  } catch (e) { setStatus("Error al cargar: " + e.message, "bad"); }
}
function renderList() {
  const q = $("search").value.trim().toLowerCase();
  const ul = $("list"); ul.innerHTML = "";
  state.items
    .filter((i) => state.kind === "drugs" || !q || i.name.toLowerCase().includes(q))
    .forEach((i) => {
      const li = document.createElement("li");
      li.textContent = i.name;
      if (state.kind === "pending") { const s = document.createElement("small"); s.textContent = i.status; li.append(s); }
      if (state.current && state.current.name === i.name) li.className = "sel";
      li.onclick = () => openEntry(i.name);
      ul.append(li);
    });
}
let t; $("search").addEventListener("input", () => { clearTimeout(t); t = setTimeout(state.kind === "drugs" ? loadList : renderList, 300); });
["drugs", "pending"].forEach((k) => $("tab-" + k).addEventListener("click", async () => {
  if (!(await guardDirty())) return;
  state.kind = k; state.current = null; closeEditor();
  $("tab-drugs").classList.toggle("active", k === "drugs");
  $("tab-pending").classList.toggle("active", k === "pending");
  loadList();
}));

// ---------- editor ----------
const isDirty = () => !$("text").disabled && $("text").value !== state.original;
async function guardDirty() {
  return !isDirty() || (await dialog("Cambios sin guardar", "Se perderán los cambios. ¿Continuar?"));
}
function closeEditor() {
  $("text").value = ""; $("text").disabled = true; state.original = null; state.isNew = false;
  ["save-btn", "discard-btn", "delete-btn"].forEach((b) => ($(b).disabled = true));
  $("title").textContent = "Selecciona una entrada"; renderList();
}
function load(obj, isNew) {
  state.isNew = isNew;
  state.original = JSON.stringify(obj, null, 2);
  $("text").value = state.original; $("text").disabled = false;
  $("discard-btn").disabled = false; $("delete-btn").disabled = isNew;
  validate();
}
async function openEntry(name) {
  if (!(await guardDirty())) return;
  try {
    const data = state.kind === "drugs"
      ? (await api("GET", "/drugs/" + encodeURIComponent(name))).data
      : state.items.find((i) => i.name === name);
    state.current = data;
    $("title").textContent = data.name;
    load(clean(data), false); renderList();
  } catch (e) { setStatus("Error: " + e.message, "bad"); }
}
$("new-btn").onclick = async () => {
  if (!(await guardDirty())) return;
  state.current = null; $("title").textContent = "Nueva entrada";
  load(state.kind === "drugs" ? { name: "" } : { name: "", status: "pending" }, true);
  renderList();
};
$("discard-btn").onclick = () => { $("text").value = state.original; validate(); };
$("text").addEventListener("input", validate);
$("text").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (!$("save-btn").disabled) save(); }
});
window.addEventListener("beforeunload", (e) => { if (isDirty()) e.preventDefault(); });

// ---------- validation ----------
function parse(text) {
  try { return { value: JSON.parse(text) }; }
  catch (err) {
    let msg = err.message, line, col;
    const m = msg.match(/line (\d+) column (\d+)/);
    if (m) { line = +m[1]; col = +m[2]; }
    else {
      const p = msg.match(/position (\d+)/);
      if (p) { const pre = text.slice(0, +p[1]).split("\n"); line = pre.length; col = pre[pre.length - 1].length + 1; }
    }
    return { error: `Error de sintaxis${line ? ` (línea ${line}, columna ${col})` : ""}: ${msg}` };
  }
}
function validate() {
  const text = $("text").value, r = parse(text);
  if (r.error) { setStatus(r.error, "bad"); $("save-btn").disabled = true; return; }
  if (typeof r.value !== "object" || Array.isArray(r.value) || !r.value) {
    setStatus("La raíz debe ser un objeto JSON {…}", "bad"); $("save-btn").disabled = true; return;
  }
  const changed = text !== state.original;
  $("save-btn").disabled = !changed;
  setStatus(changed ? "JSON válido · cambios pendientes" : "JSON válido · sin cambios", changed ? "good" : "");
}
function setStatus(msg, cls = "") { const s = $("status"); s.textContent = msg; s.className = "status " + cls; }

// ---------- diff & save ----------
function topLevelDiff(a, b) {
  const set = {}, lines = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const sa = JSON.stringify(a[k]), sb = JSON.stringify(b[k]);
    if (sa === sb) continue;
    if (!(k in b)) { lines.push(`- ${k}: ${sa}   (ELIMINADO → se envía $unset no soportado; se ignora)`); continue; }
    set[k] = b[k];
    lines.push(`~ ${k}:\n    antes:   ${sa === undefined ? "(no existía)" : sa}\n    después: ${sb}`);
  }
  return { set, lines };
}
async function save() {
  const edited = parse($("text").value).value, orig = JSON.parse(state.original);
  try {
    if (state.isNew) {
      if (!edited.name) return setStatus("La entrada necesita 'name'", "bad");
      if (!(await dialog("Crear entrada", JSON.stringify(edited, null, 2)))) return;
      await api("POST", base(), edited);
      setStatus("Creada ✔", "good");
      await loadList(); return openEntry(edited.name);
    }
    const { set, lines } = topLevelDiff(orig, edited);
    if (!Object.keys(set).length) return setStatus("Nada que enviar (solo eliminaste claves, no soportado).", "bad");
    if (!(await dialog("Confirmar cambios en " + state.current.name, lines.join("\n")))) return;
    await api("PATCH", base() + "/" + encodeURIComponent(state.current.name), set);
    setStatus("Guardado ✔", "good");
    const name = set.name || state.current.name;
    await loadList(); state.original = null; openEntryForce(name);
  } catch (e) { setStatus("Error al guardar: " + e.message, "bad"); }
}
async function openEntryForce(name) { $("text").disabled = true; await openEntry(name); }
$("save-btn").onclick = save;

$("delete-btn").onclick = async () => {
  const name = state.current.name;
  const typed = await dialog("Eliminar «" + name + "»", "Acción irreversible en PRODUCCIÓN.\nEscribe el nombre exacto para confirmar:", true);
  if (typed !== name) { if (typed !== false) setStatus("Nombre no coincide. No se eliminó.", "bad"); return; }
  try {
    await api("DELETE", base() + "/" + encodeURIComponent(name));
    state.current = null; closeEditor(); setStatus("Eliminado ✔", "good"); loadList();
  } catch (e) { setStatus("Error al eliminar: " + e.message, "bad"); }
};

// ---------- dialog ----------
function dialog(title, body, withInput = false) {
  return new Promise((resolve) => {
    const d = $("dlg");
    $("dlg-title").textContent = title; $("dlg-body").textContent = body;
    $("dlg-input").hidden = !withInput; $("dlg-input").value = "";
    const done = (v) => { d.close(); $("dlg-ok").onclick = $("dlg-cancel").onclick = null; resolve(v); };
    $("dlg-ok").onclick = () => done(withInput ? $("dlg-input").value : true);
    $("dlg-cancel").onclick = () => done(false);
    d.oncancel = () => resolve(false);
    d.showModal();
  });
}

unlockIfSession();

fetch("/config").then((r) => r.json()).then((c) => {
  const b = $("banner");
  b.textContent = (c.prod ? "⚠ PRODUCCIÓN · " : "LOCAL · ") + c.apiBase;
  if (!c.prod) b.style.background = "linear-gradient(90deg,#14532d,#166534)";
});
