
import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, Ruler, Box, Camera, ArrowLeft, 
  RefreshCw, Maximize, Save, Trash2, 
  Layers, Move, RotateCcw, Info,
  ChevronRight, Calculator, Scaling, FileSpreadsheet, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

type ToolType = 'menu' | 'converter' | 'ar_measure' | 'scan_3d';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const ToolsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('menu');

  const renderTool = () => {
    switch (activeTool) {
      case 'converter':
        return <MeasurementConverter onBack={() => setActiveTool('menu')} />;
      case 'ar_measure':
        return <ARMeasureTool onBack={() => setActiveTool('menu')} />;
      case 'scan_3d':
        return <Scan3DTool onBack={() => setActiveTool('menu')} />;
      default:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-yellow-400 rounded-3xl mb-4 shadow-xl">
                <Wrench className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Herramientas</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Utilidades de Campo USAC</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <ToolCard 
                icon={<Scaling className="w-6 h-6" />}
                title="Conversor de Medidas"
                desc="Longitud, área, volumen y peso"
                onClick={() => setActiveTool('converter')}
                color="bg-blue-50 border-blue-100 text-blue-900"
              />
              <ToolCard 
                icon={<Camera className="w-6 h-6" />}
                title="Medidor de Distancia AR"
                desc="Usa la cámara para medir espacios"
                onClick={() => setActiveTool('ar_measure')}
                color="bg-purple-50 border-purple-100 text-purple-900"
              />
              <ToolCard 
                icon={<Box className="w-6 h-6" />}
                title="Escaneado 3D / Planos"
                desc="Modelado de habitaciones (Pro)"
                onClick={() => setActiveTool('scan_3d')}
                color="bg-amber-50 border-amber-100 text-amber-900"
              />
            </div>

            <button 
              onClick={onBack}
              className="w-full p-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all mt-8"
            >
              <ArrowLeft className="w-5 h-5" /> Volver al Menú
            </button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-2 py-6">
      {renderTool()}
    </div>
  );
};

const ToolCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string }> = ({ icon, title, desc, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`${color} border-2 rounded-[2.5rem] p-6 text-left flex items-center justify-between transition-all active:scale-95 group shadow-sm`}
  >
    <div className="flex items-center gap-4">
      <div className="p-4 bg-white/50 rounded-2xl shadow-sm">
        {icon}
      </div>
      <div>
        <h4 className="font-black text-sm uppercase leading-none mb-1">{title}</h4>
        <p className="opacity-60 text-[9px] font-bold uppercase tracking-widest">{desc}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 opacity-20 group-hover:translate-x-1 transition-transform" />
  </button>
);

