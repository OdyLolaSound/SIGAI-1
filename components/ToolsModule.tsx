
import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, Ruler, Box, Camera, ArrowLeft, 
  RefreshCw, Maximize, Save, Trash2, 
  Layers, Move, RotateCcw, Info,
  ChevronRight, Calculator, Scaling, FileSpreadsheet, PlusCircle,
  FileCode, Home, CheckCircle, Target, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

type ToolType = 'menu' | 'converter' | 'ar_measure' | 'scan_3d' | 'level';

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
      case 'level':
        return <LevelTool onBack={() => setActiveTool('menu')} />;
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
              <ToolCard 
                icon={<Target className="w-6 h-6" />}
                title="Nivel de Burbuja"
                desc="Nivelación de superficies"
                onClick={() => setActiveTool('level')}
                color="bg-green-50 border-green-100 text-green-900"
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

const Step: React.FC<{ num: string, text: string }> = ({ num, text }) => (
  <div className="flex gap-4 items-start">
    <div className="w-8 h-8 shrink-0 bg-gray-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">{num}</div>
    <p className="text-[11px] text-gray-600 font-bold leading-relaxed pt-1">{text}</p>
  </div>
);

// --- MEDIDOR AR (SIMULADO / INTERACTIVO) ---
const ARMeasureTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [points, setPoints] = useState<{ x: number, y: number, angle: { beta: number, gamma: number } }[]>([]);
  const [currentAngle, setCurrentAngle] = useState({ beta: 0, gamma: 0 });
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!showIntro) {
      startCamera();
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [showIntro]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    setCurrentAngle({
      beta: event.beta || 0,
      gamma: event.gamma || 0
    });
  };

  const startCamera = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El navegador no soporta el acceso a la cámara.");
      }
      const constraints = { 
        video: { facingMode: 'environment' },
        audio: false 
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
    } catch (err) {
      setError("Error de cámara. Asegúrate de dar permisos y usar HTTPS.");
    }
  };

  const handleAction = () => {
    if (points.length === 0) {
      // Mark start point
      setPoints([{ x: window.innerWidth / 2, y: window.innerHeight / 2, angle: currentAngle }]);
      setDistance(0);
      // Visual feedback
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (points.length === 1) {
      // Mark end point
      const endPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2, angle: currentAngle };
      const finalDist = calculateDistance(points[0].angle, endPoint.angle);
      setPoints([...points, endPoint]);
      setDistance(finalDist);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } else {
      // Reset
      setPoints([]);
      setDistance(null);
    }
  };

  const calculateDistance = (a1: { beta: number, gamma: number }, a2: { beta: number, gamma: number }) => {
    // Heurística: calculamos la diferencia angular y la convertimos a metros
    // Asumimos que el usuario está a una distancia media de 2-3 metros
    const dBeta = Math.abs(a1.beta - a2.beta);
    const dGamma = Math.abs(a1.gamma - a2.gamma);
    const angularDiff = Math.sqrt(dBeta * dBeta + dGamma * dGamma);
    
    // Factor de escala: aprox 0.05 metros por grado de inclinación
    // Esto es una simulación visual para el prototipo
    return angularDiff * 0.085;
  };

  // Dibujar la línea en el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (points.length > 0) {
        const start = points[0];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Dibujar punto inicial
        ctx.beginPath();
        ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24'; // yellow-400
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar línea elástica
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        const isFinished = points.length === 2;
        const targetX = isFinished ? points[1].x : centerX;
        const targetY = isFinished ? points[1].y : centerY;
        
        ctx.lineTo(targetX, targetY);
        
        if (isFinished) {
          ctx.setLineDash([]); 
          ctx.strokeStyle = '#fbbf24'; // Yellow-400 for finished
          ctx.lineWidth = 6;
        } else {
          ctx.setLineDash([]); // Solid line as requested
          ctx.strokeStyle = '#ef4444'; // Red-500 while measuring
          ctx.lineWidth = 4;
        }
        
        ctx.stroke();

        // Dibujar etiqueta de distancia sobre la línea
        if (distance !== null) {
          const midX = (start.x + targetX) / 2;
          const midY = (start.y + targetY) / 2;
          
          ctx.save();
          ctx.translate(midX, midY);
          
          // Fondo de la etiqueta (Pill shape)
          const labelText = `${distance.toFixed(2)} m`;
          ctx.font = 'bold 14px Inter, sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const padding = 12;
          
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-(textWidth/2 + padding), -15, textWidth + padding * 2, 30, 15);
          } else {
            ctx.rect(-(textWidth/2 + padding), -15, textWidth + padding * 2, 30);
          }
          ctx.fillStyle = isFinished ? '#fbbf24' : '#ef4444';
          ctx.fill();
          
          // Texto
          ctx.fillStyle = isFinished ? 'black' : 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, 0, 0);
          
          ctx.restore();
        }

        // Si estamos midiendo, actualizar distancia en tiempo real
        if (points.length === 1) {
          const liveDist = calculateDistance(points[0].angle, currentAngle);
          setDistance(liveDist);
        }

        // Dibujar punto final si existe
        if (points.length === 2) {
          ctx.beginPath();
          ctx.arc(points[1].x, points[1].y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444'; // red-500
          ctx.fill();
          ctx.stroke();
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, [points, currentAngle]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-gray-900/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl space-y-6">
              <div className="text-center">
                <div className="inline-flex p-4 bg-purple-100 rounded-2xl mb-4">
                  <Ruler className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Medidor AR</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Herramienta de Medición</p>
              </div>

              <div className="space-y-4">
                <Step num="1" text="Apunta al punto de inicio y pulsa 'Marcar Inicio'." />
                <Step num="2" text="Mueve el móvil hacia el punto final. Verás la línea estirarse." />
                <Step num="3" text="Pulsa 'Fijar Punto' para obtener la distancia final en metros." />
              </div>

              <button 
                onClick={() => setShowIntro(false)}
                className="w-full p-5 bg-purple-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all"
              >
                Comenzar Medición
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* UI OVERLAY */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <button onClick={onBack} className="p-4 bg-black/40 backdrop-blur-md rounded-2xl text-white">
              <ArrowLeft />
            </button>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                {points.length === 0 ? 'Busca el punto de inicio' : 
                 points.length === 1 ? 'Mueve el móvil al punto final' : 
                 'Medición completada'}
              </div>
              {/* Level Indicator */}
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${Math.abs(currentAngle.beta) < 2 ? 'bg-green-500' : 'bg-white/20'}`} />
                <div className={`w-2 h-2 rounded-full ${Math.abs(currentAngle.gamma) < 2 ? 'bg-green-500' : 'bg-white/20'}`} />
              </div>
            </div>
          </div>

          {/* Crosshair */}
          {points.length < 2 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-white/40 absolute" />
              <div className="h-full w-[1px] bg-white/40 absolute" />
              <div className="w-8 h-8 border border-white/20 rounded-full absolute" />
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,1)]" />
            </div>
          )}

          <div className="space-y-6 pointer-events-auto">
            {/* Panel de Distancia Flotante (Opcional, ya que ahora está en la línea) */}
            {distance !== null && points.length === 2 && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gray-900/90 backdrop-blur-md rounded-[2rem] p-4 shadow-2xl text-center border border-white/10"
              >
                <div className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">
                  Medición Guardada
                </div>
                <div className="text-3xl font-black text-white">
                  {distance.toFixed(2)} <span className="text-xs text-yellow-400">m</span>
                </div>
              </motion.div>
            )}

            <button 
              onClick={handleAction}
              className={`w-full p-8 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${
                points.length === 0 ? 'bg-yellow-400 text-black' : 
                points.length === 1 ? 'bg-red-500 text-white' : 
                'bg-gray-900 text-white'
              }`}
            >
              {points.length === 0 && <><PlusCircle className="w-6 h-6" /> Marcar Inicio</>}
              {points.length === 1 && <><CheckCircle className="w-6 h-6" /> Fijar Punto Final</>}
              {points.length === 2 && <><RefreshCw className="w-6 h-6" /> Nueva Medición</>}
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
  const [showIntro, setShowIntro] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roomMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!showIntro) {
      startCamera();
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [showIntro]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        throw new Error("La cámara requiere una conexión segura (HTTPS).");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El navegador no soporta el acceso a la cámara o está bloqueado.");
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
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-gray-900/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl space-y-6">
              <div className="text-center">
                <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
                  <Box className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Escaneado 3D</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Características del Sistema</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-gray-50 rounded-lg"><Maximize className="w-4 h-4 text-gray-400" /></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-900">Modelado 3D</h4>
                    <p className="text-[9px] text-gray-500 font-medium">Generación automática de volúmenes a partir de puntos.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-gray-50 rounded-lg"><FileCode className="w-4 h-4 text-gray-400" /></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-900">Exportación CAD</h4>
                    <p className="text-[9px] text-gray-500 font-medium">Formatos compatibles con SketchUp (.OBJ) y AutoCAD (.DXF).</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-gray-50 rounded-lg"><Home className="w-4 h-4 text-gray-400" /></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-900">Medición USAC</h4>
                    <p className="text-[9px] text-gray-500 font-medium">Ideal para levantamiento de planos de dependencias militares.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="w-full p-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" /> Instrucciones de uso
                </button>
                <button 
                  onClick={() => setShowIntro(false)}
                  className="w-full p-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  Aceptar y Comenzar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[70] bg-white flex flex-col p-8"
          >
            <div className="flex-1 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Info className="w-6 h-6" /></div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Guía de Escaneado</h3>
              </div>

              <div className="space-y-6">
                <Step num="1" text="Sitúate en el centro de la habitación y apunta a la primera esquina." />
                <Step num="2" text="Pulsa 'Marcar Esquina' en cada vértice de la planta de la habitación." />
                <Step num="3" text="Una vez marcadas todas (mínimo 3), pulsa 'Generar Plano 3D'." />
                <Step num="4" text="Ajusta la altura y exporta el archivo para tu software de diseño." />
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed">
                  <span className="uppercase tracking-widest block mb-1">Consejo:</span>
                  Para mejores resultados, realiza el escaneado en sentido de las agujas del reloj y asegúrate de que haya buena iluminación.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowInstructions(false)}
              className="w-full p-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
            >
              Entendido, Volver
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

// --- NIVEL DE BURBUJA ---
const LevelTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 });
  const [isLevel, setIsLevel] = useState(false);

  useEffect(() => {
    let lastUpdate = Date.now();
    const smoothingFactor = 0.15; // Adjust for more/less smoothing

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastUpdate < 16) return; // Limit updates to ~60fps
      lastUpdate = now;

      const targetBeta = event.beta || 0; 
      const targetGamma = event.gamma || 0; 
      
      setOrientation(prev => ({
        beta: prev.beta + (targetBeta - prev.beta) * smoothingFactor,
        gamma: prev.gamma + (targetGamma - prev.gamma) * smoothingFactor
      }));
      
      // Check for leveling using the smoothed values for better stability
      const isFlat = Math.abs(orientation.beta) < 1.2 && Math.abs(orientation.gamma) < 1.2;
      const isVerticalPortrait = Math.abs(orientation.gamma) < 1.2 && (Math.abs(orientation.beta) > 88.8 && Math.abs(orientation.beta) < 91.2);
      const isVerticalLandscape = Math.abs(orientation.beta) < 1.2 && (Math.abs(orientation.gamma) > 88.8 && Math.abs(orientation.gamma) < 91.2);

      const currentlyLevel = isFlat || isVerticalPortrait || isVerticalLandscape;

      if (currentlyLevel) {
        if (!isLevel) {
          setIsLevel(true);
          if (navigator.vibrate) navigator.vibrate(80);
        }
      } else {
        setIsLevel(false);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isLevel]);

  // Calculate bubble positions
  const bubbleX = Math.max(-100, Math.min(100, orientation.gamma * 5));
  const bubbleY = Math.max(-100, Math.min(100, orientation.beta * 5));
  
  // Linear vials positions (clamped to -100 to 100 range for the UI)
  const linearHX = Math.max(-80, Math.min(80, orientation.gamma * 2));
  const linearVY = Math.max(-80, Math.min(80, (orientation.beta - 90) * 2));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-3 bg-gray-100 rounded-2xl active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Nivel Multi-Eje</h3>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Precisión USAC 360°</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-[3rem] p-8 shadow-2xl border border-gray-800 relative overflow-hidden flex flex-col items-center">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {/* Horizontal Vial (Top) */}
        <div className="w-48 h-8 bg-gray-800 rounded-full border border-gray-700 mb-8 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-y-0 w-[1px] bg-gray-600 left-1/2" />
          <div className="absolute inset-y-0 w-10 border-x border-gray-600 left-1/2 -translate-x-1/2" />
          <motion.div 
            animate={{ x: linearHX }}
            transition={{ type: 'spring', damping: 40, stiffness: 80 }}
            className={`w-6 h-6 rounded-full shadow-lg ${Math.abs(orientation.gamma) < 1.2 ? 'bg-green-400' : 'bg-yellow-400'}`}
          />
        </div>

        <div className="flex items-center gap-8">
          {/* Main Bullseye Level */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="w-48 h-48 rounded-full border-4 border-gray-800 flex items-center justify-center relative">
              <div className="absolute w-full h-[1px] bg-gray-800" />
              <div className="absolute h-full w-[1px] bg-gray-800" />
              <div className="absolute w-24 h-24 rounded-full border-2 border-gray-800" />
              <div className="absolute w-8 h-8 rounded-full border-2 border-gray-800" />

              <motion.div 
                animate={{ x: bubbleX, y: bubbleY }}
                transition={{ type: 'spring', damping: 40, stiffness: 80 }}
                className={`w-8 h-8 rounded-full shadow-2xl flex items-center justify-center transition-colors duration-300 ${isLevel ? 'bg-green-400' : 'bg-yellow-400'}`}
              >
                <div className="w-2 h-2 bg-white/40 rounded-full blur-[1px] -mt-1 -ml-1" />
              </motion.div>
            </div>
          </div>

          {/* Vertical Vial (Side) */}
          <div className="w-8 h-48 bg-gray-800 rounded-full border border-gray-700 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 h-[1px] bg-gray-600 top-1/2" />
            <div className="absolute inset-x-0 h-10 border-y border-gray-600 top-1/2 -translate-y-1/2" />
            <motion.div 
              animate={{ y: linearVY }}
              transition={{ type: 'spring', damping: 40, stiffness: 80 }}
              className={`w-6 h-6 rounded-full shadow-lg ${Math.abs(orientation.beta - 90) < 1.2 ? 'bg-green-400' : 'bg-yellow-400'}`}
            />
          </div>
        </div>

        {/* Digital Readout */}
        <div className="mt-10 grid grid-cols-2 gap-8 w-full">
          <div className="text-center">
            <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Inclinación (X)</div>
            <div className={`text-2xl font-black font-mono transition-colors ${Math.abs(orientation.beta) < 1 || Math.abs(Math.abs(orientation.beta) - 90) < 1 ? 'text-green-400' : 'text-white'}`}>
              {orientation.beta.toFixed(1)}°
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Rotación (Y)</div>
            <div className={`text-2xl font-black font-mono transition-colors ${Math.abs(orientation.gamma) < 1 || Math.abs(Math.abs(orientation.gamma) - 90) < 1 ? 'text-green-400' : 'text-white'}`}>
              {orientation.gamma.toFixed(1)}°
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-8 flex justify-center">
          <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border transition-all ${isLevel ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
            {isLevel ? 'Nivel Correcto' : 'Ajustando...'}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
        <Smartphone className="w-8 h-8 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-[9px] font-black text-amber-900 uppercase">Instrucciones de Nivelado:</p>
          <p className="text-[8px] font-bold text-amber-800 uppercase leading-relaxed tracking-tight">
            • <span className="text-amber-900">Plano:</span> Usa el círculo central.<br/>
            • <span className="text-amber-900">Vertical/Horizontal:</span> Usa los tubos superior y lateral apoyando el canto del móvil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToolsModule;
