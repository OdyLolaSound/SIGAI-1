
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Camera, Upload, Send, Loader2, CheckCircle2, AlertCircle, ChevronRight, X, ShieldAlert, Wrench, ArrowLeft, Bot, User as UserIcon } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { User, RequestCategory, UrgencyLevel, RequestItem } from '../types';
import { storageService } from '../services/storageService';

interface AIRequestFlowProps {
  user: User;
  onClose: () => void;
  onComplete: () => void;
}

type FlowStep = 'INPUT' | 'ANALYZING' | 'AI_SUGGESTION' | 'FINAL_CONFIRM';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIRequestFlow: React.FC<AIRequestFlowProps> = ({ user, onClose, onComplete }) => {
  const [step, setStep] = useState<FlowStep>('INPUT');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // AI Results
  const [aiAnalysis, setAiAnalysis] = useState<{
    category: RequestCategory;
    urgency: UrgencyLevel;
    explanation: string;
    steps: string[];
  } | null>(null);

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = newMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `Eres un asistente técnico experto en mantenimiento de la USAC. 
          Tu trato es educado, cercano y profesional. Ayudas al usuario a solucionar problemas técnicos de forma clara y detallada.
          
          REGLAS DE FORMATO:
          1. Usa Markdown para que la respuesta sea legible.
          2. Usa negritas (**texto**) para resaltar puntos clave.
          3. Usa listas con viñetas o numeradas para pasos.
          4. Deja espacios (líneas en blanco) entre párrafos para que no se vea todo agrupado.
          5. No uses lenguaje militar. Sé un profesional de mantenimiento amable.
          
          El usuario ya tiene un diagnóstico inicial y ahora busca detalles específicos.`
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      setChatMessages([...newMessages, { role: 'assistant', content: response.text }]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages([...newMessages, { role: 'assistant', content: "Lo siento, he tenido un problema de conexión. ¿Puedes repetir?" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startAIAnalysis = async () => {
    if (!description.trim()) return alert("Por favor, describe el problema.");
    
    setStep('ANALYZING');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: `Actúa como un experto técnico de mantenimiento profesional y educado. Analiza esta incidencia: "${description}".` }];
      
      if (image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: image.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [
          ...parts,
          { text: "Clasifica la categoría (Eléctrico, Fontanería, Calderas / Climatización, Carpintería / Cerraduras, Mobiliario, Informática, Otros), nivel de urgencia (Baja, Media, Alta, Crítica) y da una solución paso a paso si es posible que el usuario lo arregle solo. Devuelve JSON." }
        ]},
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              urgency: { type: Type.STRING },
              explanation: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["category", "urgency", "explanation", "steps"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setAiAnalysis(result);
      setStep('AI_SUGGESTION');
    } catch (error) {
      console.error("AI Error:", error);
      alert("Error al conectar con el asistente técnico. Intentando modo manual.");
      setStep('FINAL_CONFIRM');
    } finally {
      setLoading(false);
    }
  };

  const createFormalRequest = (resolvedByAi: boolean = false) => {
    const newItem: RequestItem = {
      id: crypto.randomUUID(),
      userId: user.id,
      unit: user.role,
      type: 'peticion',
      category: aiAnalysis?.category || 'Otros',
      urgency: aiAnalysis?.urgency || 'Media',
      title: description.substring(0, 30) + '...',
      description: description,
      status: resolvedByAi ? 'resolved_by_ai' : 'open',
      date: new Date().toISOString(),
      imageUrl: image || undefined,
      aiExplanation: aiAnalysis?.explanation,
      aiSteps: aiAnalysis?.steps
    };

    storageService.saveRequest(newItem);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      {/* Header Asistente */}
      <header className="p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-white font-black uppercase tracking-tighter text-lg leading-none">Asistente SIGAI</h2>
            <p className="text-yellow-400/60 text-[8px] font-black uppercase tracking-widest mt-1">Soporte Técnico con IA</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90"
          title="Cerrar Asistente"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-sm space-y-8">
          
          {step === 'INPUT' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-5">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">¿Cuál es el problema?</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Hay una fuga de agua en el baño del bloque A..."
                  className="w-full bg-transparent text-white text-lg font-bold outline-none resize-none h-32 placeholder:text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white hover:bg-white/10 transition-all group">
                  <Camera className="w-6 h-6 mb-2 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase">Cámara</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white hover:bg-white/10 transition-all group">
                  <Upload className="w-6 h-6 mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase">Archivo</span>
                </button>
              </div>

              {image && (
                <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl">
                  <img src={image} className="w-full h-full object-cover" />
                  <button onClick={() => setImage(null)} className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={startAIAnalysis}
                  className="w-full p-6 bg-yellow-400 text-black rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
                >
                  Analizar con IA <ChevronRight className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={onClose}
                  className="w-full p-4 text-gray-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Cancelar y Volver
                </button>
              </div>
            </div>
          )}

          {step === 'ANALYZING' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-yellow-400/20 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center relative z-10 shadow-2xl border border-white/10">
                  <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-white text-xl font-black uppercase tracking-tighter">Consultando Experto...</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Clasificando incidencia y urgencia</p>
              </div>
            </div>
          )}

          {step === 'AI_SUGGESTION' && aiAnalysis && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500 pb-10">
              {!showChat ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 bg-yellow-400 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-black">
                        <ShieldAlert className="w-6 h-6" />
                        <span className="font-black uppercase text-xs tracking-tighter">Diagnóstico Final</span>
                      </div>
                      <div className="px-3 py-1 bg-black text-white rounded-full text-[8px] font-black uppercase">
                        {aiAnalysis.urgency}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-white text-sm font-bold leading-relaxed">{aiAnalysis.explanation}</p>
                      
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Pasos sugeridos:</p>
                        {aiAnalysis.steps.map((step, i) => (
                          <div key={i} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="w-6 h-6 bg-yellow-400/10 text-yellow-400 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                            <p className="text-gray-300 text-[11px] font-medium leading-snug">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowChat(true)}
                      className="w-full p-6 bg-blue-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-5 h-5" /> Necesito más ayuda / Chat
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => createFormalRequest(true)}
                        className="p-5 bg-green-500 text-white rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Solucionado
                      </button>
                      <button 
                        onClick={() => setStep('FINAL_CONFIRM')}
                        className="p-5 bg-white/10 text-white rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <AlertCircle className="w-4 h-4" /> No puedo
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setStep('INPUT')}
                      className="w-full p-2 text-gray-500 font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-3 h-3" /> Corregir descripción
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 flex flex-col h-[78vh] animate-in slide-in-from-right-5 duration-500">
                  {/* Chat Header Info */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-blue-400 text-[10px] font-black uppercase leading-none">Asistente Técnico</p>
                      <p className="text-blue-400/60 text-[8px] font-bold uppercase tracking-widest mt-1">En línea • Soporte Educado</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                    <div className="bg-yellow-400/5 border border-yellow-400/10 p-5 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400/30"></div>
                      <p className="text-yellow-400 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> Diagnóstico Inicial:
                      </p>
                      <p className="text-gray-400 text-[11px] leading-relaxed font-medium italic">"{aiAnalysis.explanation}"</p>
                    </div>

                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                        <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-white/10'
                          }`}>
                            {msg.role === 'user' ? <UserIcon className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-yellow-400" />}
                          </div>
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                            {msg.role === 'user' ? 'Tú' : 'Asistente'}
                          </span>
                        </div>
                        
                        <div className={`max-w-[90%] p-5 rounded-3xl text-[12px] leading-relaxed shadow-2xl ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none' 
                            : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/10 backdrop-blur-sm'
                        }`}>
                          <div className="markdown-body prose prose-invert prose-sm max-w-none">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {chatLoading && (
                      <div className="flex flex-col items-start gap-2 animate-pulse">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-yellow-400" />
                          </div>
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Asistente</span>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl rounded-tl-none border border-white/10 flex gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input & Actions Area - Pushed to bottom */}
                  <div className="mt-auto space-y-4 bg-gray-900/50 pt-4 border-t border-white/5">
                    <div className="relative group">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe tu duda técnica aquí..."
                        className="w-full bg-white/5 border border-white/10 p-5 pr-16 rounded-[2rem] text-white text-xs font-bold outline-none focus:border-yellow-400 focus:bg-white/10 transition-all placeholder:text-gray-600"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || chatLoading}
                        className="absolute right-2 top-2 bottom-2 w-12 bg-yellow-400 text-black rounded-2xl flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <button 
                        onClick={() => createFormalRequest(true)}
                        className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Solucionado
                      </button>
                      <button 
                        onClick={() => setStep('FINAL_CONFIRM')}
                        className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                      >
                        <AlertCircle className="w-3 h-3" /> No puedo
                      </button>
                    </div>

                    <button 
                      onClick={() => setShowChat(false)}
                      className="w-full py-2 text-gray-600 font-black uppercase text-[8px] tracking-[0.2em] flex items-center justify-center gap-2 hover:text-gray-400 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" /> Volver al diagnóstico
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'FINAL_CONFIRM' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-5">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <Wrench className="w-10 h-10" />
                </div>
                <h3 className="text-white text-2xl font-black uppercase tracking-tight">Crear Petición Oficial</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">Se notificará al equipo técnico USAC</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Categoría</span>
                  <span className="text-white font-black uppercase text-[10px]">{aiAnalysis?.category || 'General'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Urgencia</span>
                  <span className="text-red-400 font-black uppercase text-[10px]">{aiAnalysis?.urgency || 'Media'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Unidad</span>
                  <span className="text-white font-black uppercase text-[10px]">{user.role}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => createFormalRequest(false)}
                  className="w-full p-7 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
                >
                  Confirmar y Enviar Parte
                </button>
                <button 
                  onClick={() => setStep('AI_SUGGESTION')}
                  className="w-full p-4 text-gray-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver atrás
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Hidden Inputs */}
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input type="file" ref={fileInputRef} accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

export default AIRequestFlow;
