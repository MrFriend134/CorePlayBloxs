import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { runLua } from '../utils/luaRunner';
import '../styles/Editor.css';

const TOOLS = ['select', 'move', 'block', 'sphere', 'script'];
const BLOCK_COLORS = [0x00a651, 0x007a3d, 0x16213e, 0x0f3460, 0xe74c3c, 0xf39c12];

export default function Editor() {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [tool, setTool] = useState('block');
  const [colorIdx, setColorIdx] = useState(0);
  const [objects, setObjects] = useState([]);
  const [scriptContent, setScriptContent] = useState('-- Lua (lógica del juego)\nprint("Hola desde Lua!")\nfor i = 1, 3 do\n  print("Paso", i)\nend\n');
  const [selectedId, setSelectedId] = useState(null);
  const [luaOutput, setLuaOutput] = useState([]);
  const [luaError, setLuaError] = useState(null);
  const [luaRunning, setLuaRunning] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 500);
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(30, 30, 0x00a651, 0x333333);
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x16213e, side: THREE.DoubleSide })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 0.5));

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const onResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);


  const addObject = useCallback((type, position) => {
    const id = 'obj_' + Date.now();
    const color = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];
    if (type === 'block') {
      setObjects(prev => [...prev, { id, type, position: position || [0, 0.5, 0], size: [1, 1, 1], color }]);
    } else {
      setObjects(prev => [...prev, { id, type, position: position || [0, 1, 0], radius: 1, color }]);
    }
  }, [colorIdx]);

  useEffect(() => {
    let raf;
    const tick = () => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (scene && camera && renderer) renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClick = useCallback((e) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    if (tool !== 'select') {
      raycasterRef.current.ray.intersectPlane(planeRef.current, intersectRef.current);
      const pos = [intersectRef.current.x, 0.5, intersectRef.current.z];
      if (tool === 'block' || tool === 'sphere') addObject(tool, pos);
    }
    const meshes = sceneRef.current.children.filter(c => c.isMesh && c.name?.startsWith('obj_'));
    const hits = raycasterRef.current.intersectObjects(meshes);
    if (hits.length > 0 && tool === 'select') setSelectedId(hits[0].object.name);
  }, [tool, addObject]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.addEventListener('click', handleClick);
    return () => containerRef.current?.removeEventListener('click', handleClick);
  }, [handleClick]);

  const syncSceneFromObjects = () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    scene.children.filter(c => c.name?.startsWith('obj_')).forEach(c => scene.remove(c));
    objects.forEach((obj) => {
      let geom, mat;
      if (obj.type === 'block') {
        geom = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
        mat = new THREE.MeshStandardMaterial({ color: obj.color });
      } else {
        geom = new THREE.SphereGeometry(obj.radius || 1, 32, 32);
        mat = new THREE.MeshStandardMaterial({ color: obj.color });
      }
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
      mesh.name = obj.id;
      mesh.userData = { ...obj, editorId: obj.id };
      scene.add(mesh);
    });
  };

  useEffect(() => {
    syncSceneFromObjects();
  }, [objects]);

  const runLuaScript = useCallback(async () => {
    setLuaError(null);
    setLuaOutput([]);
    setLuaRunning(true);
    try {
      const result = await runLua(scriptContent, (line) => setLuaOutput((prev) => [...prev, line]));
      if (result.ok) {
        if (result.output.length > 0) setLuaOutput(result.output);
        else setLuaOutput(['(script terminó sin output)']);
      } else {
        setLuaError(result.error);
      }
    } catch (e) {
      setLuaError(e.message || String(e));
    } finally {
      setLuaRunning(false);
    }
  }, [scriptContent]);

  return (
    <div className="editor-view">
      <header className="editor-header">
        <button className="editor-back" onClick={() => navigate('/')}>← Menú</button>
        <span className="editor-title">CorePlayBlox Studio</span>
        <button className="editor-play" onClick={() => navigate('/play/lobby')}>Play</button>
      </header>
      <div className="editor-toolbar">
        {TOOLS.map((t) => (
          <button key={t} className={tool === t ? 'active' : ''} onClick={() => setTool(t)}>{t}</button>
        ))}
        <div className="color-strip">
          {BLOCK_COLORS.map((c, i) => (
            <button key={i} className="color-swatch" style={{ background: '#' + c.toString(16).padStart(6, '0') }} onClick={() => setColorIdx(i)} />
          ))}
        </div>
      </div>
      <div ref={containerRef} className="editor-canvas" />
      <aside className="editor-sidebar">
        <h3>Objetos</h3>
        <ul className="objects-list">
          {objects.map((o) => (
            <li key={o.id} className={selectedId === o.id ? 'selected' : ''} onClick={() => setSelectedId(o.id)}>
              {o.type} {o.id.slice(-6)}
            </li>
          ))}
        </ul>
        <h3>Lua (lógica)</h3>
        <textarea className="script-editor" value={scriptContent} onChange={(e) => setScriptContent(e.target.value)} spellCheck={false} />
        <button type="button" className="btn-run-lua" onClick={runLuaScript} disabled={luaRunning}>
          {luaRunning ? 'Ejecutando...' : '▶ Ejecutar Lua'}
        </button>
        {(luaOutput.length > 0 || luaError) && (
          <div className="lua-console">
            {luaError && <div className="lua-console-error">{luaError}</div>}
            {luaOutput.map((line, i) => (
              <div key={i} className="lua-console-line">{line}</div>
            ))}
          </div>
        )}
        <p className="script-hint">Lua 5.3 (fengari). print() se muestra abajo.</p>
      </aside>
    </div>
  );
}
