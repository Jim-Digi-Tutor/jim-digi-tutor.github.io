import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as UTILS from "../utility/utils.js";

export class SplashPanel {

  #scene;
  #camera;
  #renderer;
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

  #dimensions = {

    MOBILE: {},
    HEADSET: {
      width: 0.3,
      height: 0.3,
      largeFont: 0.015,
      smallFont: 0.01,
      padding: 0.001,
      titleHeight: 0.02,
      contentHeight: 0.12,
      lowerHeight: 0.12,
      lowerBorder: 0.0025      
    },

    PC: {

      // 768px to 992px
      SMALL: {
        width: 0.5,
        height: 0.5,
        largeFont: 0.02,
        smallFont: 0.015,
        padding: 0.005,
        titleHeight: 0.04,
        contentHeight: 0.15,
        lowerHeight: 0.25,
        lowerBorder: 0.005
      },

      // 993px to 1200px
      MEDIUM: {
        width: 0.5,
        height: 0.5,
        largeFont: 0.02,
        smallFont: 0.015,
        padding: 0.005,
        titleHeight: 0.04,
        contentHeight: 0.15,
        lowerHeight: 0.25,
        lowerBorder: 0.005
      },

      // 1201px or greater
      LARGE: {
        width: 0.55,
        height: 0.55,
        largeFont: 0.03,
        smallFont: 0.02,
        padding: 0.005,
        titleHeight: 0.06,
        contentHeight: 0.2,
        lowerHeight: 0.2,
        lowerBorder: 0.0035
      }
    },

    UNKNOWN: {}
  }

  #size;
  #dims;

  constructor(scene, camera, renderer, platform, screenWidth, uniScale, modScale) {

    this.#scene = scene;
    this.#camera = camera;
    this.#renderer = renderer;
    this.#platform = platform;
    this.#screenWidth = screenWidth;

    if(this.#platform === "MOBILE") {

      this.#dims = this.#dimensions.MOBILE;

    } else if(this.#platform === "HEADSET") {

      this.#dims = this.#dimensions.HEADSET;

    } else if(this.#platform === "PC") {

      if(this.#screenWidth < 993)
        this.#size = "SMALL";
      else if(this.#screenWidth >= 993 && this.#screenWidth < 1200)
        this.#size = "MEDIUM"
      else if(this.#screenWidth >= 1200)
        this.#size = "LARGE";
      else
        this.#size = "MEDIUM";
      
      this.#dims = this.#dimensions.PC[this.#size];

    } else {

      this.#dims = this.#dimensions.UNKNOWN;
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