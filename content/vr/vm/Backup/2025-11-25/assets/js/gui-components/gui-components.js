import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as UTILS from "../utility/utils.js";

import { SplashPanelDimensions as SPD } from "../utility/component-settings.js";

export class SplashPanel {

  #scene;
  #platform;
  #screenWidth;

  #uniScale;
  #modScale;

  #panel;
  #platformStatus;
  #worldDataStatus;
  #commonModelStatus;
  #regionStatus;
  #traipseStatus;
  #lowerBlock;

  #fadeDuration;
  #fadeIncrement;

  #size;
  #dims;

  constructor(scene, platform, screenWidth, uniScale, modScale) {

    this.#scene = scene;
    this.#platform = platform;
    this.#screenWidth = screenWidth;

    if(this.#platform === "MOBILE") {

      this.#dims = SPD.MOBILE;

    } else if(this.#platform === "HEADSET") {

      this.#dims = SPD.HEADSET;

    } else if(this.#platform === "PC") {

      if(this.#screenWidth < 993)
        this.#size = "SMALL";
      else if(this.#screenWidth >= 993 && this.#screenWidth < 1200)
        this.#size = "MEDIUM"
      else if(this.#screenWidth >= 1200)
        this.#size = "LARGE";
      else
        this.#size = "MEDIUM";
      
      this.#dims = SPD.PC[this.#size];

    } else {

      this.#dims = SPD.UNKNOWN;
    }

    this.#uniScale = uniScale;
    this.#modScale = modScale;

    this.#panel = null;
    this.#fadeDuration = 1000;
    this.#fadeIncrement = 20;
  }

  getPanel() { return this.#panel; }

  buildPanel() {

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    const dims = this.#dims;

    this.#panel = new MESH_UI.Block({
      width: dims.width,
      height: dims.height, 
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundColor: new THREE.Color("#FF0000"),
      backgroundOpacity: 1,
      justifyContent: "center"
    });
    
    const titleBlock = new MESH_UI.Block({
      width: dims.width,
      height: dims.titleHeight,
      padding: dims.padding,
      borderRadius: 0,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",  
      backgroundOpacity: 0,
      offset: 0.001
    });

    const splashTitle = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.largeFont,
      content: "The Follies of Worsbrough Common",
      offset: 0.001,
      textAlign: "center"
    });  

    titleBlock.add(splashTitle)
    this.#panel.add(titleBlock);

    const contentBlock = new MESH_UI.Block({
      width: dims.width,
      height: dims.contentHeight,
      padding: dims.padding,
      borderRadius: 0,
      backgroundOpacity: 0,
      offset: 0.001
    });    

    this.#panel.add(contentBlock);

    const leftBlock = new MESH_UI.InlineBlock({
      width: (dims.width * 0.3),
      height: dims.contentHeight,
      borderRadius: 0,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundOpacity: 0,
      offset: 0.001,
      textAlign: "left",
      alignItems: "start"
    });    

    contentBlock.add(leftBlock);

    const platformLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "Device Platform",
      offset: 0.001
    });  

    leftBlock.add(platformLabel);

    const worldDataLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\nWorld Data",
      offset: 0.001
    });  

    leftBlock.add(worldDataLabel);

    const commonModelLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\nCommon Models",
      offset: 0.001
    });

    leftBlock.add(commonModelLabel);

    const regionLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\nRegions",
      offset: 0.001
    });

    leftBlock.add(regionLabel);

    const traipseLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\nReady to Traipse?",
      offset: 0.001
    });

    leftBlock.add(traipseLabel);

    const rightBlock = new MESH_UI.InlineBlock({
      width: (dims.width * 0.6),
      height: dims.contentHeight,
      borderRadius: 0,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundOpacity: 0,
      offset: 0.001,
      textAlign: "right",
      alignItems: "end"
    });    

    contentBlock.add(rightBlock);

    this.#platformStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "[ waiting ]",
      offset: 0.001
    });  

    rightBlock.add(this.#platformStatus);

    this.#worldDataStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "[ waiting ]",
      offset: 0.001
    });  

    rightBlock.add(this.#worldDataStatus);

    this.#commonModelStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\n[ waiting ]",
      offset: 0.001
    });

    rightBlock.add(this.#commonModelStatus);

    this.#regionStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\n[ waiting ]",
      offset: 0.001
    });

    rightBlock.add(this.#regionStatus);

    this.#traipseStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: dims.smallFont,
      content: "\n[ hold thi hosses ]",
      offset: 0.001
    });

    rightBlock.add(this.#traipseStatus);    

    this.#lowerBlock = new MESH_UI.Block({
      width: (dims.lowerHeight * 0.749),
      height: dims.lowerHeight,
      borderRadius: 0.01,
      borderColor: new THREE.Color("#909090"),
      borderWidth: dims.lowerBorder
    });

    const loader = new THREE.TextureLoader();
    loader.load(
        
      "./assets/images/gui/kingwell-tower.png",
        
      (texture) => {
          
        const img = texture.image;
        this.#lowerBlock.set({
          backgroundTexture: texture,
          backgroundSize: "contain",
        });
      }
    );

    this.#panel.add(this.#lowerBlock);
    this.#scene.add(this.#panel);
  }

  updatePanel(item, status) {

    switch(item) {

      case "PlatformData":
        this.#platformStatus.set( { content: ("\n[ " + status + " ]") } );
        break;
      case "WorldData":
        this.#worldDataStatus.set( { content: ("\n[ " + status + " ]") } );
        break;
      case "CommonModelData":
        this.#commonModelStatus.set( { content: ("\n[ " + status + " ]") } );
        break;        
      case "RegionData":
        this.#regionStatus.set( { content: ("\n[ " + status + " ]") } );
        break;    
      case "TraipseData":
        this.#traipseStatus.set( { content: ("\n[ get thisen off ]") } );
        setTimeout(this.#removePanel.bind(this), 1000);
        break;                
    }
  }

  updatePosition(cam, camPos, camQuat, offsets) {

    const pane = this.#panel;

    cam.getWorldPosition(camPos);
    cam.getWorldQuaternion(camQuat);

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camQuat);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camQuat);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat);

    const worldPos = camPos
      .clone()
      .addScaledVector(right, offsets.x)
      .addScaledVector(up, offsets.y)
      .addScaledVector(forward, offsets.z);

    pane.position.copy(worldPos);
    pane.quaternion.copy(camQuat);     
  }

  #removePanel() {

    const decrement = (1 / this.#fadeIncrement);
    const opacity = (this.#panel.backgroundOpacity - decrement);

    if(opacity <= 0) {

      this.#panel.set( { backgroundOpacity: 0, fontOpacity: 0 } );
      this.#lowerBlock.set( { backgroundOpacity: 0, borderOpacity: 0 } );
      UTILS.removeAndDisposeObject3D(this.#panel);
      this.#panel = null;
    
    } else {

      this.#panel.set( { backgroundOpacity: opacity, fontOpacity: opacity } );
      this.#lowerBlock.set( { backgroundOpacity: opacity, borderOpacity: opacity } );
      setTimeout(this.#removePanel.bind(this), (this.#fadeDuration / this.#fadeIncrement));
    }
  }
}

export function createPerfHud(renderer, camera, opts={}) {
  const cfg = Object.assign({
    width: 256, height: 128,         // canvas size
    metersWide: 0.40,                 // on-screen width in meters
    offset: new THREE.Vector3(0, -0.12, -0.65), // relative to head (x,y,z)
    corner: 'right',                  // 'right' or 'left'
    softDraws: 900, hardDraws: 1500,
    softTris:  800_000, hardTris: 1_500_000
  }, opts);

  // 2D canvas we’ll draw into
  const cvs = document.createElement('canvas');
  cvs.width = cfg.width; cvs.height = cfg.height;
  const ctx = cvs.getContext('2d');
  ctx.font = '12px system-ui, sans-serif';

  // Make a texture & material
  const tex = new THREE.CanvasTexture(cvs);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 1;
  tex.needsUpdate = true;

  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false });
  const aspect = cfg.height / cfg.width;
  const w = cfg.metersWide, h = w * aspect;
  const geo = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 9999; // draw last
  mesh.frustumCulled = false;

  // Attach to the camera so it’s head-locked
  const anchor = new THREE.Object3D();
  anchor.add(mesh);
  camera.add(anchor);

  // Position to side
  const xSign = (cfg.corner === 'right') ? 1 : -1;
  mesh.position.copy(new THREE.Vector3(cfg.offset.x * xSign, cfg.offset.y, cfg.offset.z));

  // FPS smoothing
  let last = performance.now(), fps = 0;

  function draw() {
    const info = renderer.info;
    const draws = info.render.calls;
    const tris  = info.render.triangles;
    const geoms = info.memory.geometries;
    const texs  = info.memory.textures;
    const progs = info.programs ? info.programs.length : 0;

    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    fps = fps ? (fps * 0.9 + (1/dt) * 0.1) : (1/dt);

    // bg colour by budget
    let bg = 'rgba(0,0,0,0.55)';
    if (draws > cfg.hardDraws || tris > cfg.hardTris) bg = 'rgba(180, 30, 30, 0.70)';
    else if (draws > cfg.softDraws || tris > cfg.softTris) bg = 'rgba(200, 120, 0, 0.70)';

    ctx.clearRect(0,0,cfg.width,cfg.height);
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,cfg.width,cfg.height);

    ctx.fillStyle = '#ddd';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('Perf', 8, 18);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`FPS: ${fps.toFixed(1)}  (${(1000/fps).toFixed(1)} ms)`, 8, 38);
    ctx.fillText(`Draws: ${draws.toLocaleString()}`, 8, 58);
    ctx.fillText(`Tris:  ${tris.toLocaleString()}`, 8, 76);
    ctx.fillText(`Geoms: ${geoms}  Tex: ${texs}  Prog: ${progs}`, 8, 96);

    tex.needsUpdate = true;
  }

  return {
    object: anchor,
    update() { draw(); }
  };
}

