
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, X, Loader2, Keyboard, Droplets, Zap, Flame, Upload, Globe, Thermometer, Gauge, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { extractReadingsForService, parseEuropeanNumber } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Reading, ServiceType, Building, ReadingOrigin, User } from '../types';

interface ScannerProps {
  serviceType: ServiceType;
  building: Building;
  user: User;
  onComplete: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ serviceType, building, user, onComplete }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [val1, setVal1] = useState<string>("");
  const [val2, setVal2] = useState<string>("");
  const [pressure, setPressure] = useState<string>("");
  const [temp, setTemp] = useState<string>("");
  const [note, setNote] = useState("");
  const [origin, setOrigin] = useState<ReadingOrigin>('manual');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [step, setStep] = useState<'selection' | 'confirm'>('selection');
  
  const [lastReading, setLastReading] = useState<Reading | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const readings = storageService.getReadings(building.id, serviceType);
    if (readings.length > 0) {
      setLastReading(readings.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]);
    }
  }, [building, serviceType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setStep('confirm');
    setOrigin('manual');
    const result = await extractReadingsForService(base64, serviceType);
    if (result.v1 !== null) setVal1(result.v1.toString().replace('.', ','));
    if (result.v2 !== null) setVal2(result.v2.toString().replace('.', ','));
    setLoading(false);
  };

  const handleTelemetrySync = async () => {
    setLoading(true);
    // Fix: storageService.getWaterAccounts() does not exist, using getWaterAccount()
    const account = storageService.getWaterAccount();
    
    if (!account || account.buildingId !== building.id) {
      alert("⚠️ No hay cuenta de telemetría configurada para este edificio. Configure las credenciales de Aguas de Alicante en el módulo correspondiente.");
      setLoading(false);
      return;
    }

    const res = await storageService.simulateWaterSync(account.id);
    setLoading(false);
    
    if (res.success && res.reading) {
      alert(`✅ Sincronización Puppeteer Exitosa.\nLectura obtenida: ${res.reading.value1} m³\nConsumo periodo: ${res.reading.consumption1} m³${res.reading.isPeak ? '\n\n🚨 ALERTA: Pico de consumo detectado' : ''}`);
      onComplete();
    } else {
      alert(`❌ Error: ${res.message}`);
    }
  };

  const v1Status = useMemo(() => {
    const cur = parseEuropeanNumber(val1);
    const prev = lastReading?.value1;
    if (cur === null || prev === undefined) return { valid: true, diff: 0 };
    return { valid: cur >= prev, diff: cur - prev };
  }, [val1, lastReading]);

  const v2Status = useMemo(() => {
    const cur = parseEuropeanNumber(val2);
    const prev = lastReading?.value2;
    if (cur === null || prev === undefined) return { valid: true, diff: 0 };
    return { valid: cur >= prev, diff: cur - prev };
  }, [val2, lastReading]);

  const handleSave = () => {
    const n1 = parseEuropeanNumber(val1);
    if (n1 === null) return alert("Lectura principal obligatoria");

    if (!v1Status.valid || (val2 && !v2Status.valid)) {
      if (!confirm("Atención: La lectura es inferior a la anterior. ¿Desea forzar el registro?")) return;
    }

    const newReading: Reading = {
      id: crypto.randomUUID(),
      buildingId: building.id,
      date,
      timestamp: new Date().toISOString(),
      userId: user.id,
      serviceType,
      origin,
      imageUrl: image || undefined,
      value1: n1,
      value2: serviceType === 'luz' ? parseEuropeanNumber(val2) || undefined : undefined,
      pressure: serviceType === 'caldera' ? parseFloat(pressure) : undefined,
      temperature: serviceType === 'caldera' ? parseFloat(temp) : undefined,
      note
    };

    storageService.saveReading(newReading);
    onComplete();
  };

  if (step === 'selection') {
    return (
      <div className="flex flex-col items-center py-6 gap-8 animate-in fade-in slide-in-from-bottom-10">
        <div className="text-center px-4">
          <div className="bg-gray-900 text-yellow-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 shadow-xl inline-block">
             INSTALACIÓN: {building.code}
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{building.name}</h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Módulo {serviceType.toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full px-2 max-w-sm">
          <button onClick={() => cameraInputRef.current?.click()} className="group flex items-center gap-6 bg-gray-900 text-white p-7 rounded-[2.5rem] font-bold shadow-2xl active:scale-95 transition-all border border-white/10">
            <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-yellow-400 group-hover:text-black transition-colors"><Camera className="w-8 h-8" /></div>
            <div className="text-left">
              <div className="text-xl font-black uppercase leading-none mb-1">Cámara</div>
              <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">Captura y OCR AI</div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => galleryInputRef.current?.click()} className="group flex flex-col items-center justify-center gap-3 bg-white border-2 border-gray-100 p-7 rounded-[2.5rem] font-bold active:scale-95 transition-all hover:border-yellow-400 shadow-sm">
               <Upload className="w-6 h-6 text-gray-400 group-hover:text-yellow-500" />
               <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Archivos</div>
             </button>
             <button onClick={() => { setImage(null); setStep('confirm'); setOrigin('manual'); }} className="group flex flex-col items-center justify-center gap-3 bg-white border-2 border-gray-100 p-7 rounded-[2.5rem] font-bold active:scale-95 transition-all hover:border-yellow-400 shadow-sm">
               <Keyboard className="w-6 h-6 text-gray-400 group-hover:text-yellow-500" />
               <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Manual</div>
             </button>
          </div>

          {serviceType === 'agua' && (
            <button 
              onClick={handleTelemetrySync} 
              disabled={loading}
              className="group flex items-center gap-6 bg-blue-50 border-2 border-blue-100 text-blue-900 p-7 rounded-[2.5rem] font-bold active:scale-95 transition-all hover:bg-blue-100 shadow-sm disabled:opacity-50"
            >
              <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-xl">
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Globe className="w-8 h-8" />}
              </div>
              <div className="text-left">
                <div className="text-xl font-black uppercase leading-none mb-1">Telemetría</div>
                <div className="text-[10px] text-blue-600/60 uppercase font-black tracking-widest">Aguas de Alicante Portal</div>
              </div>
            </button>
          )}
        </div>

        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
        <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in zoom-in-95 duration-300 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setStep('selection')} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-2xl text-gray-500 active:scale-90"><X className="w-6 h-6" /></button>
        <div className="text-center">
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{building.code}</div>
          <div className="text-sm font-black uppercase text-gray-900">{serviceType}</div>
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-gray-900 text-yellow-400 rounded-2xl">
           <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {image && (
        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-gray-100 mx-2">
          <img src={image} className="w-full h-full object-cover" />
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-md">
              <Loader2 className="w-10 h-10 animate-spin mb-3 text-yellow-400" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em]">Analizando Fotografía...</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 px-2">
        <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${!v1Status.valid ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
            {serviceType === 'luz' ? 'Contador A (kWh)' : serviceType === 'agua' ? 'Caudalímetro (m³)' : 'Consumo (Horas)'}
          </label>
          <div className="flex items-center gap-4 mb-4">
             <div className="flex-1 text-center opacity-30">
                <div className="text-[8px] font-black uppercase mb-1">Anterior</div>
                <div className="font-mono text-sm font-bold">{lastReading?.value1 || '0'}</div>
             </div>
             <div className="flex-1 text-center">
                <div className="text-[8px] font-black uppercase text-green-600 mb-1">Delta</div>
                <div className="font-mono text-sm font-bold text-green-600">+{v1Status.diff.toFixed(1)}</div>
             </div>
          </div>
          <input type="text" inputMode="decimal" value={val1} onChange={e => setVal1(e.target.value)} className="w-full p-6 bg-gray-50 rounded-3xl text-4xl font-mono text-center outline-none border-2 border-transparent focus:border-yellow-400 transition-all font-black text-gray-900" placeholder="00000.0" />
        </div>

        {serviceType === 'luz' && (
          <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${!v2Status.valid ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">Contador B (kWh)</label>
            <div className="flex items-center gap-4 mb-4">
               <div className="flex-1 text-center opacity-30"><div className="text-[8px] font-black uppercase mb-1">Anterior</div><div className="font-mono text-sm font-bold">{lastReading?.value2 || '0'}</div></div>
               <div className="flex-1 text-center"><div className="text-[8px] font-black uppercase text-blue-500 mb-1">Delta</div><div className="font-mono text-sm font-bold text-blue-500">+{v2Status.diff.toFixed(1)}</div></div>
            </div>
            <input type="text" inputMode="decimal" value={val2} onChange={e => setVal2(e.target.value)} className="w-full p-6 bg-gray-50 rounded-3xl text-4xl font-mono text-center outline-none border-2 border-transparent focus:border-yellow-400 transition-all font-black text-gray-900" placeholder="00000.0" />
          </div>
        )}

        <button onClick={handleSave} className="w-full p-7 bg-gray-900 text-yellow-400 rounded-[2.5rem] font-black shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-sm mt-4 hover:bg-black">
          Validar Lectura Oficial
        </button>
      </div>
    </div>
  );
};

export default Scanner;