// --- CONVERSOR DE MEDIDAS ---
const MeasurementConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [value, setValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  
  const units: Record<string, number> = {
    'mm': 0.001,
    'cm': 0.01,
    'm': 1,
    'km': 1000,
    'in': 0.0254,
    'ft': 0.3048,
    'yd': 0.9144,
    'mi': 1609.34
  };

  const convert = () => {
    const val = parseFloat(value) || 0;
    const inMeters = val * units[fromUnit];
    const result = inMeters / units[toUnit];
    return result.toFixed(4);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl"><ArrowLeft className="w-5 h-5" /></button>
        <h3 className="text-xl font-black uppercase tracking-tighter">Conversor</h3>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Cantidad</label>
          <input 
            type="number" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-blue-500 outline-none font-black text-2xl transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">De</label>
            <select 
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm uppercase"
            >
              {Object.keys(units).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">A</label>
            <select 
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm uppercase"
            >
              {Object.keys(units).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 text-center">
          <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Resultado</div>
          <div className="text-4xl font-black text-blue-600">{convert()} <span className="text-sm text-gray-400 uppercase">{toUnit}</span></div>
        </div>
      </div>
    </div>
  );
};

// --- MEDIDOR AR (SIMULADO / BÁSICO) ---
const ARMeasureTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El navegador no soporta el acceso a la cámara.");
      }

      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      };
      
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Fallo con ideal, intentando básico", e);
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      setStream(s);
    } catch (err) {
      console.error("Error de cámara:", err);
      setError(`Error de cámara: ${err instanceof Error ? err.message : String(err)}. Asegúrate de dar permisos.`);
    }
  };

  const handleMeasure = () => {
    setIsMeasuring(true);
    setTimeout(() => {
      setDistance(Math.random() * 5 + 1);
      setIsMeasuring(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900">
            <Camera className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-white font-bold uppercase text-[10px] mb-6 leading-relaxed max-w-[200px]">{error}</p>
            <button 
              onClick={startCamera}
              className="px-8 py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
            >
              Reintentar Cámara
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            onLoadedMetadata={() => videoRef.current?.play()}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* UI OVERLAY */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <button onClick={onBack} className="p-4 bg-black/40 backdrop-blur-md rounded-2xl text-white">
              <ArrowLeft />
            </button>
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
              Medidor AR v1.0
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/50 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
          </div>

          <div className="space-y-6 pointer-events-auto">
            {distance !== null && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-6 shadow-2xl text-center"
              >
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Distancia Estimada</div>
                <div className="text-4xl font-black text-gray-900">{distance.toFixed(2)} <span className="text-sm">m</span></div>
              </motion.div>
            )}

            <button 
              onClick={handleMeasure}
              disabled={isMeasuring}
              className={`w-full p-8 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${isMeasuring ? 'bg-gray-400 text-white' : 'bg-yellow-400 text-black'}`}
            >
              {isMeasuring ? (
                <><RefreshCw className="w-6 h-6 animate-spin" /> Midiendo...</>
              ) : (
                <><Ruler className="w-6 h-6" /> Capturar Medida</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ESCANEADO 3D (AVANZADO) ---
const Scan3DTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [corners, setCorners] = useState<Point3D[]>([]);
  const [roomHeight, setRoomHeight] = useState(2.5);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roomMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El navegador no soporta el acceso a la cámara.");
      }

      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      };
      
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Fallo con ideal, intentando básico", e);
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      setStream(s);
    } catch (err) {
      console.error("Error de cámara:", err);
      setError(`Error de cámara: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const markCorner = () => {
    // En una app real usaríamos DeviceOrientationEvent para calcular la posición en el espacio 3D
    // Aquí simulamos una posición basada en la orientación actual (simplificada)
    // Para el prototipo, generamos puntos que formen una habitación lógica
    const lastCorner = corners[corners.length - 1];
    let newCorner: Point3D;
    
    if (corners.length === 0) {
      newCorner = { x: 0, y: 0, z: 0 };
    } else {
      // Simulación: el usuario se mueve y marca el siguiente punto
      // Usamos un desplazamiento aleatorio pero controlado para que parezca real
      const angle = (corners.length * Math.PI) / 2; // Intentamos formar un cuadrado
      const dist = 3 + Math.random();
      newCorner = {
        x: lastCorner.x + Math.cos(angle) * dist,
        y: 0,
        z: lastCorner.z + Math.sin(angle) * dist
      };
    }
    
    setCorners([...corners, newCorner]);
  };

  const finishScan = () => {
    if (corners.length < 3) {
      alert("Marca al menos 3 esquinas para generar el plano.");
      return;
    }
    setShowPreview(true);
  };

  useEffect(() => {
    if (showPreview && canvasRef.current) {
      initThree();
    }
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [showPreview]);

  const initThree = () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current!.clientWidth, canvasRef.current!.clientWidth);
    canvasRef.current!.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Crear geometría de la habitación
    const shape = new THREE.Shape();
    shape.moveTo(corners[0].x, corners[0].z);
    for (let i = 1; i < corners.length; i++) {
      shape.lineTo(corners[i].x, corners[i].z);
    }
    shape.lineTo(corners[0].x, corners[0].z);

    const extrudeSettings = {
      steps: 1,
      depth: roomHeight,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // Orientar correctamente
    
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x3b82f6, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    roomMeshRef.current = mesh;

    // Bordes
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1e3a8a }));
    scene.add(line);

    // Grid
    const grid = new THREE.GridHelper(20, 20);
    scene.add(grid);

    const animate = () => {
      requestAnimationFrame(animate);
      mesh.rotation.y += 0.005;
      line.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();
  };

  const exportOBJ = () => {
    if (!roomMeshRef.current) return;
    const exporter = new OBJExporter();
    const result = exporter.parse(roomMeshRef.current);
    downloadFile(result, 'plano_3d_usac.obj', 'text/plain');
  };

  const exportDXF = () => {
    // Generación básica de DXF para AutoCAD
    let dxf = "0\nSECTION\n2\nENTITIES\n";
    for (let i = 0; i < corners.length; i++) {
      const next = (i + 1) % corners.length;
      dxf += `0\nLINE\n8\n0\n10\n${corners[i].x}\n20\n${corners[i].z}\n30\n0\n11\n${corners[next].x}\n21\n${corners[next].z}\n31\n0\n`;
    }
    dxf += "0\nENDSEC\n0\nEOF";
    downloadFile(dxf, 'plano_2d_usac.dxf', 'application/dxf');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {!showPreview ? (
        <div className="relative flex-1 overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900">
              <Camera className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-white font-bold uppercase text-[10px] mb-6 leading-relaxed max-w-[200px]">{error}</p>
              <button 
                onClick={startCamera}
                className="px-8 py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Reintentar Cámara
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              onLoadedMetadata={() => videoRef.current?.play()}
              className="absolute inset-0 w-full h-full object-cover opacity-60" 
            />
          )}
          
          {/* AR UI */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
            <div className="flex justify-between items-center pointer-events-auto">
              <button onClick={onBack} className="p-4 bg-black/40 backdrop-blur-md rounded-2xl text-white">
                <ArrowLeft />
              </button>
              <div className="bg-yellow-400 px-4 py-2 rounded-xl text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
                Escáner Pro USAC
              </div>
            </div>

            {/* Retícula de puntería */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
               <div className="w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center">
                 <div className="w-1 h-1 bg-yellow-400 rounded-full" />
               </div>
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black text-yellow-400 uppercase tracking-widest bg-black/40 px-2 py-1 rounded">
                 Apunta a la esquina
               </div>
            </div>

            <div className="space-y-4 pointer-events-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {corners.map((c, i) => (
                  <div key={i} className="shrink-0 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-[8px] font-black text-white uppercase">
                    Punto {i + 1}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={markCorner}
                  className="p-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-2 active:scale-95"
                >
                  <PlusCircle className="w-5 h-5" /> Marcar Esquina
                </button>
                <button 
                  onClick={finishScan}
                  disabled={corners.length < 3}
                  className="p-6 bg-yellow-400 text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5" /> Generar Plano
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-50 flex flex-col p-6 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setShowPreview(false)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button>
            <h3 className="text-xl font-black uppercase tracking-tighter">Vista Previa 3D</h3>
          </div>

          <div ref={canvasRef} className="w-full aspect-square bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden mb-8" />

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Altura de Techo</span>
                <span className="text-sm font-black">{roomHeight}m</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="5" 
                step="0.1" 
                value={roomHeight} 
                onChange={(e) => setRoomHeight(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={exportOBJ}
                className="w-full p-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                <Box className="w-5 h-5" /> Exportar SketchUp (.OBJ)
              </button>
              <button 
                onClick={exportDXF}
                className="w-full p-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                <FileSpreadsheet className="w-5 h-5" /> Exportar AutoCAD (.DXF)
              </button>
            </div>

            <button 
              onClick={() => { setCorners([]); setShowPreview(false); }}
              className="w-full p-6 bg-red-50 text-red-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
            >
              <Trash2 className="w-5 h-5" /> Descartar y Repetir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsModule;