export function buildDebugPanel(camera, uniScale, modScale) {

  const panel = new MESH_UI.Block({
    width: UTILS.scaleDistance(0.25, uniScale, modScale),
    height: UTILS.scaleDistance(0.25, uniScale, modScale),
    padding: UTILS.scaleDistance(0.035, uniScale, modScale),
    borderRadius: UTILS.scaleDistance(0.035, uniScale, modScale),
    fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
    fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
    backgroundColor: new THREE.Color("#FF0000"),
    backgroundOpacity: 0.8,
    justifyContent: "start",
    alignItems: "start",
    textAlign: "left"
  });

  const text = new MESH_UI.Text({
    fontColor: new THREE.Color("#FFFFFF"),
    fontSize: (0.03 * modScale * uniScale),
    content: "Debug",
    offset: 0.001
  });  

  panel.add(text);
  return { panel: panel, text: text };
} 

export function buildLocationPanel(camera, uniScale, modScale) {

  const panel = new MESH_UI.Block({
    width: 0.50, //UTILS.scaleDistance(1.1, uniScale, modScale),
    height: 0.044, //UTILS.scaleDistance(0.075, uniScale, modScale),
    //fontSize: UTILS.scaleDistance(0.04, uniScale, modScale),
    //padding: UTILS.scaleDistance(0.12, uniScale, modScale),
    fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
    fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
    backgroundColor: new THREE.Color("#FF0000"),
    backgroundOpacity: 0.8,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
  });

  const text = new MESH_UI.Text({
    fontColor: new THREE.Color("#FFFFFF"),
    fontSize: 0.022, //(0.05 * modScale * uniScale),
    content: "Current Location",
    offset: 0.001
  });  

  panel.add(text);
  return { panel: panel, text: text };
}  

export function updateLocationPanel(pane, cam, camPos, camQuat, offsets) {
       
  cam.getWorldPosition(camPos);
  cam.getWorldQuaternion(camQuat);

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camQuat);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camQuat);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat);

  const worldPos = camPos
    .clone()
    .addScaledVector(right, offsets.x)
    .addScaledVector(up, offsets.y)
    .addScaledVector(forward, offsets.z);

  pane.position.copy(worldPos);
  pane.quaternion.copy(camQuat);    
}

export function updateDebugPanel(pane, cam, camPos, camQuat, offsets) {
       
  cam.getWorldPosition(camPos);
  cam.getWorldQuaternion(camQuat);

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camQuat);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camQuat);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camQuat);

  const worldPos = camPos
    .clone()
    .addScaledVector(right, offsets.x)
    .addScaledVector(up, offsets.y)
    .addScaledVector(forward, offsets.z);

  pane.position.copy(worldPos);
  pane.quaternion.copy(camQuat);    
}