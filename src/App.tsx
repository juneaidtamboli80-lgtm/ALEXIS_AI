import { useEffect, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Menu, Mic, Send, Settings, Shield, Volume2, X, KeyRound, MessageCircle, Smartphone } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };
const MODEL_OPTIONS = [
  { label: "Gemini 3.8 Live", id: "gemini-3.8-live" },
  { label: "Gemini 3.1 Flash Live", id: "gemini-3.1-flash-live-preview" }
];

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(MODEL_OPTIONS[0].id);
  const [voiceName, setVoiceName] = useState("Aoede");
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready when you are");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hello! I'm ALEXIS. Aap mujhse Hindi ya English mein baat kar sakte hain. API key Settings mein add karein." }
  ]);
  const [notice, setNotice] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const key = await Preferences.get({ key: "gemini_api_key" });
      const savedModel = await Preferences.get({ key: "gemini_model" });
      const savedVoice = await Preferences.get({ key: "voice_name" });
      if (key.value) setApiKey(key.value);
      if (savedModel.value) setModel(savedModel.value);
      if (savedVoice.value) setVoiceName(savedVoice.value);
    })();
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function saveSettings() {
    if (apiKey.trim()) await Preferences.set({ key: "gemini_api_key", value: apiKey.trim() });
    else await Preferences.remove({ key: "gemini_api_key" });
    await Preferences.set({ key: "gemini_model", value: model });
    await Preferences.set({ key: "voice_name", value: voiceName });
    setNotice("Settings saved on this device.");
    setTimeout(() => setNotice(""), 2500);
  }

  async function sendMessage(value = text) {
    const prompt = value.trim();
    if (!prompt || busy) return;
    if (!apiKey.trim()) { setShowSettings(true); setNotice("Pehle Gemini API key save karein."); return; }
    setMessages(prev => [...prev, { role: "user", text: prompt }]);
    setText(""); setBusy(true); setStatus("Thinking…");
    try {
      // Text chat endpoint. Live audio streaming is a separate phase and uses the selected Live model.
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { systemInstruction: "You are ALEXIS, a warm, respectful female-voiced personal assistant. Reply naturally in the user's language. Do not claim to have performed phone actions unless a native Android action confirms success." }
      });
      const answer = response.text || "I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: answer }]);
      speak(answer);
      setStatus("Ready when you are");
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", text: `Error: ${e?.message || "Gemini request failed"}` }]);
      setStatus("Connection error");
    } finally { setBusy(false); }
  }

  function speak(value: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "hi-IN";
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /female|zira|samantha|google हिन्दी|heera/i.test(v.name));
    if (preferred) utterance.voice = preferred;
    utterance.rate = 1; utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  function startSpeechInput() {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { setNotice("Is device/browser par speech recognition available nahi hai."); return; }
    const rec = new SR();
    rec.lang = "hi-IN"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setStatus("Listening…");
    rec.onresult = (event: any) => { const heard = event.results?.[0]?.[0]?.transcript || ""; setText(heard); setStatus("Ready when you are"); };
    rec.onerror = () => setStatus("Mic error");
    rec.onend = () => setStatus("Ready when you are");
    rec.start();
  }

  return <div className="app">
    <header><button className="iconBtn" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button><div className="brand"><span className="brandMark">A</span><div><b>ALEXIS AI</b><small>PERSONAL VOICE ASSISTANT</small></div></div><button className="iconBtn" onClick={() => setShowSettings(true)}><Settings /></button></header>
    {menuOpen && <aside className="drawer"><div className="drawerHead"><b>Menu</b><button className="iconBtn" onClick={() => setMenuOpen(false)}><X /></button></div>
      <button onClick={() => { setMenuOpen(false); setMessages([{role:"assistant",text:"Hello! I'm ALEXIS. How can I help?"}]); }}><MessageCircle /> New chat</button>
      <button onClick={() => { setMenuOpen(false); setShowSettings(true); }}><Settings /> AI & Voice Settings</button>
      <button onClick={() => { setMenuOpen(false); setShowSettings(true); }}><Shield /> Permissions</button>
      <button onClick={() => { setMenuOpen(false); setNotice("Phone control needs the optional native Accessibility service. It is not enabled by this web screen."); }}><Smartphone /> Phone Control</button>
    </aside>}
    <main>
      <section className="hero"><div className="orb"><div className="orbCore">A</div><i/><i/><i/></div><h1>I'm ALEXIS</h1><p>Your personal AI companion</p><div className="status"><span className={busy ? "pulse" : ""}/>{status}</div></section>
      <section className="chat">{messages.map((m,i)=><div key={i} className={`bubble ${m.role}`}><small>{m.role === "assistant" ? "ALEXIS" : "YOU"}</small><p>{m.text}</p>{m.role === "assistant" && <button className="speakBtn" onClick={() => speak(m.text)}><Volume2 size={15}/> Speak</button>}</div>)}<div ref={bottom}/></section>
    </main>
    <footer><div className="composer"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Message ALEXIS…" /><button className="micBtn" onClick={startSpeechInput}><Mic/></button><button className="sendBtn" disabled={busy} onClick={()=>sendMessage()}><Send/></button></div><small>Voice input and spoken replies use Android/browser speech services. Live streaming is not connected in this starter build.</small></footer>
    {notice && <div className="toast">{notice}</div>}
    {showSettings && <div className="overlay" onClick={()=>setShowSettings(false)}><section className="settings" onClick={e=>e.stopPropagation()}><div className="drawerHead"><div><h2>Settings</h2><small>Configure your assistant</small></div><button className="iconBtn" onClick={()=>setShowSettings(false)}><X/></button></div>
      <label><KeyRound size={17}/> Gemini API Key</label><input className="field" type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Paste your API key"/>
      <label>Live model preference</label><select className="field" value={model} onChange={e=>setModel(e.target.value)}>{MODEL_OPTIONS.map(m=><option key={m.id} value={m.id}>{m.label} — {m.id}</option>)}</select>
      <label>Voice preference</label><select className="field" value={voiceName} onChange={e=>setVoiceName(e.target.value)}><option value="Aoede">Aoede</option><option value="Kore">Kore</option><option value="Leda">Leda</option><option value="Zephyr">Zephyr</option></select>
      <div className="warning">API key device par save hoti hai. Production release mein standard key ko app ke andar rakhna unsafe hai; secure backend / ephemeral Live tokens use karein. Voice name preference is saved; actual Live voice will apply after Live API wiring.</div>
      <button className="primary" onClick={saveSettings}>Save settings</button>
      <button className="secondary" onClick={()=>{setShowSettings(false);setNotice("Android permissions are added in the native-app phase. Grant only permissions you need.");}}>Permissions help</button>
    </section></div>}
    <div className="platform">{Capacitor.isNativePlatform() ? "Android app" : "Preview mode"}</div>
  </div>;
}
