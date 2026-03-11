import { useState, useEffect, useRef } from "react";

const LEADS_INITIAUX = [
  { id: 1, nom: "Sophie Tremblay", email: "s.tremblay@gmail.com", telephone: "514-382-4471", source: "Facebook Ads", dateEntree: "2024-12-03", statut: "tiède", segment: "3-6 mois", derniereInteraction: "2024-12-18", projet: "Vente condo Rosemont", notes: "Attend le printemps pour vendre son 3½" },
  { id: 2, nom: "Marc-Antoine Bouchard", email: "mabouchard@hotmail.com", telephone: "438-771-9023", source: "Facebook Ads", dateEntree: "2024-12-07", statut: "froid", segment: "6-12 mois", derniereInteraction: "2024-12-10", projet: "Achat maison Laval", notes: "Parle d'un projet pour l'automne" },
  { id: 3, nom: "Isabelle Côté", email: "isa.cote@outlook.com", telephone: "450-882-3310", source: "Facebook Ads", dateEntree: "2024-12-11", statut: "tiède", segment: "3-6 mois", derniereInteraction: "2025-01-05", projet: "Vente duplex Verdun", notes: "Attend une évaluation, indécise" },
  { id: 4, nom: "Kevin Nguyen", email: "k.nguyen@gmail.com", telephone: "514-502-8841", source: "Facebook Ads", dateEntree: "2024-12-14", statut: "froid", segment: "6-12 mois", derniereInteraction: "2024-12-15", projet: "Achat unifamiliale Brossard", notes: "Financement pas encore arrangé" },
  { id: 5, nom: "Marie-Ève Lapointe", email: "melapointe@gmail.com", telephone: "514-673-2294", source: "Facebook Ads", dateEntree: "2024-12-19", statut: "tiède", segment: "3-6 mois", derniereInteraction: "2025-01-20", projet: "Vente maison Longueuil", notes: "Veut vendre avant l'été, hésite encore" },
  { id: 6, nom: "Patrick Ouellet", email: "p.ouellet@videotron.ca", telephone: "418-994-5532", source: "Facebook Ads", dateEntree: "2024-12-22", statut: "froid", segment: "12+ mois", derniereInteraction: "2024-12-23", projet: "Investissement locatif", notes: "Projet très long terme" },
  { id: 7, nom: "Fatima El-Amine", email: "fatima.elamine@gmail.com", telephone: "514-229-7761", source: "Facebook Ads", dateEntree: "2025-01-04", statut: "tiède", segment: "0-3 mois", derniereInteraction: "2025-01-15", projet: "Vente 4½ Plateau", notes: "Presque prête, attend un signe du marché" },
  { id: 8, nom: "Sébastien Gagnon", email: "sgagnon.immo@gmail.com", telephone: "450-341-8820", source: "Facebook Ads", dateEntree: "2025-01-08", statut: "froid", segment: "6-12 mois", derniereInteraction: "2025-01-09", projet: "Achat terrain Saint-Jean", notes: "Projet de construction, budget en cours" },
];

const STATUTS = ["tiède", "froid", "chaud", "fermé", "vendu"];
const SEGMENTS = ["0-3 mois", "3-6 mois", "6-12 mois", "12+ mois"];
const SOURCES = ["Facebook Ads", "Instagram Ads", "Référence", "Site web", "LinkedIn"];

