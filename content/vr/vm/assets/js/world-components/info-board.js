import * as MESH_UI from "mesh-ui";
import * as THREE from "three";
import * as UTILS from "../utils.js";

import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

export class InfoBoard {

  #parent;
  #id;
  #data;

  #screen;

  #size;
  #position;
  #facing;

  #modelScale;
  #screenSize;

  #display = {

    mediumFont: 0.44,
    borderWidth: 0.0035,
    margin: 2.5
  };

  #rotations = {

    "NORTH": 180, "NORTH-EAST": 135, "EAST": 90, "SOUTH-EAST": 45,
    "SOUTH": 0, "SOUTH-WEST": -45, "WEST": 0, "NORTH-WEST": 225
  }

  #positionOffsetsSmall = {

    "NORTH": { x: 8.5, y: 13, z: 0.35 }, "NORTH-EAST": { x: 6.45, y: 13, z: 6.25 },
    "EAST": { x: 0.5, y: 13, z: 8.5 }, "SOUTH-EAST": { x: 6.45, y: 13, z: 6.45 },
    "SOUTH": { x: 0, y: 0, z: 0 }, "SOUTH-WEST": { x: 6.25, y: 13, z: 6.45 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 6.25, y: 13, z: 6.25 }    
  }

  #positionOffsetsLarge = {

    "NORTH": { x: 11, y: 14.5, z: 0.35 }, "NORTH-EAST": { x: 0, y: 0, z: 0 },
    "EAST": { x: 0.5, y: 14.5, z: 11 }, "SOUTH-EAST": { x: 0, y: 0, z: 0 },
    "SOUTH": { x: 0, y: 0, z: 0 }, "SOUTH-WEST": { x: 0, y: 0, z: 0 },
    "WEST": { x: 0, y: 0, z: 0 }, "NORTH-WEST": { x: 0, y: 0, z: 0 }    
  }

  constructor(parent, id, data) {

    this.#parent = parent;
    this.#id = id;
    this.#data = data;
  }

  getScreen() { return this.#screen; }

  async setupBoard() {

    const region = this.#parent.getRegion();
    const uniScale = region.getWorld().getEngine().getUniversalScale();
    const modScale = region.getWorld().getEngine().getModelScale();

    this.#size = this.#data.querySelector("board-size").textContent.trim();
    this.#facing = this.#data.querySelector("board-facing").textContent.trim();
    const pos = UTILS.getVectorFromXml(this.#data.querySelector("board-position"), 0);
    this.#position = UTILS.adjustChildPositionToParent(pos, region.getScaledSize(), region.getAdjustedPosition(), uniScale, modScale);

    this.#screen = null; 
  }

  buildScreen(screen) {

    const region = this.#parent.getRegion();
    const uniScale = region.getWorld().getEngine().getUniversalScale();
    const modScale = region.getWorld().getEngine().getModelScale();

    const size = { x: 0, y: 0 };
    const off = { x: 0, y: 0, z: 0 };
    if(this.#size === "SMALL") {

      size.x = 16;
      size.y = 9;

      off.x = this.#positionOffsetsSmall[this.#facing].x;
      off.y = this.#positionOffsetsSmall[this.#facing].y;
      off.z = this.#positionOffsetsSmall[this.#facing].z;

    } else if(this.#size === "LARGE") {

      size.x = 21;
      size.y = 12;

      off.x = this.#positionOffsetsLarge[this.#facing].x;
      off.y = this.#positionOffsetsLarge[this.#facing].y;
      off.z = this.#positionOffsetsLarge[this.#facing].z;      
    }
        
    this.#screen = new MESH_UI.Block({
      width: ((size.x * modScale) * uniScale),
      height: ((size.y * modScale) * uniScale),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",
    });

    const position = this.#position;
    this.#screen.position.set(
      (position.x + UTILS.scaleDistance(off.x, modScale, uniScale)), 
      (position.y + UTILS.scaleDistance(off.y, modScale, uniScale)),
      (position.z + UTILS.scaleDistance(off.z, modScale, uniScale))
    );
    
    const rot = this.#rotations[this.#facing];
    this.#screen.rotation.y = THREE.MathUtils.degToRad(rot);

    this.#screenSize = size;
  }

  buildContent() {

    const screen = this.#screen;
    const content = this.#data.querySelector("contents").getElementsByTagName("content");

    for(let a = 0; a < content.length; a++) {

      const con = content[a];
      const type = con.getAttribute("type");

      switch(type) {

        case "IMAGE":
          screen.add(this.#buildImage(con))
          break;   
        case "TEXT":
          screen.add(this.#buildTextComponent(con))
          break;        
        case "TITLE":
          screen.add(this.#buildTitle(con))
          break;
      }
    }
  }

  disposeBoard() {

    const scene = this.#parent.getRegion().getWorld().getEngine().getScene();
    const block = this.#screen;

    if (scene && block.parent === scene) {
      scene.remove(block);
    }

    block.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          for (const key in mat) {
            const value = mat[key];
            if (value && value.isTexture) value.dispose();
          }
          mat.dispose();
        });
      }
    });

    this.#screen = null;
  }

  #buildTitle(data) {

    const region = this.#parent.getRegion();
    const uniScale = region.getWorld().getEngine().getUniversalScale();
    const modScale = region.getWorld().getEngine().getModelScale();
    const screenSize = this.#screenSize;
    const dis = this.#display;
    
    const title = data.querySelector("text").textContent.trim();
    const titleElement = new MESH_UI.Block({
      width: ((screenSize.x * 0.95) * uniScale * modScale),
      height: ((screenSize.y * 0.1) * uniScale * modScale),
      letterSpacing: (1.25 * uniScale * modScale),
      justifyContent: "center",
      borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modScale),
      borderColor: new THREE.Color("#FFFFFF"),
      borderRadius: ((screenSize.x * 0.02) * uniScale * modScale),
      margin: ((screenSize.x * 0.025) * uniScale * modScale)
    });

    const titleText = new MESH_UI.Text({
      
      content: title.toUpperCase(),
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.55 * uniScale * modScale)
    })

    titleElement.add(titleText);
    return titleElement;
  }

  #buildTextComponent(data) {

    const region = this.#parent.getRegion();
    const uniScale = region.getWorld().getEngine().getUniversalScale();
    const modScale = region.getWorld().getEngine().getModelScale();
    const screenSize = this.#screenSize;
    const dis = this.#display;  

    const titleElement = new MESH_UI.Block({
      width: ((screenSize.x * 0.95) * uniScale * modScale),
      height: ((screenSize.y * 0.775) * uniScale * modScale),
      textAlign: "left",
      borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modScale),
      borderColor: new THREE.Color("#FFFFFF"),
      borderRadius: ((screenSize.x * 0.02) * uniScale * modScale),
      padding: ((screenSize.x * 0.03) * uniScale * modScale)
    });

    let text = "";
    const paras = data.getElementsByTagName("text");
    for(let a = 0; a < paras.length; a++)
      text += (paras[a].textContent.trim() + "\n\n");

    const titleText = new MESH_UI.Text({
      
      content: text,
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.38 * uniScale * modScale)
    })

    titleElement.add(titleText);
    return titleElement;
  }  

  #buildImage(data) {

    const region = this.#parent.getRegion();
    const uniScale = region.getWorld().getEngine().getUniversalScale();
    const modScale = region.getWorld().getEngine().getModelScale();
    const screenSize = this.#screenSize;
    const dis = this.#display;

    const file = data.querySelector("file").textContent.trim();
    const imgScale = parseInt(data.querySelector("scale").textContent.trim());
    const align = data.querySelector("align").textContent.trim();
    const caption = data.querySelector("caption").textContent.trim();
    const captionCol = data.querySelector("caption-colour").textContent.trim();

    const imageElement = new MESH_UI.Block({
      borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modScale),
      borderColor: new THREE.Color("#FFFFFF"),
      borderRadius: ((screenSize.x * 0.02) * uniScale * modScale),
      padding: ((screenSize.x * 0.04) * uniScale * modScale),
      textAlign: "center",
      justifyContent: "start",
    });

    new THREE.TextureLoader().load(("./assets/images/" + file), (texture) => {

      const img = texture.image;
      const dim = this.#setImageSize(img, imgScale);
      imageElement.set({
          width: dim.width,
          height: dim.height,
          backgroundTexture: texture,
          backgroundSize: "contain"
       });

      texture.wrapS = THREE.RepeatWrapping;
		  texture.wrapT = THREE.RepeatWrapping;
    });
    
    if(caption !== "") {

      const captionElement = new MESH_UI.Text({
        content: caption,
        fontColor: new THREE.Color(captionCol),
        fontSize: (dis.mediumFont * uniScale * modScale)
      })

      imageElement.add(captionElement);
    }

    imageElement.autoLayout = false;
    imageElement.position.set(0, 0, 0)
  
    return imageElement;
  }

  #setImageSize(img, imgScale) {

    const region = this.#parent.getRegion();
    const uniScale = region.getWorld().getEngine().getUniversalScale();
    const modScale = region.getWorld().getEngine().getModelScale();
    const screenSize = this.#screenSize;

    let w = 0;
    let h = 0;
    if(img.width >= img.height) {

      // Landscape Orientation
      const ratio = (img.width / img.height);
      const rW = (imgScale / 100);
      w = ((screenSize.x) * uniScale * modScale) * rW;
      // Use rW to calculate image-height as it is based on a ratio of the width
      h = ((screenSize.y) * uniScale * modScale) * rW;
      if(h > (screenSize.y * uniScale * modScale)) {
      
        h = ((screenSize.y * uniScale * modScale));
        w = (h * ratio);
      }    
    }

    return { width: w, height: h };
  }
}