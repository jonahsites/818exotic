import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
// @ts-ignore
import Stats from 'stats-gl';
import * as dat from 'dat.gui';
import { Settings, Save, RotateCcw, Play, Pause, AlertCircle } from 'lucide-react';
import modelConfig from '../models-config.json';

const modelData = [
  {
    "name": "2021 Lamborghini Urus",
    "url": "https://dl.dropboxusercontent.com/scl/fi/74774nxsasm7ce8exwv2r/2025_lamborghini_urus_se.glb?rlkey=sr9urz2j60zg5iz315tyymuf0&st=v0p7kgz5",
    "yOffset": -0.1,
    "scaleMult": 0.74,
    "rotationOffset": 0
  },
  {
    "name": "BMW M4 Competition",
    "url": "https://dl.dropboxusercontent.com/scl/fi/4mhrd6lz3b45ea32atqzc/bmw_m4_competition_2021.glb?rlkey=9nzetwqkp7vbiq3ljruv7r35v&st=8fukm13q",
    "yOffset": -0.05,
    "scaleMult": 0.635,
    "rotationOffset": 0
  },
  {
    "name": "Mercedes-AMG GLC 43",
    "url": "https://dl.dropboxusercontent.com/scl/fi/ozz22dc87bc151a0hjprz/Mercedes.glb?rlkey=5j3joc05oz974f0ktkcn2y87o&st=9uml5j9z",
    "yOffset": -0.05,
    "scaleMult": 1.109,
    "rotationOffset": 1.525
  },
  {
    "name": "Corvette C8 Stingray",
    "url": "https://dl.dropboxusercontent.com/scl/fi/bk7isytkbgv4fvadtbhp7/2020_chevrolet_corvette_c8_stingray.glb?rlkey=p5edebke7ziyoaz4cujv69crf&st=pokntlp1",
    "yOffset": -0.035,
    "scaleMult": 0.529,
    "rotationOffset": 0
  },
  {
    "name": "2019 Mclaren 600 LT Coupe",
    "url": "https://dl.dropboxusercontent.com/scl/fi/32q7brp20cb4lhu6tl7yy/mclaren.glb?rlkey=xvljtu16pgpq17175ia4lzcu9&st=7dznf6zq",
    "yOffset": 0.006,
    "scaleMult": 1.069,
    "rotationOffset": -4.665
  },
  {
    "name": "Rolls Royce Cullinan",
    "url": "https://dl.dropboxusercontent.com/scl/fi/fjmuybrmtrg7p6hh4lp7v/result-1.glb?rlkey=6nnq8rqxbw2dka6r0j33v42xi&st=7mksum6q",
    "yOffset": -0.049,
    "scaleMult": 1.096,
    "rotationOffset": -4.665
  }
];

const sections = [
  {
    label: "01 — Super SUV Evolution",
    title: "Lamborghini\nUrus",
    desc: "The ultimate Super SUV. Combining the soul of a super sports car with the practical functionality of an SUV.",
    tags: ["V8 Bi-Turbo", "641 HP", "Performance"],
    color: "#4A7C7A",
    accent: "#F4A261"
  },
  {
    label: "02 — M Performance",
    title: "BMW M4\nCompetition",
    desc: "The new benchmark for agility and dynamics. A green beast that dominates every corner with surgical precision.",
    tags: ["Inline-6", "503 HP", "Isle of Man Green"],
    color: "#E76F51",
    accent: "#E9C46A"
  },
  {
    label: "03 — Urban Luxury",
    title: "Mercedes-AMG\nGLC 43",
    desc: "Experience the perfect blend of daily versatility and AMG DNA. A high-performance SUV for the modern trendsetter.",
    tags: ["V6 Biturbo", "385 HP", "AMG Dynamics"],
    color: "#2C3E50",
    accent: "#4A7C7A"
  },
  {
    label: "04 — Redline Soul",
    title: "Corvette C8\nStingray",
    desc: "The mid-engine revolution. An American icon reborn with exotic performance and a heart-pounding V8 soundtrack.",
    tags: ["V8 LT2", "495 HP", "Torch Red"],
    color: "#F4A261",
    accent: "#E76F51"
  },
  {
    label: "05 — Track Legend",
    title: "Mclaren\n600 LT",
    desc: "The lighter, faster, more focused Longtail. Designed to dominate the track while maintaining road legality.",
    tags: ["V8 Twin-Turbo", "592 HP", "Longtail"],
    color: "#4A7C7A",
    accent: "#F4A261"
  },
  {
    label: "06 — Absolute Pinnacle",
    title: "Rolls Royce\nCullinan",
    desc: "The peak of luxury SUVs. Effortless everywhere, providing the most refined and silent ride in the world.",
    tags: ["V12", "Bespoke", "Luxury Peak"],
    color: "#2C3E50",
    accent: "#E9C46A"
  }
];

const Showcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pauseAutoSpinRef = useRef(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupsRef = useRef<THREE.Group[]>([]);
  const statsRef = useRef<any>(null);
  const guiRef = useRef<dat.GUI | null>(null);
  const animationIdRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let stats: any;
    let gui: dat.GUI | null = null;
    let pauseAutoSpin = false;
    let animationId: number;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    const carGroupsRefLocal: THREE.Group[] = [];
    const init = async () => {
      setIsLoading(true);
      setLoadProgress(0);
      carGroupsRef.current = carGroupsRefLocal;
      scene = new THREE.Scene();
      scene.background = null;

      camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 2000);
      camera.position.set(0, 0, 7.5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.AgXToneMapping;
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.autoClear = false;

      const canvas = renderer.domElement;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '10';
      canvas.style.pointerEvents = 'none';
      containerRef.current?.appendChild(canvas);

      stats = new Stats({ trackGPU: false });
      stats.init(renderer);
      stats.dom.style.display = 'none'; 
      document.body.appendChild(stats.dom);

      const gltfLoader = new GLTFLoader();
      const objLoader = new OBJLoader();
      const threeMFLoader = new ThreeMFLoader();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

      // Track loading progress
      const totalModels = modelData.length;
      let loadedModels = 0;

      const updateProgress = () => {
        loadedModels++;
        setLoadProgress(Math.round((loadedModels / totalModels) * 100));
      };

      // Lights
      const keyLight = new THREE.SpotLight(0xfff0e0, 8, 30, Math.PI / 4, 0.5, 1);
      keyLight.position.set(4, 3, 5);
      scene.add(keyLight);

      const fillLight = new THREE.SpotLight(0xd0e0ff, 3, 30, Math.PI / 3, 0.7, 1);
      fillLight.position.set(-5, 1, 3);
      scene.add(fillLight);

      const rimLight = new THREE.SpotLight(0xffffff, 6, 30, Math.PI / 4, 0.4, 1);
      rimLight.position.set(0, 4, -5);
      scene.add(rimLight);

      // Load models
      for (let i = 0; i < modelData.length; i++) {
        const data = modelData[i];
        
        // Resolve URL
        let modelUrl = data.url;
        if (!modelUrl) {
           // Skip or use dummy if no URL provided yet
           const dummy = new THREE.Group();
           dummy.userData = { baseRotation: 0, rotOffset: 0 };
           scene.add(dummy);
           carGroupsRefLocal.push(dummy);
           updateProgress();
           continue;
        }
        
        try {
          let object: THREE.Object3D;
          if (modelUrl.toLowerCase().includes('.obj')) {
            object = await objLoader.loadAsync(modelUrl);
          } else if (modelUrl.toLowerCase().includes('.3mf')) {
            object = await threeMFLoader.loadAsync(modelUrl);
          } else {
            const gltf = await gltfLoader.loadAsync(modelUrl);
            object = gltf.scene;
          }
          
          const group = object as THREE.Group;
          
          // Auto-Fit Logic
          // We compute a fresh bounding box based only on visible mesh geometry 
          // to avoid "poisoned" boxes from lights or helpers in the GLB.
          const computeVisibleBox = (obj: THREE.Object3D) => {
            obj.updateMatrixWorld(true);
            const b = new THREE.Box3();
            obj.traverse((child: any) => {
              if (child.isMesh) {
                if (child.geometry) {
                  child.geometry.computeBoundingBox();
                  const nodeBox = child.geometry.boundingBox.clone();
                  nodeBox.applyMatrix4(child.matrixWorld);
                  b.union(nodeBox);
                }
              }
            });
            return b;
          };

          const box = computeVisibleBox(group);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          // Center geometry to local origin more robustly
          // We apply the offset to the main group's children so they are centered around the group's origin
          const offset = center.clone().negate();
          group.children.forEach(child => {
            child.position.add(offset);
          });

          // Initial scale/pos
          group.scale.setScalar(1);
          group.position.set(0, 0, 0);
          
          group.userData = { 
            originalSize: size.clone(),
            yOffset: data.yOffset || 0,
            scaleMult: data.scaleMult || 1.0, 
            rotOffset: data.rotationOffset, 
            baseRotation: Math.PI / 4 + data.rotationOffset 
          };
          group.rotation.y = group.userData.baseRotation;
          
          group.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              if (typeof mat.metalness === 'number') mat.metalness = Math.max(mat.metalness, 0.5);
              if (typeof mat.roughness === 'number') mat.roughness = Math.min(mat.roughness, 0.2);
            }
          });
          
          scene.add(group);
          carGroupsRefLocal.push(group);
          group.visible = false;
        } catch (err) {
          setLoadError(`Model for ${data.name} could not be loaded.`);
          console.error(`[Showcase] ERROR: Model failed to load via URL: ${modelUrl}`, err);
          // Zero-content Group to prevent crashes while maintaining section count
          const dummy = new THREE.Group();
          dummy.userData = { baseRotation: 0, rotOffset: 0 };
          scene.add(dummy);
          carGroupsRefLocal.push(dummy);
        }
        updateProgress();
      }

      setIsLoading(false);

      if (carGroupsRefLocal.length > 0) carGroupsRefLocal[0].visible = true;
      sceneRef.current = scene;
      rendererRef.current = renderer;
      carGroupsRef.current = carGroupsRefLocal;
      statsRef.current = stats;

      renderer.setAnimationLoop((id) => {
        animationIdRef.current = id;
        animate();
      });
    };

    let mouseX = 0;
    let mouseY = 0;
    const updateMouse = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onWindowResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointermove', updateMouse);

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let autoRotation = 0;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const aspect = vw / vh;
      
      // Calculate Viewport units for the fixed camera
      const fovRad = (camera.fov * Math.PI) / 180;
      const vhUnits = 2 * Math.tan(fovRad / 2) * camera.position.z;
      const vwUnits = vhUnits * aspect;

      // Target Frame Percentages from User Annotation
      const targetFrame = {
        left: 0.247,
        top: 0.273,
        width: 0.562,
        height: 0.532
      };

      // Target 3D Space Coordinates (Relative to screen center)
      const targetCenterX = (targetFrame.left + targetFrame.width / 2 - 0.5) * vwUnits;
      const targetCenterY = (0.5 - (targetFrame.top + targetFrame.height / 2)) * vhUnits;
      const targetWSpace = targetFrame.width * vwUnits;
      const targetHSpace = targetFrame.height * vhUnits;

      targetRotX = -mouseY * 0.2;
      targetRotY = mouseX * 0.2;
      const lerpAlpha = 1 - Math.exp(-4 * delta);
      curRotX += (targetRotX - curRotX) * lerpAlpha;
      curRotY += (targetRotY - curRotY) * lerpAlpha;

      autoRotation += pauseAutoSpinRef.current ? 0 : 0.5 * delta;

      carGroupsRef.current.forEach((group) => {
        if (group && group.userData.originalSize) {
          const modelSize = group.userData.originalSize;
          
          // Auto Scale to fit target frame with safe margins
          const fitScale = Math.min(
            targetWSpace / modelSize.x,
            targetHSpace / modelSize.y
          ) * (group.userData.scaleMult || 1.0); 

          group.scale.setScalar(fitScale);
          group.position.x = targetCenterX;
          group.position.y = targetCenterY + (group.userData.yOffset * vhUnits) - (0.08 * vhUnits); 

          group.rotation.x = curRotX;
          group.rotation.y = (group.userData.baseRotation || 0) + curRotY + autoRotation;
        }
      });

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const S = -rect.top;
      
      // Handle visibility boundary - hide if showroom is above/below or just starting to enter
      // We also update the canvas top to match the showroom entry
      const canvas = renderer.domElement;
      
      // Strict Hero gate: If showing Hero (top of page), hide canvas
      if (rect.top > vh * 0.5) {
        canvas.style.opacity = '0';
        canvas.style.pointerEvents = 'none';
        return;
      }

      if (rect.bottom < 0 || rect.top > vh) {
        canvas.style.opacity = '0';
        return;
      }
      
      // Smoothly fade in/out near boundaries
      // Show only when showroom is partially in view
      const visibilityCutoff = 400; // px margin for aggressive hide
      if (rect.top > vh - visibilityCutoff) {
        canvas.style.opacity = '0';
      } else {
        canvas.style.opacity = '1';
        canvas.style.top = Math.max(0, rect.top) + 'px';
      }

      let topSection = Math.max(0, Math.min(Math.floor(S / vh), sections.length - 1));
      topSection = Math.min(topSection, carGroupsRef.current.length - 1);
      const frac = Math.max(0, Math.min(S / vh - topSection, 1));

      renderer.setScissorTest(false);
      renderer.clear(true, true, true);
      renderer.setScissorTest(true);

      carGroupsRef.current.forEach(mesh => { if (mesh) mesh.visible = false; });

      if (frac < 0.001 || topSection >= sections.length - 1) {
        renderer.setScissor(0, 0, vw, vh);
        renderer.setViewport(0, 0, vw, vh);
        if (carGroupsRef.current[topSection]) carGroupsRef.current[topSection].visible = true;
        renderer.render(scene, camera);
      } else {
        const topH = Math.ceil(vh * (1 - frac));
        renderer.setScissor(0, 0, vw, topH);
        renderer.setViewport(0, 0, vw, vh);
        if (carGroupsRef.current[topSection]) {
          carGroupsRef.current[topSection].visible = true;
          renderer.render(scene, camera);
          carGroupsRef.current[topSection].visible = false;
        }

        const bottomH = Math.ceil(vh * frac);
        renderer.setScissor(0, vh - bottomH, vw, bottomH);
        renderer.setViewport(0, 0, vw, vh);
        if (carGroupsRef.current[topSection + 1]) {
          carGroupsRef.current[topSection + 1].visible = true;
          renderer.render(scene, camera);
          carGroupsRef.current[topSection + 1].visible = false;
        }
      }

      renderer.setScissorTest(false);
      statsRef.current?.update();
      if (renderer.resolveTimestampsAsync) {
        // @ts-ignore
        renderer.resolveTimestampsAsync(THREE.TimestampQuery.RENDER);
      }
    };

    init();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('pointermove', updateMouse);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = 0;
      }
      
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
        rendererRef.current.dispose();
        rendererRef.current.domElement?.remove();
        rendererRef.current = null;
      }
      
      if (statsRef.current?.dom) {
        statsRef.current.dom.remove();
        statsRef.current = null;
      }
      
      destroyGUI();
    };
  }, []); // Init once on mount

  const createGUI = (carGroups: THREE.Group[]) => {
    if (guiRef.current) return;
    
    guiRef.current = new dat.GUI({ autoPlace: false, width: 380 });
    guiRef.current.domElement.style.cssText = 'position:fixed;right:20px;top:80px;z-index:1000;font-family:monospace;background:rgba(0,0,0,0.9);border-radius:12px;box-shadow:0 0 20px rgba(0,0,0,0.5);overflow:hidden;';
    document.body.appendChild(guiRef.current.domElement);

    carGroups.forEach((group, i) => {
      if (!group.userData?.baseRotation && group.children.length === 0) return; // Skip invalid/empty
      const folder = guiRef.current!.addFolder(`#${i+1} ${modelData[i].name}`, { closed: i > 0 });
      folder.add(group.userData, 'yOffset', -1, 1, 0.001).name('Y Shift (v%)');
      folder.add(group.userData, 'scaleMult', 0.1, 2, 0.001).name('Fit Multiplier');
      folder.add(group.userData, 'baseRotation', -Math.PI*2, Math.PI*2, 0.01).name('Base Rot');
      folder.add({ undo: () => {
        const d = modelData[i];
        group.userData.yOffset = d.yOffset || 0;
        // @ts-ignore
        group.userData.scaleMult = d.scaleMult || 1;
        group.userData.baseRotation = Math.PI / 4 + d.rotationOffset;
      }}, 'undo').name('↶ RESET');
    });

    const controls = {
      toggleSpin: () => { pauseAutoSpinRef.current = !pauseAutoSpinRef.current; },
      saveAll: () => {
        const data = carGroups.map((g, i) => ({
          name: modelData[i].name,
          url: modelData[i].url,
          yOffset: Number(g.userData.yOffset.toFixed(3)),
          scaleMult: Number(g.userData.scaleMult.toFixed(3)),
          rotationOffset: Number((g.userData.baseRotation - Math.PI / 4).toFixed(3))
        }));
        console.log('FINAL SETTINGS:', JSON.stringify(data, null, 2));
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert('All settings copied to clipboard!');
      }
    };

    guiRef.current.add(controls, 'toggleSpin').name('⏸ TOGGLE SPIN');
    guiRef.current.add(controls, 'saveAll').name('💾 SAVE ALL');
    guiRef.current.open();
  };

  const destroyGUI = () => {
    if (guiRef.current) {
      guiRef.current.destroy();
      guiRef.current = null;
    }
  };

  useEffect(() => {
    if (!carGroupsRef.current.length) return;
    if (isEditMode) {
      createGUI(carGroupsRef.current);
    } else {
      destroyGUI();
    }
    return destroyGUI;
  }, [isEditMode]);


  return (
    <div className="relative z-10 pointer-events-none" ref={containerRef}>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md pointer-events-auto"
          >
            <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-6" />
            <div className="flex flex-col items-center gap-2 text-center px-10">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black">818 EXOTIC FLEET INITIALIZING</span>
              <div className="w-64 h-1 bg-black/5 rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loadProgress}%` }}
                  className="h-full bg-accent"
                />
              </div>
              <span className="text-[8px] font-bold text-black/30 uppercase tracking-widest mt-2">{loadProgress}% Synchronized</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Mode Guide Box */}
      {isEditMode && (
        <div 
          className="fixed z-50 border-2 border-dashed border-accent/40 pointer-events-none"
          style={{
            left: '24.7%',
            top: '27.3%',
            width: '56.2%',
            height: '53.2%',
          }}
        >
          <span className="absolute -top-6 left-0 bg-accent text-black text-[8px] font-bold px-2 py-0.5 rounded-sm">TARGET FRAME (AUTO-FIT)</span>
        </div>
      )}

      {/* Load Error Notification */}
      <AnimatePresence>
        {loadError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-100 bg-red-500/10 backdrop-blur-md border border-red-500/20 px-6 py-4 rounded-sm flex items-center gap-4 text-red-500 pointer-events-auto"
          >
            <AlertCircle size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest">System Warning</span>
              <span className="text-xs">{loadError}</span>
            </div>
            <button onClick={() => setLoadError(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Mode Toggle */}
      <div className="fixed top-32 right-8 z-[200] pointer-events-auto">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-xl ${
            isEditMode 
              ? 'bg-accent text-white shadow-accent/20' 
              : 'bg-black text-white hover:bg-accent'
          }`}
        >
          {isEditMode ? <Save size={14} /> : <Settings size={14} />}
          {isEditMode ? 'Exit & Sync' : 'Edit Mode'}
        </button>
      </div>

      {sections.map((section, i) => (
        <section
          key={i}
          className={`relative w-full h-screen flex items-center p-10 md:p-24 transition-colors duration-1000 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          style={{ backgroundColor: `${section.color}0D` }}
        >
          {/* Decorative background character */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none overflow-hidden w-full h-full flex items-center justify-center opacity-[0.03]">
            <span className="text-[60vh] font-serif font-black tracking-tighter uppercase" style={{ color: section.accent }}>
              {section.title.charAt(0)}
            </span>
          </div>

          <div className={`max-w-xl pointer-events-auto ${i % 2 === 0 ? 'text-left' : 'text-right'}`}>
            <div 
              className="text-[10px] font-bold uppercase tracking-[0.6em] mb-6 transition-colors duration-500"
              style={{ color: section.accent }}
            >
              {section.label}
            </div>
            
            <h2 className="text-5xl md:text-8xl font-serif font-bold mb-8 leading-[0.85] tracking-tighter whitespace-pre-line uppercase text-black">
              {section.title.split('\n').map((line, idx) => (
                <span key={idx} className="block last:text-black/40">
                  {line}
                </span>
              ))}
            </h2>

            <div className={`flex flex-col gap-8 ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
              <p className="text-black/70 text-base md:text-lg leading-relaxed max-w-sm font-light">
                {section.desc}
              </p>
              
              <div className="flex flex-wrap gap-3">
                {section.tags.map((tag, j) => (
                  <span 
                    key={j} 
                    className="px-4 py-1.5 border border-black/10 rounded-full text-[9px] uppercase tracking-[0.2em] font-medium transition-all hover:bg-black/5"
                    style={{ borderColor: j === 0 ? `${section.accent}44` : undefined, color: j === 0 ? section.accent : undefined }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Subtle highlight line */}
            <div 
              className={`mt-12 h-[1px] w-24 transition-all duration-1000 ${i % 2 === 0 ? 'origin-left' : 'origin-right'}`}
              style={{ backgroundColor: section.accent }}
            />
          </div>
        </section>
      ))}
    </div>
  );
};

export default Showcase;