const STATUS_CFG = {
  "tiède":  { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", dot: "#F59E0B", label: "Tiède" },
  "froid":  { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", dot: "#60A5FA", label: "Froid" },
  "chaud":  { color: "#F87171", bg: "rgba(248,113,113,0.15)", dot: "#F87171", label: "Chaud 🔥" },
  "fermé":  { color: "#6B7280", bg: "rgba(107,114,128,0.12)", dot: "#6B7280", label: "Fermé" },
  "vendu":  { color: "#34D399", bg: "rgba(52,211,153,0.12)", dot: "#34D399", label: "Vendu ✓" },
};

const AGENT_SYSTEM = (lead) => `Tu es un agent IA de suivi immobilier qui travaille pour un(e) courtier(ère) immobilier. Tu communiques avec des prospects (leads) tièdes et froids.

PROFIL DU LEAD:
- Nom: ${lead.nom}
- Projet: ${lead.projet}
- Statut: ${lead.statut}
- Segment: ${lead.segment}
- Notes: ${lead.notes}

RÈGLES ABSOLUES:
- Toujours vouvoyer (jamais tutoyer)
- Ton professionnel, chaleureux, jamais insistant
- Posture d'accompagnement uniquement
- Réponses courtes (3-5 lignes max)
- Si le lead dit non 2 fois : fermer poliment
- JAMAIS: promesses de résultats, conseils légaux, négociation
- Toujours signer "Votre courtière"
- Tu dois détecter si le lead est chaud (prêt à aller de l'avant) et le signaler clairement dans ta réponse avec [LEAD_CHAUD] au début si c'est le cas
- Si le lead ferme la conversation, commencer par [DOSSIER_FERMÉ]`;

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const nowTime = () => new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
const todayDate = () => new Date().toISOString().split("T")[0];

const VIDE_FORM = { nom: "", email: "", telephone: "", source: "Facebook Ads", statut: "tiède", segment: "3-6 mois", projet: "", notes: "" };

export default function App() {
  const [leads, setLeads] = useState(LEADS_INITIAUX);
  const [vue, setVue] = useState("dashboard");
  const [leadActif, setLeadActif] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(VIDE_FORM);
  const [phaseActive, setPhaseActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [agentOn, setAgentOn] = useState(true);
  const [filterStatut, setFilterStatut] = useState("tous");
  const chatRef = useRef(null);
  const nextId = useRef(LEADS_INITIAUX.length + 1);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [conversation, loading]);

  const addNotif = (msg, type = "info") => {
    const id = Date.now();
    setNotifs(n => [...n, { id, msg, type }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 6000);
  };

  const updateLead = (id, changes) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
    if (leadActif?.id === id) setLeadActif(prev => ({ ...prev, ...changes }));
  };

  const ajouterLead = () => {
    if (!formData.nom.trim() || !formData.projet.trim()) return;
    const nouveau = { ...formData, id: nextId.current++, dateEntree: todayDate(), derniereInteraction: todayDate() };
    setLeads(prev => [nouveau, ...prev]);
    setFormData(VIDE_FORM);
    setShowForm(false);
    addNotif(`✅ Lead ajouté : ${nouveau.nom}`, "success");
  };

  const lancerPhase = async (lead, phase) => {
    setLeadActif(lead);
    setPhaseActive(phase);
    setConversation([]);
    setVue("simulation");
    setLoading(true);
    await delay(700);

    let msg = "";
    let canal = "Email";
    const prenom = lead.nom.split(" ")[0];

    if (phase === "reactivation") {
      msg = `Bonjour ${prenom},\n\nJ'espère que vous allez bien. Il y a quelques mois, vous m'aviez contactée au sujet de votre projet immobilier.\n\nOù en êtes-vous dans votre démarche ? Votre situation a-t-elle évolué depuis ?\n\nJe suis disponible si vous souhaitez en reparler, sans aucun engagement de votre part.\n\nBonne journée,\nVotre courtière`;
      canal = "Email";
    } else if (phase === "nurturing") {
      canal = lead.segment === "3-6 mois" ? "SMS" : "Email";
      if (lead.segment === "3-6 mois") {
        msg = `Bonjour ${prenom}, je pensais à vous et à votre projet. Le marché de votre secteur évolue — quelques opportunités intéressantes sont apparues.\n\nAvez-vous des questions ou souhaitez-vous qu'on fasse le point ensemble ?\n\nVotre courtière`;
      } else {
        msg = `Bonjour ${prenom},\n\nJe prends des nouvelles de temps en temps pour rester disponible lorsque vous serez prêt(e) à avancer dans votre projet.\n\nN'hésitez pas à me contacter quand vous le souhaitez — je suis là.\n\nVotre courtière`;
      }
    }

    setConversation([{ role: "agent", content: msg, canal, time: nowTime() }]);
    updateLead(lead.id, { derniereInteraction: todayDate() });
    setLoading(false);
  };

  const envoyerReponse = async () => {
    if (!inputMsg.trim() || loading) return;
    const texte = inputMsg.trim();
    setInputMsg("");
    setConversation(c => [...c, { role: "lead", content: texte, time: nowTime() }]);
    setLoading(true);
    await delay(1000 + Math.random() * 600);

    try {
      const history = [...conversation, { role: "lead", content: texte }];
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: AGENT_SYSTEM(leadActif),
          messages: history.map(m => ({
            role: m.role === "agent" ? "assistant" : "user",
            content: m.content
          }))
        })
      });
      const data = await response.json();
      let replyText = data.content?.[0]?.text || "Je vous remercie pour votre message. Je reviens vers vous sous peu.\n\nVotre courtière";

      let newStatut = leadActif.statut;
      let isChaud = false;
      let isFerme = false;

      if (replyText.startsWith("[LEAD_CHAUD]")) {
        isChaud = true;
        replyText = replyText.replace("[LEAD_CHAUD]", "").trim();
        newStatut = "chaud";
        updateLead(leadActif.id, { statut: "chaud", segment: "0-3 mois", derniereInteraction: todayDate() });
        setTimeout(() => addNotif(`🔥 LEAD CHAUD — ${leadActif.nom} est prêt(e) ! Appelez maintenant.`, "chaud"), 500);
      } else if (replyText.startsWith("[DOSSIER_FERMÉ]")) {
        isFerme = true;
        replyText = replyText.replace("[DOSSIER_FERMÉ]", "").trim();
        newStatut = "fermé";
        updateLead(leadActif.id, { statut: "fermé", derniereInteraction: todayDate() });
        setTimeout(() => addNotif(`📁 Dossier fermé : ${leadActif.nom}`, "info"), 500);
      }

      const canal = conversation[0]?.canal || "Email";
      setConversation(c => [...c, { role: "agent", content: replyText, canal, time: nowTime(), highlight: isChaud ? "chaud" : isFerme ? "ferme" : null }]);
    } catch {
      setConversation(c => [...c, { role: "agent", content: "Je vous remercie pour votre message. Je reviens vers vous très bientôt.\n\nVotre courtière", canal: "Email", time: nowTime() }]);
    }
    setLoading(false);
  };

  const leadsFiltrés = filterStatut === "tous" ? leads : leads.filter(l => l.statut === filterStatut);
  const stats = {
    total: leads.length,
    tièdes: leads.filter(l => l.statut === "tiède").length,
    froids: leads.filter(l => l.statut === "froid").length,
    chauds: leads.filter(l => l.statut === "chaud").length,
    fermés: leads.filter(l => l.statut === "fermé").length,
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", background: "#080C10", minHeight: "100vh", color: "#D4CFC9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0D1117; }
        ::-webkit-scrollbar-thumb { background: #1E2A1A; border-radius: 4px; }
        @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes dot1 { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes dot2 { 0%,20%,100% { transform: scale(0); } 60% { transform: scale(1); } }
        @keyframes dot3 { 0%,40%,100% { transform: scale(0); } 80% { transform: scale(1); } }
        .lead-row:hover { background: rgba(180,160,100,0.04) !important; }
        .btn-action:hover { opacity: 0.85; transform: translateY(-1px); }
        .nav-item:hover { color: #C9A46A !important; }
        .filter-btn:hover { border-color: #C9A46A !important; color: #C9A46A !important; }
      `}</style>

      {/* NOTIFS */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} style={{
            background: n.type === "chaud" ? "linear-gradient(135deg, #4A0E0E, #2D0808)" : n.type === "success" ? "linear-gradient(135deg, #0E2E1A, #082010)" : "#111820",
            border: `1px solid ${n.type === "chaud" ? "#F87171" : n.type === "success" ? "#34D399" : "#1E2A3A"}`,
            borderRadius: 10, padding: "12px 18px", maxWidth: 360, fontSize: 12,
            fontFamily: "'DM Sans', sans-serif", color: "#E8E0D4",
            boxShadow: n.type === "chaud" ? "0 0 30px rgba(248,113,113,0.2)" : "0 4px 24px rgba(0,0,0,0.5)",
            animation: "slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>{n.msg}</div>
        ))}
      </div>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, #0D1117 0%, #080C10 100%)", borderBottom: "1px solid #141C24", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #C9A46A 0%, #6B4E1C 100%)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 0 20px rgba(201,164,106,0.3)" }}>⌂</div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#C9A46A", letterSpacing: "0.3px", lineHeight: 1 }}>NurtureIQ</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#3A4A5A", letterSpacing: "2.5px", textTransform: "uppercase" }}>Agent IA Immobilier</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2 }}>
          {[
            { id: "dashboard", label: "Pipeline" },
            { id: "simulation", label: "Simulation", disabled: !leadActif },
          ].map(v => (
            <button key={v.id} className="nav-item" onClick={() => !v.disabled && setVue(v.id)}
              style={{ padding: "8px 18px", background: "none", border: "none", cursor: v.disabled ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: vue === v.id ? "#C9A46A" : "#3A4A5A", borderBottom: vue === v.id ? "2px solid #C9A46A" : "2px solid transparent", transition: "all 0.2s", opacity: v.disabled ? 0.3 : 1 }}>
              {v.label}
              {v.id === "dashboard" && stats.chauds > 0 && <span style={{ marginLeft: 6, background: "#F87171", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{stats.chauds}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: agentOn ? "#34D399" : "#374151", boxShadow: agentOn ? "0 0 8px #34D399" : "none", animation: agentOn ? "pulse 2s infinite" : "none" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: agentOn ? "#34D399" : "#374151" }}>{agentOn ? "Agent actif" : "En veille"}</span>
          <button onClick={() => setAgentOn(a => !a)}
            style={{ padding: "7px 16px", background: agentOn ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${agentOn ? "#34D39944" : "#1E2A3A"}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: agentOn ? "#34D399" : "#374151", transition: "all 0.2s" }}>
            {agentOn ? "Désactiver" : "Activer"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        {vue === "dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Titre + bouton ajouter */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#C9A46A", margin: 0, letterSpacing: "-0.5px" }}>Pipeline de leads</h1>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#2E3E4E", margin: "4px 0 0" }}>Suivi automatique — leads tièdes & froids</p>
              </div>
              <button onClick={() => setShowForm(true)}
                style={{ padding: "10px 22px", background: "linear-gradient(135deg, #C9A46A, #7A5A28)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#080C10", boxShadow: "0 0 20px rgba(201,164,106,0.25)", transition: "all 0.2s" }}>
                + Ajouter un lead
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Total", val: stats.total, color: "#C9A46A" },
                { label: "Tièdes", val: stats.tièdes, color: "#F59E0B" },
                { label: "Froids", val: stats.froids, color: "#60A5FA" },
                { label: "Chauds 🔥", val: stats.chauds, color: "#F87171" },
                { label: "Fermés", val: stats.fermés, color: "#4B5563" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#0D1117", border: `1px solid ${s.color}22`, borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: 4 }}>{s.label}</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, height: 2, width: `${(s.val / Math.max(stats.total, 1)) * 100}%`, background: s.color, opacity: 0.6 }} />
                </div>
              ))}
            </div>

            {/* Filtres */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["tous", "tiède", "froid", "chaud", "fermé", "vendu"].map(f => (
                <button key={f} className="filter-btn" onClick={() => setFilterStatut(f)}
                  style={{ padding: "6px 14px", background: filterStatut === f ? STATUS_CFG[f]?.bg || "rgba(201,164,106,0.1)" : "transparent", border: `1px solid ${filterStatut === f ? STATUS_CFG[f]?.color || "#C9A46A" : "#141C24"}`, borderRadius: 20, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: filterStatut === f ? STATUS_CFG[f]?.color || "#C9A46A" : "#2E3E4E", transition: "all 0.2s", textTransform: "capitalize" }}>
                  {f === "tous" ? `Tous (${leads.length})` : `${STATUS_CFG[f]?.label || f} (${leads.filter(l => l.statut === f).length})`}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "#0D1117", border: "1px solid #141C24", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#080C10" }}>
                    {["Contact", "Statut", "Segment", "Projet", "Dernière interaction", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2E3E4E", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, borderBottom: "1px solid #141C24" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrés.map((lead, idx) => (
                    <tr key={lead.id} className="lead-row"
                      style={{ background: hovered === lead.id ? "rgba(180,160,100,0.03)" : "transparent", borderBottom: idx < leadsFiltrés.length - 1 ? "1px solid #0D1117" : "none", transition: "background 0.15s" }}
                      onMouseEnter={() => setHovered(lead.id)} onMouseLeave={() => setHovered(null)}>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#D4CFC9" }}>{lead.nom}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E", marginTop: 2 }}>{lead.email} · {lead.source}</div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: STATUS_CFG[lead.statut]?.bg || "#111", border: `1px solid ${STATUS_CFG[lead.statut]?.color || "#444"}33`, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: STATUS_CFG[lead.statut]?.color || "#fff" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_CFG[lead.statut]?.dot || "#fff" }} />
                          {STATUS_CFG[lead.statut]?.label || lead.statut}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#3A4A5A" }}>{lead.segment}</td>
                      <td style={{ padding: "14px 18px", maxWidth: 200 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#5A6A7A" }}>{lead.projet}</div>
                        {lead.notes && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2E3E4E", marginTop: 2, fontStyle: "italic" }}>{lead.notes}</div>}
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#2E3E4E" }}>{lead.derniereInteraction}</td>
                      <td style={{ padding: "14px 18px" }}>
                        {lead.statut !== "fermé" && lead.statut !== "vendu" ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn-action" onClick={() => lancerPhase(lead, "reactivation")}
                              style={{ padding: "5px 12px", background: "rgba(201,164,106,0.1)", border: "1px solid rgba(201,164,106,0.25)", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#C9A46A", transition: "all 0.2s" }}>
                              Réactiver
                            </button>
                            <button className="btn-action" onClick={() => lancerPhase(lead, "nurturing")}
                              style={{ padding: "5px 12px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#60A5FA", transition: "all 0.2s" }}>
                              Nurturer
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SIMULATION ────────────────────────────────────────────────── */}
        {vue === "simulation" && leadActif && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <button onClick={() => { setVue("dashboard"); setConversation([]); }}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid #141C24", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#3A4A5A", transition: "all 0.2s" }}>
                ← Retour
              </button>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#C9A46A", fontWeight: 600 }}>
                {phaseActive === "reactivation" ? "Phase 1 — Réactivation" : "Phase 2 — Nurturing"}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#2E3E4E" }}>· {leadActif.nom}</span>
              <div style={{ marginLeft: "auto", background: "#0D1117", border: "1px solid #141C24", borderRadius: 8, padding: "7px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E" }}>
                💡 Répondez comme si vous étiez le lead — <em style={{ color: "#C9A46A" }}>oui · non · plus tard · prêt · intéressé</em>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, height: "calc(100vh - 170px)" }}>
              {/* Fiche lead */}
              <div style={{ background: "#0D1117", border: "1px solid #141C24", borderRadius: 14, padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, rgba(201,164,106,0.15), rgba(107,78,28,0.1))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12, border: "1px solid rgba(201,164,106,0.15)" }}>
                    {leadActif.nom[0]}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#D4CFC9", fontWeight: 600 }}>{leadActif.nom}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: STATUS_CFG[leadActif.statut]?.bg || "#111", border: `1px solid ${STATUS_CFG[leadActif.statut]?.color || "#444"}33`, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: STATUS_CFG[leadActif.statut]?.color || "#fff" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_CFG[leadActif.statut]?.dot }} />
                      {STATUS_CFG[leadActif.statut]?.label}
                    </span>
                  </div>
                </div>

                {[
                  { label: "Email", val: leadActif.email, icon: "✉" },
                  { label: "Téléphone", val: leadActif.telephone, icon: "☎" },
                  { label: "Source", val: leadActif.source, icon: "◈" },
                  { label: "Entrée CRM", val: leadActif.dateEntree, icon: "◷" },
                  { label: "Segment", val: leadActif.segment, icon: "◎" },
                  { label: "Projet", val: leadActif.projet, icon: "⌂" },
                  { label: "Notes", val: leadActif.notes, icon: "✎" },
                ].map(({ label, val, icon }) => (
                  <div key={label} style={{ padding: "10px 0", borderBottom: "1px solid #0A0E14" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2E3E4E", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 3 }}>{icon} {label}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#5A6A7A" }}>{val || "—"}</div>
                  </div>
                ))}

                {/* Workflow tracker */}
                <div style={{ marginTop: 20, background: "#080C10", borderRadius: 10, padding: 14, border: "1px solid #0D1117" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2E3E4E", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>Progression</div>
                  {[
                    { label: "Message envoyé", done: conversation.length > 0 },
                    { label: "Réponse reçue", done: conversation.some(c => c.role === "lead") },
                    { label: "Lead classifié", done: leadActif.statut === "chaud" || leadActif.statut === "fermé" },
                    { label: "Action déclenchée", done: leadActif.statut === "chaud" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.done ? "#C9A46A" : "#141C24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: s.done ? "#080C10" : "#2E3E4E", fontWeight: 700, flexShrink: 0, border: s.done ? "none" : "1px solid #1E2A3A" }}>
                        {s.done ? "✓" : i + 1}
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: s.done ? "#8A9A7A" : "#2E3E4E" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div style={{ background: "#0D1117", border: "1px solid #141C24", borderRadius: 14, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #141C24", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399", animation: "pulse 2s infinite" }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#5A6A7A", textTransform: "uppercase", letterSpacing: "1.5px" }}>Agent en ligne</span>
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E" }}>Canal : {conversation[0]?.canal || (phaseActive === "reactivation" ? "Email" : "SMS")}</span>
                </div>

                <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
                  {conversation.map((msg, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "agent" ? "flex-start" : "flex-end", animation: "fadeUp 0.3s ease" }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2E3E4E", marginBottom: 5 }}>
                        {msg.role === "agent" ? `🤖 Agent IA · ${msg.canal}` : `👤 ${leadActif.nom}`} · {msg.time}
                      </div>
                      <div style={{
                        maxWidth: "72%", padding: "13px 17px", borderRadius: msg.role === "agent" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                        background: msg.highlight === "chaud" ? "rgba(248,113,113,0.1)" : msg.highlight === "ferme" ? "rgba(107,114,128,0.1)" : msg.role === "agent" ? "#111820" : "rgba(201,164,106,0.08)",
                        border: msg.highlight === "chaud" ? "1px solid rgba(248,113,113,0.3)" : msg.highlight === "ferme" ? "1px solid rgba(107,114,128,0.3)" : msg.role === "agent" ? "1px solid #141C24" : "1px solid rgba(201,164,106,0.2)",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.65, color: msg.role === "agent" ? "#8A9AAA" : "#C4BFB9", whiteSpace: "pre-wrap"
                      }}>{msg.content}</div>
                    </div>
                  ))}

                  {loading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#2E3E4E", marginBottom: 5 }}>🤖 Agent IA · en train d'écrire...</div>
                      <div style={{ padding: "13px 18px", borderRadius: "4px 16px 16px 16px", background: "#111820", border: "1px solid #141C24", display: "flex", gap: 5, alignItems: "center" }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A46A", animation: `dot${i + 1} 1.2s infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ padding: "14px 18px", borderTop: "1px solid #141C24", display: "flex", gap: 10 }}>
                  <input value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && envoyerReponse()}
                    placeholder="Tapez la réponse du lead... (ex: oui, non, plus tard, prêt, intéressé)"
                    style={{ flex: 1, background: "#080C10", border: "1px solid #141C24", borderRadius: 8, padding: "10px 14px", color: "#D4CFC9", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                  <button onClick={envoyerReponse} disabled={loading}
                    style={{ padding: "10px 22px", background: loading ? "#141C24" : "linear-gradient(135deg, #C9A46A, #7A5A28)", border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: loading ? "#2E3E4E" : "#080C10", transition: "all 0.2s" }}>
                    Envoyer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL AJOUTER LEAD ─────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0D1117", border: "1px solid #141C24", borderRadius: 16, padding: 32, width: 520, maxHeight: "85vh", overflowY: "auto", animation: "fadeUp 0.3s ease", boxShadow: "0 0 60px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#C9A46A", fontWeight: 600 }}>Nouveau lead</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2E3E4E", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "nom", label: "Nom complet *", placeholder: "Sophie Tremblay", full: true },
                { key: "email", label: "Email", placeholder: "sophie@gmail.com" },
                { key: "telephone", label: "Téléphone", placeholder: "514-000-0000" },
                { key: "projet", label: "Projet *", placeholder: "Vente condo Rosemont", full: true },
                { key: "notes", label: "Notes", placeholder: "Attend le printemps...", full: true },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto" }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>{f.label}</label>
                  {f.key === "notes" ? (
                    <textarea value={formData[f.key]} onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3}
                      style={{ width: "100%", background: "#080C10", border: "1px solid #141C24", borderRadius: 8, padding: "9px 12px", color: "#D4CFC9", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical" }} />
                  ) : (
                    <input value={formData[f.key]} onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      style={{ width: "100%", background: "#080C10", border: "1px solid #141C24", borderRadius: 8, padding: "9px 12px", color: "#D4CFC9", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                  )}
                </div>
              ))}

              {[
                { key: "source", label: "Source", options: SOURCES },
                { key: "statut", label: "Statut", options: STATUTS },
                { key: "segment", label: "Segment", options: SEGMENTS },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#2E3E4E", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>{f.label}</label>
                  <select value={formData[f.key]} onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                    style={{ width: "100%", background: "#080C10", border: "1px solid #141C24", borderRadius: 8, padding: "9px 12px", color: "#D4CFC9", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "10px 20px", background: "transparent", border: "1px solid #141C24", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#3A4A5A" }}>
                Annuler
              </button>
              <button onClick={ajouterLead}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg, #C9A46A, #7A5A28)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#080C10", boxShadow: "0 0 20px rgba(201,164,106,0.2)" }}>
                Ajouter le lead ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

