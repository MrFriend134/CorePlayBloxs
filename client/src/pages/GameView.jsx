import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useSocket } from '../hooks/useSocket';
import '../styles/GameView.css';

const GAME_NAMES = { obby: 'Obby Park', tag: 'Tag', lobby: 'City Lobby' };

function addMesh(root, geom, color, x, y, z, castShadow = true) {
  const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function buildSceneForGame(scene, gameId) {
  const toRemove = [];
  scene.traverse(c => { if (c.userData?.gameScene) toRemove.push(c); });
  toRemove.forEach(c => { if (c.parent) c.parent.remove(c); });

  const root = new THREE.Group();
  root.userData.gameScene = true;

  if (gameId === 'obby') {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x1b5e20 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);
    const colors = [0x00a651, 0x007a3d, 0x2e7d32, 0x388e3c];
    const platforms = [
      [0, 0.5, 0, 10, 1, 10],
      [0, 1.5, -8, 6, 1, 4],
      [4, 2.5, -12, 4, 1, 4],
      [-3, 3, -16, 5, 1, 3],
      [0, 3.5, -20, 4, 1, 6],
      [6, 4, -24, 3, 1, 4],
      [-2, 4.5, -28, 5, 1, 4],
      [0, 5.5, -32, 8, 1, 6],
    ];
    platforms.forEach(([x, y, z, w, h, d], i) => {
      addMesh(root, new THREE.BoxGeometry(w, h, d), colors[i % colors.length], x, y, z);
    });
    const steps = [
      [-8, 0.5, -4], [-6, 1, -5], [-4, 1.5, -6], [-2, 2, -7],
    ];
    steps.forEach(([x, y, z], i) => {
      addMesh(root, new THREE.BoxGeometry(2.5, 0.5 + i * 0.5, 2), 0x00a651, x, y, z);
    });
    addMesh(root, new THREE.BoxGeometry(6, 0.8, 6), 0xffc107, 0, 6, -32);
  } else if (gameId === 'tag') {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x1b5e20 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);
    const obstacles = [
      [0, 1, 0, 3, 2, 3],
      [8, 0.8, 8, 4, 1.6, 4],
      [-8, 1.2, -6, 3, 2.4, 3],
      [6, 0.6, -10, 5, 1.2, 2],
      [-10, 1, 6, 2, 2, 4],
      [12, 0.8, -4, 3, 1.6, 3],
      [-6, 1.5, 10, 4, 3, 2],
      [0, 0.5, -14, 8, 1, 2],
      [0, 0.5, 14, 8, 1, 2],
      [-14, 0.5, 0, 2, 1, 10],
      [14, 0.5, 0, 2, 1, 10],
    ];
    obstacles.forEach(([x, y, z, w, h, d], i) => {
      addMesh(root, new THREE.BoxGeometry(w, h, d), i % 2 ? 0x00a651 : 0x007a3d, x, y, z);
    });
    addMesh(root, new THREE.CylinderGeometry(2, 2, 4, 8), 0x00a651, 0, 2, 0);
  } else {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x37474f })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 12),
      new THREE.MeshStandardMaterial({ color: 0x455a64 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    road.receiveShadow = true;
    root.add(road);
    const road2 = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 80),
      new THREE.MeshStandardMaterial({ color: 0x455a64 })
    );
    road2.rotation.x = -Math.PI / 2;
    road2.position.set(0, 0.01, 0);
    road2.receiveShadow = true;
    root.add(road2);
    const buildings = [
      [15, 5, 10, 14, 10, 12, 0x16213e],
      [-15, 4, -8, 12, 8, 10, 0x0f3460],
      [12, 6, -12, 10, 12, 8, 0x1a237e],
      [-10, 3, 12, 8, 6, 8, 0x283593],
      [18, 4, -5, 8, 8, 10, 0x0f3460],
      [-18, 5, 5, 10, 10, 8, 0x16213e],
    ];
    buildings.forEach(([x, h, z, w, height, d, color]) => {
      addMesh(root, new THREE.BoxGeometry(w, height, d), color, x, height / 2, z);
    });
    addMesh(root, new THREE.BoxGeometry(16, 6, 12), 0x00a651, 0, 3, 0);
    [[8, 1.5, 8], [-6, 2, -10], [10, 1, -5]].forEach(([x, y, z], i) => {
      addMesh(root, new THREE.CylinderGeometry(0.8, 1, y * 2, 8), 0x2e7d32, x, y, z);
    });
  }

  scene.add(root);
  return root;
}

