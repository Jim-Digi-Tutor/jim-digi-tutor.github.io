import * as MESH_UI from "mesh-ui";
import * as THREE from "three";
import * as UTILS from "./utility/utils.js";

import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

export class SetupManager {

  #isMobileBrowser;
  #isHeadsetBrowser;
  #isDesktopEmulator;
  #hasXR;
  #supportsVR;
  #ua;

  constructor() {

    // Configure the values to enable browser detection
    this.#isMobileBrowser = false;
    this.#isHeadsetBrowser = false;
    this.#isDesktopEmulator = false;
    this.#hasXR = false;
    this.#supportsVR = false;
    this.#ua = navigator.userAgent || "";
  }

  async detectPlatform() {

    const ua = navigator.userAgent || "";
    const uaData = navigator.userAgentData || null;

    // --- Detect mobile devices (UA or coarse pointer)
    const isMobile =
      (uaData?.mobile === true) ||
      matchMedia?.("(pointer:coarse)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

    // --- Check WebXR / VR support
    const hasXR = "xr" in navigator;
    const supportsVR = hasXR
      ? await navigator.xr.isSessionSupported("immersive-vr").catch(() => false)
      : false;

    // --- Known headset browsers
    const headsetUA =
      /OculusBrowser|Quest|Meta Quest|Viveport|PicoBrowser|PICO|LenovoVR|XRBrowser/i.test(
        ua
      );

    // --- Determine if it's a headset browser
    const isHeadsetBrowser = supportsVR && (headsetUA || !uaData || uaData.mobile);

    // --- Desktop heuristic (for emulator detection)
    const isDesktop =
      !isMobile &&
      (/Windows|Macintosh|Linux x86_64/i.test(ua) ||
        uaData?.platform !== "Android");

    const isDesktopEmulator = supportsVR && isDesktop && !headsetUA;

    // --- Store results
    this.#isMobileBrowser = isMobile && !isHeadsetBrowser;
    this.#isHeadsetBrowser = isHeadsetBrowser;
    this.#isDesktopEmulator = isDesktopEmulator;
    this.#hasXR = hasXR;
    this.#supportsVR = supportsVR;
    this.#ua = ua;

    // Return results for convenience
    return {
      isMobileBrowser: this.#isMobileBrowser,
      isHeadsetBrowser: this.#isHeadsetBrowser,
      isDesktopEmulator: this.#isDesktopEmulator,
      hasXR: this.#hasXR,
      supportsVR: this.#supportsVR,
      ua: this.#ua
    };
  }

  setupRenderer() {

    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;    
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  }

  setupScene(renderer) {

    // Initialise the scene
    const scene = new THREE.Scene();
    
    // Create and position the scene camera
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Setup the audio listener
    const listener = new THREE.AudioListener();
    camera.add(listener);  

    const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new RGBELoader()
  .load('assets/hdr/meadow_2_1k.hdr', (hdrTex) => {
    const envMap = pmrem.fromEquirectangular(hdrTex).texture;
    scene.environment = envMap;         // PBR reflections + diffuse via IBL
    // optional: scene.background = envMap; // if you want to see it
    
        const cubeRT = new THREE.WebGLCubeRenderTarget(256)
      .fromEquirectangularTexture(renderer, hdrTex);

    const probe = LightProbeGenerator.fromCubeRenderTarget(renderer, cubeRT);
    scene.add(probe);

    hdrTex.dispose();
        cubeRT.dispose();
    pmrem.dispose();
  });

renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.35;

scene.background = new THREE.Color(0x0a0a0c);
scene.fog = new THREE.FogExp2(0x0a0a0c, 0.05);

    return {
      scene: scene,
      camera: camera,
      listener: listener
    };
  }

  ascertainCameraHeight() {

    return 1;
  }

  ascertainUniversalScale() {

    return 5;
  }

  ascertainModelScale() {

    return 0.2;
  } 
  
  buildDolly(scene, camera, position, rotation) {

    // Create the dolly and it to the scene
    const dolly = new THREE.Object3D();
    dolly.add(camera);
    dolly.position.set(position.x, position.y, position.z);
    dolly.rotation.y = THREE.MathUtils.degToRad(rotation.y);
    scene.add(dolly);
    return dolly;
  }  

  buildPlayer(scene, position, height, rad) {
    
    // Build the player outline and its bounding box
    const geo = new THREE.CylinderGeometry(rad, rad, height, 32); 
    const mat = new THREE.MeshBasicMaterial( { wireframe: false, opacity: 0 } ); 
    mat.transparent = true;
    const player = new THREE.Mesh(geo, mat);
    player.geometry.computeBoundingBox();
    player.position.set(position.x, (height / 2), position.z);
    scene.add(player);
    const bb = new THREE.Box3();
    bb.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);
    return { player: player, bb: bb };
  }

  buildController(index, renderer, dolly, range) {

    const factory = new XRControllerModelFactory();
    
    const group = {};
    group.controller = renderer.xr.getController(index);
    group.grip = renderer.xr.getControllerGrip(index);
    group.gamepad = null;
    group.grip.add(factory.createControllerModel(group.grip));
    group.controller.addEventListener("connected", (e) => {
      // This assigns the gamepad controls of the controller to the gamepad object
      group.gamepad = e.data.gamepad;
    });

    dolly.add(group.controller);
    dolly.add(group.grip);

    // Add the lines extending from the controller
    const geo = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1) ] );
    const line = new THREE.Line(geo);
    line.scale.z = range;
    group.controller.add(line.clone());
    return group;
  }  

  setupGravityRay(range) {

    const ray = new THREE.Raycaster();
    ray.near = 0;
    ray.far = range;
    const matrix = new THREE.Matrix4();
    return { ray: ray, matrix: matrix };
  }

  buildLocationPanel(camera, uniScale, modScale) {

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

  /*buildLocationPanel(camera, uniScale, modScale) {

    const panel = new MESH_UI.Block({
      width: UTILS.scaleDistance(1.1, uniScale, modScale),
      height: UTILS.scaleDistance(0.075, uniScale, modScale),
      fontSize: UTILS.scaleDistance(0.04, uniScale, modScale),
      padding: UTILS.scaleDistance(0.12, uniScale, modScale),
      borderRadius: UTILS.scaleDistance(0.035, uniScale, modScale),
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
      fontSize: (0.05 * modScale * uniScale),
      content: "Current Location",
      offset: 0.001
    });  

    panel.add(text);
    return { panel: panel, text: text };
  }  */

  buildDebugPanel(camera, uniScale, modScale) {

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
}



