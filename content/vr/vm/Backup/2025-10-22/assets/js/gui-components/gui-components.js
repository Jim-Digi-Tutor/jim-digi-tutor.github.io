import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as UTILS from "../utility/utils.js";

export class SplashPanel {

  #scene;
  #camera;
  #renderer;
  
  #uniScale;
  #modScale;

  #panel;
  #worldDataStatus;
  #commonModelStatus;
  #regionStatus;
  #traipseStatus;
  #lowerBlock;

  #fadeDuration;
  #fadeIncrement;

  constructor(scene, camera, renderer, uniScale, modScale) {

    this.#scene = scene;
    this.#camera = camera;
    this.#renderer = renderer;

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

    this.#panel = new MESH_UI.Block({
      width: UTILS.scaleDistance(0.75, uniScale, modScale),
      height: UTILS.scaleDistance(0.75, uniScale, modScale),
      padding: UTILS.scaleDistance(0.0001, uniScale, modScale),
      margin: UTILS.scaleDistance(0.0001, uniScale, modScale),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundColor: new THREE.Color("#FF0000"),
      backgroundOpacity: 1,
      justifyContent: "center"
    });
    
    const titleBlock = new MESH_UI.Block({
      width: UTILS.scaleDistance(0.715, uniScale, modScale),
      height: UTILS.scaleDistance(0.06, uniScale, modScale),
      padding: UTILS.scaleDistance(0.0001, uniScale, modScale),
      margin: UTILS.scaleDistance(0.0001, uniScale, modScale),
      borderRadius: 0,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundOpacity: 0,
      offset: 0.001
    });

    const splashTitle = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.035 * modScale * uniScale),
      content: "The Follies of Worsbrough Common",
      offset: 0.001,
      textAlign: "center"
    });  

    titleBlock.add(splashTitle)
    this.#panel.add(titleBlock);

    const contentBlock = new MESH_UI.Block({
      width: UTILS.scaleDistance(0.715, uniScale, modScale),
      height: UTILS.scaleDistance(0.26, uniScale, modScale),
      padding: UTILS.scaleDistance(0.0001, uniScale, modScale),
      margin: UTILS.scaleDistance(0.0001, uniScale, modScale),
      borderRadius: 0,
      backgroundOpacity: 0,
      offset: 0.001
    });    

    this.#panel.add(contentBlock);

    const leftBlock = new MESH_UI.InlineBlock({
      width: UTILS.scaleDistance(0.33, uniScale, modScale),
      height: UTILS.scaleDistance(0.25, uniScale, modScale),
      padding: UTILS.scaleDistance(0.0001, uniScale, modScale),
      margin: UTILS.scaleDistance(0.0001, uniScale, modScale),
      borderRadius: 0,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundOpacity: 0,
      offset: 0.001,
      textAlign: "left",
      alignItems: "start"
    });    

    contentBlock.add(leftBlock);

    const worldDataLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "World Data",
      offset: 0.001
    });  

    leftBlock.add(worldDataLabel);

    const commonModelLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "\nCommon Models",
      offset: 0.001
    });

    leftBlock.add(commonModelLabel);

    const regionLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "\nRegions",
      offset: 0.001
    });

    leftBlock.add(regionLabel);

    const traipseLabel = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "\nReady to Traipse?",
      offset: 0.001
    });

    leftBlock.add(traipseLabel);

    const rightBlock = new MESH_UI.InlineBlock({
      width: UTILS.scaleDistance(0.33, uniScale, modScale),
      height: UTILS.scaleDistance(0.25, uniScale, modScale),
      padding: UTILS.scaleDistance(0.0001, uniScale, modScale),
      margin: UTILS.scaleDistance(0.0001, uniScale, modScale),
      borderRadius: 0,
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",      
      backgroundOpacity: 0,
      offset: 0.001,
      textAlign: "right",
      alignItems: "end"
    });    

    contentBlock.add(rightBlock);

    this.#worldDataStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "[ waiting ]",
      offset: 0.001
    });  

    rightBlock.add(this.#worldDataStatus);

    this.#commonModelStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "\n[ waiting ]",
      offset: 0.001
    });

    rightBlock.add(this.#commonModelStatus);

    this.#regionStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "\n[ waiting ]",
      offset: 0.001
    });

    rightBlock.add(this.#regionStatus);

    this.#traipseStatus = new MESH_UI.Text({
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.03 * modScale * uniScale),
      content: "\n[ hold thi hosses ]",
      offset: 0.001
    });

    rightBlock.add(this.#traipseStatus);    

    this.#lowerBlock = new MESH_UI.Block({
      width: UTILS.scaleDistance(0.26, uniScale, modScale),
      height: UTILS.scaleDistance(0.3458, uniScale, modScale),
      borderRadius: UTILS.scaleDistance(0.03, uniScale, modScale),
      borderColor: new THREE.Color("#909090"),
      borderWidth: UTILS.scaleDistance(0.005, uniScale, modScale)
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
        this.#removePanel();
        break;                
    }
  }

  #removePanel() {

    const decrement = (1 / this.#fadeIncrement);
    const opacity = (this.#panel.backgroundOpacity - decrement);

    if(opacity <= 0) {

      this.#panel.set( { backgroundOpacity: 0, fontOpacity: 0 } );
      this.#lowerBlock.set( { backgroundOpacity: 0, borderOpacity: 0 } );
      UTILS.disposeObject3D(this.#panel);
      this.#panel = null;
    
    } else {

      this.#panel.set( { backgroundOpacity: opacity, fontOpacity: opacity } );
      this.#lowerBlock.set( { backgroundOpacity: opacity, borderOpacity: opacity } );
      setTimeout(this.#removePanel.bind(this), (this.#fadeDuration / this.#fadeIncrement));
    }
  }
}