export default function GameView() {
  const { gameId: paramId } = useParams();
  const gameId = paramId || 'lobby';
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerMeshesRef = useRef({});
  const { connected, me, players, messages, move, sendChat } = useSocket(gameId);
  const [chatInput, setChatInput] = useState('');
  const keysRef = useRef({});
  const posRef = useRef([0, 1.5, 8]);
  const rotRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 80);
    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 500);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 0.6));

    buildSceneForGame(scene, gameId);
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
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current)
        containerRef.current.removeChild(renderer.domElement);
    };
  }, [gameId]);

  useEffect(() => {
    if (!sceneRef.current || !me) return;
    const scene = sceneRef.current;
    const mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
      new THREE.MeshStandardMaterial({ color: (me.avatar?.skinColor && me.avatar.skinColor !== '') ? new THREE.Color(me.avatar.skinColor) : 0xe8b88a })
    );
    body.castShadow = true;
    mesh.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: (me.avatar?.skinColor && me.avatar.skinColor !== '') ? new THREE.Color(me.avatar.skinColor) : 0xe8b88a })
    );
    head.position.y = 1;
    head.castShadow = true;
    mesh.add(head);
    mesh.position.set(me.position[0], me.position[1], me.position[2]);
    mesh.rotation.y = me.rotation[0] ?? 0;
    scene.add(mesh);
    playerMeshesRef.current[me.socketId] = mesh;
    return () => {
      scene.remove(mesh);
      delete playerMeshesRef.current[me.socketId];
    };
  }, [me]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    players.forEach((p) => {
      let mesh = playerMeshesRef.current[p.socketId];
      if (!mesh) {
        mesh = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
          new THREE.MeshStandardMaterial({ color: (p.avatar?.skinColor && p.avatar.skinColor !== '') ? new THREE.Color(p.avatar.skinColor) : 0xe8b88a })
        );
        body.castShadow = true;
        mesh.add(body);
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 16, 16),
          new THREE.MeshStandardMaterial({ color: (p.avatar?.skinColor && p.avatar.skinColor !== '') ? new THREE.Color(p.avatar.skinColor) : 0xe8b88a })
        );
        head.position.y = 1;
        head.castShadow = true;
        mesh.add(head);
        scene.add(mesh);
        playerMeshesRef.current[p.socketId] = mesh;
      }
      mesh.position.set(p.position[0], p.position[1], p.position[2]);
      mesh.rotation.y = p.rotation[0] ?? 0;
    });
    Object.keys(playerMeshesRef.current).forEach((sid) => {
      if (!players.find(p => p.socketId === sid)) {
        const mesh = playerMeshesRef.current[sid];
        if (mesh) scene.remove(mesh);
        delete playerMeshesRef.current[sid];
      }
    });
  }, [players]);

  useEffect(() => {
    const handleKeyDown = (e) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const gameLoop = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;
    const k = keysRef.current;
    const speed = 0.12;
    const rotSpeed = 0.04;
    if (k['KeyW']) { posRef.current[0] -= Math.sin(rotRef.current) * speed; posRef.current[2] -= Math.cos(rotRef.current) * speed; }
    if (k['KeyS']) { posRef.current[0] += Math.sin(rotRef.current) * speed; posRef.current[2] += Math.cos(rotRef.current) * speed; }
    if (k['KeyA']) rotRef.current += rotSpeed;
    if (k['KeyD']) rotRef.current -= rotSpeed;
    posRef.current[1] = 1.5;
    move([...posRef.current], [rotRef.current, 0, 0]);
    const myMesh = me && playerMeshesRef.current[me.socketId];
    if (myMesh) {
      myMesh.position.set(posRef.current[0], posRef.current[1], posRef.current[2]);
      myMesh.rotation.y = rotRef.current;
    }
    camera.position.set(posRef.current[0], posRef.current[1] + 3, posRef.current[2] + 6);
    camera.lookAt(posRef.current[0], posRef.current[1], posRef.current[2]);
    renderer.render(scene, camera);
  }, [move, me]);

  useEffect(() => {
    let raf;
    const tick = () => {
      gameLoop();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameLoop]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChat(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div className="game-view">
      <div className="game-ui-top">
        <button className="game-back-btn" onClick={() => navigate('/')}>← Salir</button>
        <span className="game-title">{GAME_NAMES[gameId] || gameId}</span>
        <span className="game-status">{connected ? '● Conectado' : '○ Desconectado'}</span>
      </div>
      <div ref={containerRef} className="game-canvas" />
      <div className="game-chat">
        <div className="chat-messages">
          {messages.slice(-20).map((m, i) => (
            <div key={i} className="chat-msg">
              <strong>{m.username}:</strong> {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="chat-form">
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Escribe en el chat..." maxLength={500} />
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  );
}
