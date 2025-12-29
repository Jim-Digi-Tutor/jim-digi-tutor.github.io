import * as THREE from "three";
import * as UTILS from "./utility/utils.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Manages various setup functions of the app.
 * @class
 */
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

    const renderer = new THREE.WebGLRenderer({
      antialias: true,                 // ignored in XR layers (fine)
      alpha: false,                    // safer for multiview/layers
      depth: true,
      stencil: false,                  // IMPORTANT: disable stencil
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      logarithmicDepthBuffer: false,
      multiview: true    // IMPORTANT 
    });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;    
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = false;
    renderer.xr.enabled = true;
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

  /**
   * Loads a custom controller model for the requested controller grip.
   * @param {Number} index The index of the controller; typically: 0 - right, 1 - left.
   * @param {ControllerGroup} controller A group containing the controller components.
   * @param {THREE.WebGLRenderer} renderer The application's WebGL Renderer.
   * @async
   */  
  async loadCustomControllerModel(index, controller, renderer) {
  
    // Load the custom model.
    let model = await UTILS.loadUnmodifiedGLB(
      ("./assets/models/gui/xr-controller-" + index + ".glb"), renderer
    );

    // Destroy the temporary controller mesh.
    controller.grip.children.slice().forEach(child => {
      controller.grip.remove(child);
    });

    // Merge and remap the controllers to reduce draw calls.
    // Reducing draw calls is the whole point of adding custom controllers.
    UTILS.remapColours(model);
    const clone = UTILS.mergeToSingleVertexColorMesh(model);
    UTILS.disposeObject3D(model);
    model = null;

    // Position, orient, and scale the new controller models.
    const y = UTILS.scaleDistance(0.02, this.ascertainUniversalScale(), this.ascertainModelScale());
    clone.position.set(0, y, 0);
    clone.rotation.set(THREE.MathUtils.degToRad(-35), 0, 0);
    clone.scale.set(0.2, 0.2, 0.2);

    // Add the custom model to the grip.
    controller.grip.add(clone);
  }

  /**
   * Sets up the WebXR controllers. Adds a temporary mesh for the models pending loading of custom model.
   * @param {Number} index The index of the controller; typically: 0 - right, 1 - left.
   * @param {THREE.WebGLRenderer} renderer The application's WebGL Renderer.
   * @param {THREE.Object3D} dolly Convenience vehicle for the camera, controllers, and other miscellaneous components.
   * @param {Number} range The interaction range of the app; used for drawing the rays.
   * @returns {ControllerGroup} group A ControllerGroup containing the controller components.
   */  
  buildController(index, renderer, dolly, range) {

    const factory = new XRControllerModelFactory();
      
    // Build a simple mesh to act as the controller visual until the model loads.
    const geos = [];
    const handle = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12);
    geos.push(handle);

    // Merge the mesh into one geometry (it should already be so).
    const mergedGeo = BGU.mergeGeometries(geos, false);
 
    // Add a material near in colour to the intended models.
    const mat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const tempMesh = new THREE.Mesh(mergedGeo, mat);
    const y = UTILS.scaleDistance(0.025, this.ascertainUniversalScale(), this.ascertainModelScale());
    tempMesh.position.y = y;
    tempMesh.rotation.x = THREE.MathUtils.degToRad(50);
    tempMesh.castShadow = true;
    tempMesh.receiveShadow = true;
 
    // Intialise the controller group.
    const group = {};
    group.controller = renderer.xr.getController(index);
    group.grip = renderer.xr.getControllerGrip(index);
    group.gamepad = null;
    group.grip.add(tempMesh);
    group.controller.addEventListener("connected", (e) => {
      // This assigns the gamepad controls of the controller to the gamepad object
      group.gamepad = e.data.gamepad;
    });
 
    // Add the controllers to the dolly.
    dolly.add(group.controller);
    dolly.add(group.grip);
 
    // Add the lines extending from the controller
    const geo = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1) ] );
    const line = new THREE.Line(geo);
    line.material = new THREE.MeshStandardMaterial( { color: 0xFF0000 } );
    line.scale.z = range;
    group.controller.add(line.clone());
    
    return group;
  }   
}