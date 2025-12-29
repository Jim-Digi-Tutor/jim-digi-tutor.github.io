import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as UTILS from "../utils.js";

export class GuiPanel {

  #scene;
  #camera;
  #renderer;
  
  #uniScale;
  #modScale;
  
  #uiGroup;

  #topLeftPanel;
  #leftContent;
  #topRightPanel;
  #rightContent;
  #bottomPanel;
  #bottomContent;

  constructor(scene, camera, renderer, uniScale, modScale) {
    
    this.#scene = scene;
    this.#camera = camera;
    this.#renderer = renderer;

    this.#uniScale = uniScale;
    this.#modScale = modScale;

    this.#uiGroup = new THREE.Group();
    scene.add(this.#uiGroup);

    this.createPanels();
  }

  createPanels() {

    this.#topLeftPanel = new MESH_UI.Block({
      width: UTILS.scaleDistance(0.55, this.#uniScale, this.#modScale),
      height: UTILS.scaleDistance(0.55, this.#uniScale, this.#modScale),
      fontSize: UTILS.scaleDistance(0.04, this.#uniScale, this.#modScale),
      padding: UTILS.scaleDistance(0.12, this.#uniScale, this.#modScale),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundColor: new THREE.Color("#FF0000"),
      backgroundOpacity: 0.8,
      justifyContent: "center",
      alignItems: "center",
      textAlign: "left"
    });

    this.#leftContent = new MESH_UI.Text( { content: "Left Content" } );
    this.#topLeftPanel.add(this.#leftContent);

    this.#topRightPanel = new MESH_UI.Block({
      width: UTILS.scaleDistance(0.55, this.#uniScale, this.#modScale),
      height: UTILS.scaleDistance(0.55, this.#uniScale, this.#modScale),
      fontSize: UTILS.scaleDistance(0.04, this.#uniScale, this.#modScale),
      padding: UTILS.scaleDistance(0.12, this.#uniScale, this.#modScale),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundColor: new THREE.Color("#FF0000"),
      backgroundOpacity: 0.8,
      justifyContent: "center",
      alignItems: "center",
      textAlign: "left"
    });

    this.#rightContent = new MESH_UI.Text( { content: "Right Content" } );
    this.#topRightPanel.add(this.#rightContent);
    
    this.#bottomPanel = new MESH_UI.Block({
      width: UTILS.scaleDistance(2.5, this.#uniScale, this.#modScale),
      height: UTILS.scaleDistance(0.15, this.#uniScale, this.#modScale),
      fontSize: UTILS.scaleDistance(0.04, this.#uniScale, this.#modScale),
      padding: UTILS.scaleDistance(0.12, this.#uniScale, this.#modScale),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundColor: new THREE.Color("#FF0000"),
      backgroundOpacity: 0.8,
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center"
    });

    this.#bottomContent = new MESH_UI.Text( { content: "Bottom Content" } );
    this.#bottomPanel.add(this.#bottomContent);

    this.#uiGroup.add(this.#topLeftPanel);
    this.#uiGroup.add(this.#topRightPanel);
    this.#uiGroup.add(this.#bottomPanel);

    this.positionPanels();
  }

  positionPanels() {

    this.#topLeftPanel.position.set(
      UTILS.scaleDistance(-1.55, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(0.95, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(-1.5, this.#uniScale, this.#modScale)
    );

    this.#topRightPanel.position.set(     
      UTILS.scaleDistance(1.55, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(0.95, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(-1.5, this.#uniScale, this.#modScale)
    );

    this.#bottomPanel.position.set(
      0,
      UTILS.scaleDistance(-0.8, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(-1.5, this.#uniScale, this.#modScale)
    );

    // Orient the panels to always face the camera direction
    this.#topLeftPanel.lookAt(this.#camera.position);
    this.#topRightPanel.lookAt(this.#camera.position);
    this.#bottomPanel.lookAt(this.#camera.position);
  }

  update() {

    const cameraWorldPos = new THREE.Vector3();
    this.#camera.getWorldPosition(cameraWorldPos);

    const cameraWorldQuat = new THREE.Quaternion();
    this.#camera.getWorldQuaternion(cameraWorldQuat);

    this.#uiGroup.position.copy(cameraWorldPos);
    this.#uiGroup.quaternion.copy(cameraWorldQuat);
  }

  output(left, right, bottom) {

    if(left !== null && left !== "")
      this.#leftContent.set( { content: left } );
    if(right !== null && right !== "")
      this.#rightContent.set( { content: right } );
    if(bottom !== null && bottom !== "")
      this.#bottomContent.set( { content: bottom } );    
  }
}