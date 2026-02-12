import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Palette, 
  Type, 
  FileText, 
  Share2, 
  Download,
  Mic,
  MicOff,
  Image as ImageIcon,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  MessageCircle,
  MessageSquare,
  Search,
  MoreVertical,
  Edit2,
  Check,
  Upload,
  User as UserIcon,
  MousePointer2,
  Move,
  RotateCw,
  Maximize,
  Box,
  Circle as CircleIcon,
  Triangle,
  Hexagon,
  Square,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { User, BrandProject, BrandGeneratedData, ChatMessage, TextLayer } from './types';
import { generateBrandIdentity, generateLogoIcon, getChatResponse } from './services/geminiService';
import { generateLogoWithStability } from './services/stabilityService';
import { Button, Input, TextArea, Card, Select, ColorInput } from './components/UI';

// --- Constants & Helpers ---

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
];

const FONT_OPTIONS = [
    { value: 'Montserrat', label: 'Modern Sans (Montserrat)' },
    { value: 'Open Sans', label: 'Clean Sans (Open Sans)' },
    { value: 'Poppins', label: 'Geometric (Poppins)' },
    { value: 'Raleway', label: 'Elegant (Raleway)' },
    { value: 'Playfair Display', label: 'Luxury Serif (Playfair)' },
    { value: 'Merriweather', label: 'Classic Serif (Merriweather)' },
    { value: 'Roboto Slab', label: 'Bold Slab (Roboto)' },
    { value: 'Lato', label: 'Friendly (Lato)' },
    { value: 'Pacifico', label: 'Handwritten (Pacifico)' },
    { value: 'Dancing Script', label: 'Cursive (Dancing Script)' },
    { value: 'Oswald', label: 'Strong (Oswald)' },
    { value: 'Bebas Neue', label: 'Condensed (Bebas)' },
    { value: 'Cinzel', label: 'Cinematic (Cinzel)' },
    { value: 'Lobster', label: 'Retro (Lobster)' },
    { value: 'Abril Fatface', label: 'Heavy Serif (Abril)' },
];

const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const exportToPDF = (project: BrandProject) => {
  const doc = new jsPDF();
  const d = project.generatedData;
  if (!d) return;

  const margin = 20;
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);

  const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [40, 40, 40]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    
    if (y + (lines.length * size * 0.4) > 280) {
        doc.addPage();
        y = 20;
    }
    
    doc.text(lines, margin, y);
    y += (lines.length * size * 0.4) + 6;
  };

  // --- PAGE 1: Brand Name + Logo ---
  doc.setFontSize(50);
  doc.setTextColor(79, 70, 229);
  doc.text(project.name || "Brand Name", pageWidth / 2, 100, { align: 'center' });
  
  if (d.visuals.logoIconUrl) {
      try {
          doc.addImage(d.visuals.logoIconUrl, 'PNG', (pageWidth / 2) - 40, 120, 80, 80);
      } catch(e) { console.error(e); }
  }
  
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text("BrandForge AI Generated Identity", pageWidth / 2, 280, { align: 'center' });


  // --- SUBSEQUENT PAGES ---
  doc.addPage();
  y = 20;

  addText("Strategic Overview", 18, 'bold', [79, 70, 229]);
  y += 5;
  addText(`Industry: ${project.industry}`, 12);
  addText(`Tone: ${project.tone}`, 12);
  y += 5;
  addText("Vision & Mission", 14, 'bold');
  addText(d.story.vision, 11);
  y += 2;
  addText(d.story.mission, 11);
  
  y += 10;
  addText("Strategic Positioning", 14, 'bold');
  addText(d.story.positioning, 11);
  
  doc.addPage();
  y = 20;
  addText("Visual Identity System", 18, 'bold', [79, 70, 229]);
  y += 5;
  
  addText("Color Palette", 14, 'bold');
  const palette = d.visuals.palettes[d.visuals.selectedPaletteIndex || 0];
  let xOffset = margin;
  palette.colors.forEach((c) => {
      doc.setFillColor(c);
      doc.rect(xOffset, y, 30, 30, 'F');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(c, xOffset, y + 36);
      xOffset += 35;
  });
  y += 50;

  addText("Typography", 14, 'bold');
  addText(`Logo Font: ${d.visuals.fonts.logo}`, 11);
  addText(`Heading Font: ${d.visuals.fonts.heading}`, 11);
  addText(`Body Font: ${d.visuals.fonts.body}`, 11);
  
  y += 10;
  addText("Marketing Content", 14, 'bold');
  addText(d.marketing.shortDescription, 11);

  doc.save(`${project.name.replace(/\s+/g, '_')}_BrandKit.pdf`);
};

// --- Components ---

const AuthScreen: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    const users: User[] = JSON.parse(localStorage.getItem('bf_users') || '[]');
    const hashedPassword = simpleHash(password);

    if (isLogin) {
      const user = users.find(u => u.email === email && u.passwordHash === hashedPassword);
      if (user) {
        localStorage.setItem('bf_session', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Invalid credentials or account does not exist.');
      }
    } else {
      if (users.find(u => u.email === email)) {
        setError('User already exists. Please login.');
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: name || email.split('@')[0],
        passwordHash: hashedPassword
      };
      users.push(newUser);
      localStorage.setItem('bf_users', JSON.stringify(users));
      localStorage.setItem('bf_session', JSON.stringify(newUser));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background p-4">
      <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary mb-4 shadow-lg shadow-indigo-200">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-brand-text-heading">
            BrandForge AI
          </h1>
          <p className="text-brand-text-muted mt-2">Craft your identity.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <Input 
              label="Full Name" 
              placeholder="John Doe" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required={!isLogin}
            />
          )}
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="john@example.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
          />
          {!isLogin && (
              <Input 
                label="Confirm Password" 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required 
              />
          )}
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full py-3 text-lg shadow-lg">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-brand-text-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-brand-primary font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </Card>
    </div>
  );
};

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      const saved = sessionStorage.getItem('bf_chat_session');
      if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
      if (messages.length > 0) {
        sessionStorage.setItem('bf_chat_session', JSON.stringify(messages));
      }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));
        const response = await getChatResponse(history, userMsg.text);
        setMessages(prev => [...prev, { role: 'model', text: response || "I'm here to help.", timestamp: Date.now() }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I can't connect right now.", timestamp: Date.now() }]);
    } finally {
        setIsLoading(false);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-brand-primary rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}
      
      {isOpen && (
        <div className="w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="font-bold">Granite Consultant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
             {messages.length === 0 && (
                 <div className="text-center text-slate-400 text-sm mt-10">
                     <p>Tell me about your business idea.</p>
                     <p>I'll help you refine it for better branding.</p>
                 </div>
             )}
             {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                         {m.text}
                     </div>
                 </div>
             ))}
             {isLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
             <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t bg-white">
              <div className="flex items-end gap-2">
                  <textarea 
                    ref={textareaRef}
                    className="flex-1 text-sm bg-slate-100 rounded-lg px-3 py-2 outline-none resize-none max-h-32"
                    placeholder="Ask for advice..."
                    value={input}
                    rows={1}
                    onChange={handleInput}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                  />
                  <button onClick={sendMessage} disabled={isLoading} className="p-2 mb-0.5 bg-brand-primary text-white rounded-lg">
                      <MessageSquare className="w-4 h-4" />
                  </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectEditor: React.FC<{
  project: BrandProject,
  onUpdate: (p: BrandProject) => void,
  onBack: () => void
}> = ({ project, onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'story' | 'visuals' | 'marketing'>('overview');
  const [data, setData] = useState<BrandGeneratedData | undefined>(project.generatedData);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [fileRef, setFileRef] = useState<string | undefined>(undefined);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(project.generatedData)) {
      onUpdate({ ...project, generatedData: data });
    }
  }, [data]);

  const handleGenerateLogo = async () => {
    if (!data?.visuals.logoPrompt) return;
    setIsGeneratingLogo(true);
    try {
      const url = await generateLogoWithStability(data.visuals.logoPrompt, "professional");
      setData(prev => prev ? ({
        ...prev,
        visuals: { ...prev.visuals, logoIconUrl: url }
      }) : undefined);
    } catch (e) {
      alert("Failed to generate logo. Please try again.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => {
             setFileRef(reader.result as string);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  if (!data) return <div>Loading data...</div>;

  const currentPalette = data.visuals.palettes[data.visuals.selectedPaletteIndex || 0];
  const logoSettings = data.visuals.logoSettings || {
      bgColor: 'transparent',
      shape: 'none',
      width: 400,
      height: 400,
      borderRadius: 0,
      iconColor: currentPalette.colors[0],
      iconSize: 150,
      tintIcon: false,
      textElements: []
  };

  const updateLogoSettings = (newSettings: any) => {
      setData({ ...data, visuals: { ...data.visuals, logoSettings: { ...logoSettings, ...newSettings } } });
  };

  const addTextElement = () => {
      const newText: TextLayer = {
          id: Date.now().toString(),
          text: project.name || "Brand Name",
          x: logoSettings.width / 2,
          y: logoSettings.height / 2 + 80,
          fontSize: 32,
          fontFamily: data.visuals.fonts.logo || 'Montserrat',
          color: currentPalette.colors[0],
          spacing: 0,
          rotation: 0,
          fontWeight: 'bold',
          align: 'center'
      };
      updateLogoSettings({ textElements: [...logoSettings.textElements, newText] });
      setSelectedElementId(newText.id);
  };

  const updateSelectedText = (updates: Partial<TextLayer>) => {
      if (!selectedElementId) return;
      const updatedElements = logoSettings.textElements.map(el => 
          el.id === selectedElementId ? { ...el, ...updates } : el
      );
      updateLogoSettings({ textElements: updatedElements });
  };

  const deleteSelectedText = () => {
      if (!selectedElementId) return;
      const updatedElements = logoSettings.textElements.filter(el => el.id !== selectedElementId);
      updateLogoSettings({ textElements: updatedElements });
      setSelectedElementId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSelectedElementId(id);
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current || !selectedElementId) return;
      
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      const element = logoSettings.textElements.find(el => el.id === selectedElementId);
      if (element) {
          updateSelectedText({ x: element.x + dx, y: element.y + dy });
      }
      
      dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      isDragging.current = false;
  };

  const activeTextElement = logoSettings.textElements.find(el => el.id === selectedElementId);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-background">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <button onClick={onBack} className="flex items-center text-sm text-brand-text-muted hover:text-brand-primary mb-4 transition-colors">
            ← Back to Dashboard
          </button>
          <h1 className="font-bold text-xl text-brand-text-heading break-words">{project.name}</h1>
          <p className="text-xs text-brand-text-muted mt-1">{project.industry}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'story', icon: FileText, label: 'Brand Story' },
            { id: 'visuals', icon: Palette, label: 'Visual Identity' },
            { id: 'marketing', icon: Share2, label: 'Marketing' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-brand-primary shadow-sm' 
                  : 'text-brand-text-body hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-3 ${activeTab === item.id ? 'text-brand-primary' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
            <Button variant="secondary" className="w-full justify-start text-sm" onClick={() => exportToPDF(project)}>
                <Download className="w-4 h-4 mr-2" /> PDF Brand Kit
            </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Brand Names" className="md:col-span-2">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.names.map((nObj, i) => (
                            <li key={i} className="flex flex-col p-5 bg-white border border-slate-100 rounded-xl group hover:shadow-md transition-all relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xl font-bold ${nObj.name === project.name ? "text-brand-primary" : "text-brand-text-heading"}`} style={{ fontFamily: data.visuals.fonts.logo }}>{nObj.name}</span>
                                    {nObj.name !== project.name && (
                                        <button 
                                            onClick={() => onUpdate({...project, name: nObj.name})}
                                            className="text-xs font-medium text-brand-primary opacity-0 group-hover:opacity-100 hover:underline bg-indigo-50 px-2 py-1 rounded"
                                        >
                                            Select
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-brand-text-body italic mb-3">"{nObj.meaning}"</p>
                                
                                {nObj.taglines && nObj.taglines.length > 0 && (
                                    <div className="mt-auto pt-3 border-t border-slate-50">
                                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Taglines</p>
                                        <ul className="space-y-1">
                                            {nObj.taglines.map((t, idx) => (
                                                <li key={idx} className="text-xs text-slate-600 flex items-center">
                                                    <span className="w-1 h-1 rounded-full bg-indigo-400 mr-2"></span>{t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
          </div>
        )}

        {/* Story Tab */}
        {activeTab === 'story' && (
            <div className="max-w-4xl mx-auto space-y-6">
                <Card title="Vision & Mission">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-brand-primary uppercase tracking-wider">Vision</label>
                            <TextArea 
                                value={data.story.vision} 
                                onChange={e => setData({...data, story: {...data.story, vision: e.target.value}})}
                                className="mt-1 min-h-[80px]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-brand-primary uppercase tracking-wider">Mission</label>
                            <TextArea 
                                value={data.story.mission} 
                                onChange={e => setData({...data, story: {...data.story, mission: e.target.value}})}
                                className="mt-1 min-h-[80px]"
                            />
                        </div>
                    </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="The Problem">
                        <TextArea 
                            value={data.story.problem} 
                            onChange={e => setData({...data, story: {...data.story, problem: e.target.value}})}
                            className="min-h-[150px] bg-red-50/50 border-red-100 focus:ring-red-200"
                        />
                    </Card>
                    <Card title="Our Solution">
                        <TextArea 
                            value={data.story.solution} 
                            onChange={e => setData({...data, story: {...data.story, solution: e.target.value}})}
                            className="min-h-[150px] bg-green-50/50 border-green-100 focus:ring-green-200"
                        />
                    </Card>
                </div>
            </div>
        )}

        {/* Visuals Tab */}
        {activeTab === 'visuals' && (
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Palette Selector */}
                <Card title="Logo Composer" className="overflow-hidden">
                    {/* Fixed Suggestion Bar */}
                     <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm flex justify-between items-center">
                        <span className="text-indigo-700 font-medium"><Sparkles className="w-4 h-4 inline mr-2"/>AI Suggestion:</span>
                        <span className="italic text-indigo-600 truncate flex-1 ml-2">{data.visuals.logoPrompt}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Canvas Area */}
                        <div className="flex-1 flex flex-col">
                             <div 
                                className="flex-1 bg-slate-100 rounded-xl border border-slate-200 min-h-[500px] relative pattern-grid overflow-hidden flex items-center justify-center cursor-default select-none"
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onClick={() => setSelectedElementId(null)}
                             >
                                <div 
                                    className="relative transition-all duration-300 shadow-xl overflow-hidden"
                                    style={{
                                        width: `${logoSettings.width}px`,
                                        height: `${logoSettings.height}px`,
                                        backgroundColor: logoSettings.bgColor,
                                        borderRadius: logoSettings.shape === 'circle' ? '50%' : 
                                                      logoSettings.shape === 'oval' ? '50%' :
                                                      logoSettings.shape === 'rounded' ? '40px' : 
                                                      logoSettings.shape === 'square' || logoSettings.shape === 'rectangle' ? '0px' : `${logoSettings.borderRadius}px`,
                                        clipPath: logoSettings.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                                                  logoSettings.shape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : 'none',
                                    }}
                                >
                                    {/* Icon Layer */}
                                    <div 
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                                        style={{
                                            width: `${logoSettings.iconSize}px`,
                                            height: `${logoSettings.iconSize}px`,
                                        }}
                                    >
                                         {data.visuals.logoIconUrl ? (
                                            <div className="w-full h-full relative">
                                                <img 
                                                    src={data.visuals.logoIconUrl} 
                                                    alt="Logo Icon" 
                                                    className="w-full h-full object-contain"
                                                    style={{
                                                        filter: logoSettings.tintIcon ? 'grayscale(100%) brightness(0)' : 'none',
                                                        opacity: logoSettings.tintIcon ? 0 : 1
                                                    }}
                                                />
                                                {logoSettings.tintIcon && (
                                                     <div 
                                                        className="absolute inset-0 w-full h-full"
                                                        style={{
                                                            backgroundColor: logoSettings.iconColor,
                                                            maskImage: `url(${data.visuals.logoIconUrl})`,
                                                            WebkitMaskImage: `url(${data.visuals.logoIconUrl})`,
                                                            maskSize: 'contain',
                                                            WebkitMaskSize: 'contain',
                                                            maskRepeat: 'no-repeat',
                                                            maskPosition: 'center',
                                                            WebkitMaskPosition: 'center',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                         ) : (
                                             <div className="w-full h-full bg-slate-200/50 rounded-full flex items-center justify-center">
                                                 <ImageIcon className="text-slate-400" />
                                             </div>
                                         )}
                                    </div>

                                    {/* Text Layers */}
                                    {logoSettings.textElements.map(el => (
                                        <div
                                            key={el.id}
                                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                                            className={`absolute cursor-move border-2 ${selectedElementId === el.id ? 'border-indigo-500' : 'border-transparent'} hover:border-indigo-300 p-2 rounded`}
                                            style={{
                                                left: el.x,
                                                top: el.y,
                                                transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                                fontFamily: el.fontFamily,
                                                fontSize: `${el.fontSize}px`,
                                                color: el.color,
                                                letterSpacing: `${el.spacing}px`,
                                                fontWeight: el.fontWeight,
                                                textAlign: el.align,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {el.text}
                                            {selectedElementId === el.id && (
                                                <div className="absolute -top-3 -right-3 w-6 h-6 bg-white border border-indigo-500 rounded-full flex items-center justify-center cursor-pointer shadow-sm">
                                                    <RotateCw className="w-3 h-3 text-indigo-500" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             </div>
                             
                             {/* Generation Bar at Bottom */}
                             <div className="mt-4 flex gap-2">
                                <div className="flex-1 relative">
                                    <input 
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                                        placeholder="Describe your logo idea..."
                                        value={data.visuals.logoPrompt}
                                        onChange={e => setData({...data, visuals: {...data.visuals, logoPrompt: e.target.value}})}
                                    />
                                    <label className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-md cursor-pointer transition-colors text-slate-500">
                                        <Upload className="w-4 h-4" />
                                        <input type="file" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>
                                <Button onClick={handleGenerateLogo} isLoading={isGeneratingLogo}>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Generate
                                </Button>
                             </div>
                             {fileRef && <div className="text-xs text-green-600 mt-1 flex items-center"><Check className="w-3 h-3 mr-1"/> Reference Image Attached</div>}
                        </div>

                        {/* Controls Panel */}
                        <div className="w-full lg:w-80 space-y-6 max-h-[700px] overflow-y-auto pr-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            
                            {/* Layer Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="secondary" onClick={addTextElement} className="text-xs">
                                    <Plus className="w-3 h-3 mr-1"/> Add Text
                                </Button>
                                {selectedElementId && (
                                    <Button variant="danger" onClick={deleteSelectedText} className="text-xs">
                                        <Trash2 className="w-3 h-3 mr-1"/> Delete
                                    </Button>
                                )}
                            </div>

                            <hr className="border-slate-200"/>

                            {activeTextElement ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><Type className="w-4 h-4"/> Text Editor</h4>
                                        <button onClick={() => setSelectedElementId(null)} className="text-xs text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                                    </div>
                                    <Input 
                                        value={activeTextElement.text}
                                        onChange={(e) => updateSelectedText({ text: e.target.value })}
                                        placeholder="Enter text..."
                                    />
                                    <Select 
                                        label="Font Family"
                                        options={FONT_OPTIONS}
                                        value={activeTextElement.fontFamily}
                                        onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <ColorInput 
                                            label="Color"
                                            value={activeTextElement.color}
                                            onChange={(e) => updateSelectedText({ color: e.target.value })}
                                        />
                                        <div className="flex-1 flex items-end gap-1 pb-1">
                                            <button onClick={() => updateSelectedText({ align: 'left' })} className={`p-2 rounded ${activeTextElement.align === 'left' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border'}`}><AlignLeft className="w-4 h-4"/></button>
                                            <button onClick={() => updateSelectedText({ align: 'center' })} className={`p-2 rounded ${activeTextElement.align === 'center' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border'}`}><AlignCenter className="w-4 h-4"/></button>
                                            <button onClick={() => updateSelectedText({ align: 'right' })} className={`p-2 rounded ${activeTextElement.align === 'right' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border'}`}><AlignRight className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Size ({activeTextElement.fontSize}px)</label>
                                        <input type="range" min="10" max="200" value={activeTextElement.fontSize} onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })} className="w-full"/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Spacing</label>
                                        <input type="range" min="-5" max="50" value={activeTextElement.spacing} onChange={(e) => updateSelectedText({ spacing: Number(e.target.value) })} className="w-full"/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Rotation ({activeTextElement.rotation}°)</label>
                                        <input type="range" min="0" max="360" value={activeTextElement.rotation} onChange={(e) => updateSelectedText({ rotation: Number(e.target.value) })} className="w-full"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Box className="w-4 h-4"/> Shape & Background</h4>
                                    
                                    <div className="grid grid-cols-4 gap-2">
                                         {['none', 'square', 'rounded', 'circle', 'triangle', 'hexagon', 'rectangle', 'oval'].map(s => (
                                             <button 
                                                key={s}
                                                onClick={() => {
                                                    let updates: any = { shape: s };
                                                    if (s === 'rectangle') { updates.width = 500; updates.height = 300; }
                                                    else if (s === 'oval') { updates.width = 500; updates.height = 300; }
                                                    else { updates.width = 400; updates.height = 400; }
                                                    updateLogoSettings(updates);
                                                }}
                                                className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 text-[8px] uppercase ${logoSettings.shape === s ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-slate-200'}`}
                                                title={s}
                                             >
                                                 {s === 'none' && <Maximize className="w-4 h-4"/>}
                                                 {s === 'square' && <Square className="w-4 h-4"/>}
                                                 {s === 'circle' && <CircleIcon className="w-4 h-4"/>}
                                                 {s === 'rounded' && <div className="w-4 h-4 rounded-md border border-current"/>}
                                                 {s === 'rectangle' && <div className="w-5 h-3 border border-current"/>}
                                                 {s === 'oval' && <div className="w-5 h-3 rounded-full border border-current"/>}
                                                 {s === 'triangle' && <Triangle className="w-4 h-4"/>}
                                                 {s === 'hexagon' && <Hexagon className="w-4 h-4"/>}
                                             </button>
                                         ))}
                                     </div>

                                     <ColorInput 
                                        label="Background Color"
                                        value={logoSettings.bgColor === 'transparent' ? '#ffffff' : logoSettings.bgColor}
                                        onChange={(e) => updateLogoSettings({ bgColor: e.target.value })}
                                    />
                                    <Button variant="secondary" onClick={() => updateLogoSettings({ bgColor: 'transparent' })} className="w-full text-xs">Clear Background</Button>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Width ({logoSettings.width}px)</label>
                                        <input type="range" min="100" max="600" value={logoSettings.width} onChange={(e) => updateLogoSettings({ width: Number(e.target.value) })} className="w-full"/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Height ({logoSettings.height}px)</label>
                                        <input type="range" min="100" max="600" value={logoSettings.height} onChange={(e) => updateLogoSettings({ height: Number(e.target.value) })} className="w-full"/>
                                    </div>
                                    {logoSettings.shape === 'rounded' && (
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Corner Radius</label>
                                            <input type="range" min="0" max="200" value={logoSettings.borderRadius} onChange={(e) => updateLogoSettings({ borderRadius: Number(e.target.value) })} className="w-full"/>
                                        </div>
                                    )}

                                    <hr className="border-slate-200 my-4"/>
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Icon Settings</h4>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Icon Size</label>
                                        <input type="range" min="50" max="400" value={logoSettings.iconSize} onChange={(e) => updateLogoSettings({ iconSize: Number(e.target.value) })} className="w-full"/>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-slate-500">Tint Icon</span>
                                            <input type="checkbox" checked={logoSettings.tintIcon} onChange={(e) => updateLogoSettings({ tintIcon: e.target.checked })}/>
                                        </div>
                                        {logoSettings.tintIcon && (
                                            <ColorInput label="Icon Color" value={logoSettings.iconColor} onChange={(e) => updateLogoSettings({ iconColor: e.target.value })}/>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* Marketing Tab */}
        {activeTab === 'marketing' && (
            <div className="max-w-4xl mx-auto space-y-6">
                <Card title="Descriptions">
                    <div className="space-y-4">
                        <TextArea 
                            label="Short Description"
                            value={data.marketing.shortDescription} 
                            onChange={e => setData({...data, marketing: {...data.marketing, shortDescription: e.target.value}})}
                        />
                         <TextArea 
                            label="Long Description"
                            value={data.marketing.longDescription} 
                            onChange={e => setData({...data, marketing: {...data.marketing, longDescription: e.target.value}})}
                            className="min-h-[150px]"
                        />
                    </div>
                </Card>
                <Card title="Social Media Hooks">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white shadow-md">
                            <div className="flex items-center gap-2 mb-2 font-bold"><Instagram className="w-4 h-4"/> Instagram Bio</div>
                            <p className="text-sm font-medium">{data.marketing.socialTaglines?.instagram || "Generating..."}</p>
                        </div>
                        <div className="p-4 bg-blue-600 rounded-xl text-white shadow-md">
                            <div className="flex items-center gap-2 mb-2 font-bold"><Facebook className="w-4 h-4"/> Facebook Intro</div>
                            <p className="text-sm font-medium">{data.marketing.socialTaglines?.facebook || "Generating..."}</p>
                        </div>
                        <div className="p-4 bg-blue-700 rounded-xl text-white shadow-md">
                            <div className="flex items-center gap-2 mb-2 font-bold"><Linkedin className="w-4 h-4"/> LinkedIn Headline</div>
                            <p className="text-sm font-medium">{data.marketing.socialTaglines?.linkedin || "Generating..."}</p>
                        </div>
                        <div className="p-4 bg-black rounded-xl text-white shadow-md">
                            <div className="flex items-center gap-2 mb-2 font-bold"><Twitter className="w-4 h-4"/> X (Twitter) Bio</div>
                            <p className="text-sm font-medium">{data.marketing.socialTaglines?.twitter || "Generating..."}</p>
                        </div>
                    </div>
                </Card>
                <Card title="Email Copy">
                     <TextArea 
                        value={data.marketing.emailCopy} 
                        onChange={e => setData({...data, marketing: {...data.marketing, emailCopy: e.target.value}})}
                        className="min-h-[300px] font-mono text-sm"
                    />
                </Card>
                <Card title="Social Media Captions">
                     <div className="space-y-3">
                         {data.marketing.socialCaptions.map((cap, i) => (
                             <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-brand-text-body">
                                 {cap}
                             </div>
                         ))}
                     </div>
                </Card>
            </div>
        )}
      </div>
      <ChatWidget />
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [view, setView] = useState<'dashboard' | 'new' | 'editor'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<BrandProject | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // New Project State
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load initial data
  useEffect(() => {
    const session = localStorage.getItem('bf_session');
    if (session) setUser(JSON.parse(session));
    
    const savedProjects = localStorage.getItem('bf_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
  }, []);

  // Save projects on change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('bf_projects', JSON.stringify(projects));
    }
  }, [projects]);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support speech recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev + ' ' + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleNewProject = () => {
      setIndustry('');
      setDescription('');
      setTone('Professional');
      setLanguage('English');
      setView('new');
  };

  const createProject = async () => {
    if (!industry || !description) return;
    setIsGenerating(true);
    try {
      const data = await generateBrandIdentity(industry, description, tone, language);
      const newProject: BrandProject = {
        id: Date.now().toString(),
        name: data.names[0].name, 
        industry,
        description,
        tone,
        language,
        generatedData: data,
        createdAt: Date.now()
      };
      setProjects([newProject, ...projects]);
      setSelectedProject(newProject);
      setView('editor');
    } catch (e) {
      alert("Failed to generate brand identity. Please check API Key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateProject = (updated: BrandProject) => {
    const updatedProjects = projects.map(p => p.id === updated.id ? updated : p);
    setProjects(updatedProjects);
    setSelectedProject(updated);
  };

  const deleteProject = (id: string) => {
      if(confirm("Are you sure you want to delete this project?")) {
        setProjects(projects.filter(p => p.id !== id));
      }
  };

  // --- Render Logic ---

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (view === 'editor' && selectedProject) {
    return (
      <ProjectEditor 
        project={selectedProject} 
        onUpdate={updateProject} 
        onBack={() => setView('dashboard')} 
      />
    );
  }

  if (view === 'new') {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-brand-text-heading">New Brand Project</h2>
            <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-600">
                <LogOut className="w-5 h-5 rotate-180" />
            </button>
          </div>
          
          <div className="space-y-6">
            <Input 
              label="Industry / Niche" 
              placeholder="e.g. Sustainable Fashion, SaaS, Coffee Shop" 
              value={industry}
              onChange={e => setIndustry(e.target.value)}
            />
            
            <div className="relative">
              <TextArea 
                label="Brand Description & Keywords" 
                placeholder="Describe your vision, target audience, and key values..."
                className="min-h-[120px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <button 
                onClick={handleVoiceInput}
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                  isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Select 
                 label="Brand Tone" 
                 options={[
                   {value: 'Professional', label: 'Professional'},
                   {value: 'Playful', label: 'Playful'},
                   {value: 'Luxury', label: 'Luxury'},
                   {value: 'Minimalist', label: 'Minimalist'},
                   {value: 'Bold', label: 'Bold'},
                   {value: 'Friendly', label: 'Friendly'},
                   {value: 'Futuristic', label: 'Futuristic'},
                   {value: 'Earthy', label: 'Earthy'},
                 ]}
                 value={tone}
                 onChange={e => setTone(e.target.value)}
               />
               <Select 
                 label="Language" 
                 options={LANGUAGES}
                 value={language}
                 onChange={e => setLanguage(e.target.value)}
               />
            </div>

            <Button 
                onClick={createProject} 
                isLoading={isGenerating} 
                className="w-full py-4 text-lg shadow-xl shadow-indigo-200"
                disabled={!industry || !description}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Brand Identity
            </Button>
          </div>
        </Card>
        <ChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background relative">
       <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
           <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
               <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                       <Sparkles className="w-5 h-5 text-white" />
                   </div>
                   <span className="font-bold text-xl text-brand-text-heading">BrandForge AI</span>
               </div>
               <div className="relative">
                   <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                   >
                       <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-brand-primary">
                           <UserIcon className="w-4 h-4" />
                       </div>
                       <span className="text-sm font-medium text-brand-text-heading hidden sm:block">{user.name}</span>
                   </button>
                   
                   {isProfileOpen && (
                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2">
                           <div className="px-4 py-3 border-b border-slate-50">
                               <p className="text-sm font-medium text-brand-text-heading">{user.name}</p>
                               <p className="text-xs text-brand-text-muted truncate">{user.email}</p>
                           </div>
                           <button 
                                onClick={() => { localStorage.removeItem('bf_session'); sessionStorage.removeItem('bf_chat_session'); setUser(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                           >
                               <LogOut className="w-4 h-4" /> Sign Out
                           </button>
                       </div>
                   )}
               </div>
           </div>
       </nav>
       <Dashboard 
         user={user} 
         projects={projects} 
         onNew={handleNewProject} 
         onSelect={(p) => { setSelectedProject(p); setView('editor'); }}
         onDelete={deleteProject}
         onRename={(id, name) => setProjects(projects.map(p => p.id === id ? { ...p, name } : p))}
       />
       <ChatWidget />
    </div>
  );
}

const Dashboard: React.FC<{
  user: User;
  projects: BrandProject[];
  onNew: () => void;
  onSelect: (p: BrandProject) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}> = ({ user, projects, onNew, onSelect, onDelete, onRename }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.industry.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        if (sortBy === 'date') return b.createdAt - a.createdAt;
        return a.name.localeCompare(b.name);
    });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8" onClick={() => setContextMenu(null)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-heading">Welcome back, {user.name}</h1>
          <p className="text-brand-text-muted">Manage your brand identities</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none w-64"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
            >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
            </select>
            <Button onClick={onNew}>
                <Plus className="w-5 h-5 mr-2" />
                New Project
            </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <LayoutDashboard className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-brand-text-heading">No projects yet</h3>
          <p className="text-brand-text-muted mb-6">Start building your first brand identity today.</p>
          <Button onClick={onNew} variant="primary">Create Brand</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow group relative">
              <div className="absolute top-4 right-4 z-10">
                 <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setContextMenu(contextMenu === project.id ? null : project.id); 
                    }} 
                    className="p-2 text-slate-400 hover:text-brand-primary bg-white rounded-full shadow-sm border border-slate-100"
                 >
                    <MoreVertical className="w-4 h-4" />
                 </button>
                 {contextMenu === project.id && (
                     <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
                         <button 
                             className="w-full text-left px-4 py-2 text-sm text-brand-text-body hover:bg-slate-50 flex items-center gap-2"
                             onClick={(e) => {
                                 e.stopPropagation();
                                 const newName = prompt("Enter new name:", project.name);
                                 if (newName) onRename(project.id, newName);
                                 setContextMenu(null);
                             }}
                         >
                             <Edit2 className="w-4 h-4" /> Rename
                         </button>
                         <button 
                             className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                             onClick={(e) => {
                                 e.stopPropagation();
                                 onDelete(project.id);
                             }}
                         >
                             <Trash2 className="w-4 h-4" /> Delete
                         </button>
                     </div>
                 )}
              </div>
              <div onClick={() => onSelect(project)} className="cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-primary font-bold text-lg shrink-0">
                        {project.name.charAt(0)}
                    </div>
                    <div className="min-w-0 pr-8">
                        <h3 className="font-semibold text-brand-text-heading truncate">{project.name}</h3>
                        <span className="text-xs text-brand-text-muted bg-slate-100 px-2 py-0.5 rounded-full inline-block truncate max-w-full">{project.industry}</span>
                    </div>
                </div>
                <p className="text-sm text-brand-text-body line-clamp-3 mb-4 flex-1">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-brand-text-muted pt-4 border-t border-slate-50 mt-auto">
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    <span>{project.tone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;