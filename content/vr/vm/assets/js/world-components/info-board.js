import * as MESH_UI from "mesh-ui";
import * as THREE from "three";
import * as UTILS from "../utils.js";

export class InfoBoard {

  #parent;
  #id;
  #data;

  #model;
  #spotLight
  #screen;

  #modelScale;
  #screenSize;

  #display = {

    mediumFont: 0.44,
    borderWidth: 0.0035,
    margin: 2.5
  };

  constructor(parent, id, data) {

    this.#parent = parent;
    this.#id = id;
    this.#data = data;

    this.#setupBoard();
  }

  async #setupBoard() {

    this.#model = await this.#buildModel(this.#data.querySelector("model"));
    this.#spotLight = this.#buildSpotLight(this.#data.querySelector("spot-light"), false);
    this.#screen = this.#buildScreen(this.#data.querySelector("screen"));
    this.#buildContent(this.#screen, this.#data.querySelector("contents"));
  }

  async #buildModel(model) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    
    const file = model.querySelector("file").textContent.trim();
    const size = UTILS.getVectorFromXml(model.querySelector("size"), 0);
    const scale = UTILS.getVectorFromXml(model.querySelector("scale"), 0);
    const pos = UTILS.getVectorFromXml(model.querySelector("position"), 0);
    const adjPos = UTILS.adjustVectorToRegionModel(pos, region.getScaledSize(), region.getPosition(), uniScale, region.getScale());
    const rot = UTILS.getVectorFromXml(model.querySelector("rotation"), 0);

    const load = await UTILS.loadObj(
      ("./assets/models/common/" + file + "/tinker.obj"),
      region.getWorld().getEngine().getObjLoader(), 
      region.getWorld().getEngine().getMtlLoader(), 
      region.getWorld().getEngine().getScale(),
      false, adjPos,
      true, scale,
      true, rot,
      []
    );

    region.getWorld().getEngine().getScene().add(load.model);
    region.getWorld().getEngine().getStructure().push(load.model);
    this.#modelScale = scale;

    return load.model;
  }

  #buildSpotLight(light, indicate) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    
    const pos = UTILS.getVectorFromXml(light.querySelector("position"), 0);
    const adjPos = UTILS.adjustVectorToRegionModel(pos, region.getScaledSize(), region.getPosition(), uniScale, region.getScale());    
    
    const spotLight = new THREE.PointLight(0xFFFFFF, 5, 10);
    spotLight.position.set(adjPos.x, adjPos.y, adjPos.z);
    region.getWorld().getEngine().getScene().add(spotLight);

    if(indicate) {
    
      const geo = new THREE.SphereGeometry(0.1, 16, 16);
      const mat = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(adjPos);
      region.getWorld().getEngine().getScene().add(sphere);
    }

    return spotLight;    
  }

  #buildScreen(screen) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    
    const size = UTILS.getVectorFromXml(screen.querySelector("size"), 0);
    const pos = UTILS.getVectorFromXml(screen.querySelector("position"), 0);
    const rot = UTILS.getVectorFromXml(screen.querySelector("rotation"), 0);
        
    const main = new MESH_UI.Block({
      width: (size.x * region.getScale().x * uniScale),
      height: (size.y * region.getScale().y * uniScale),
      fontFamily: "./assets/mesh-ui-fonts/Roboto-msdf.json",
      fontTexture: "./assets/mesh-ui-fonts/Roboto-msdf.png",
    });

    const position = UTILS.adjustVectorToRegionModel(pos, region.getScaledSize(), region.getPosition(), uniScale, region.getScale());
    main.position.set(position.x, position.y, position.z);
    main.rotation.set(THREE.MathUtils.degToRad(rot.x), THREE.MathUtils.degToRad(rot.y), THREE.MathUtils.degToRad(rot.z))    
    region.getWorld().getEngine().getScene().add(main);   
    this.#screenSize = size;

    return main;
  }

  #buildContent(screen, contents) {

    const content = contents.getElementsByTagName("content");
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

  #buildTitle(data) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    const modelScale = this.#modelScale;
    const screenSize = this.#screenSize;
    const dis = this.#display;
    
    const title = data.querySelector("text").textContent.trim();
    const titleElement = new MESH_UI.Block({
      width: ((screenSize.x * 0.95) * uniScale * modelScale.x),
      height: ((screenSize.y * 0.1) * uniScale * modelScale.y),
      letterSpacing: (1.25 * uniScale * modelScale.x),
      justifyContent: "center",
      borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modelScale.x),
      borderColor: new THREE.Color("#FFFFFF"),
      borderRadius: ((screenSize.x * 0.02) * uniScale * modelScale.x),
      margin: ((screenSize.x * 0.025) * uniScale * modelScale.x)
    });

    const titleText = new MESH_UI.Text({
      
      content: title.toUpperCase(),
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.5 * uniScale * modelScale.y)
    })

    titleElement.add(titleText);
    return titleElement;
  }

  #buildTextComponent(data) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    const modelScale = this.#modelScale;
    const screenSize = this.#screenSize;
    const dis = this.#display;  

    const titleElement = new MESH_UI.Block({
      width: ((screenSize.x * 0.95) * uniScale * modelScale.x),
      height: ((screenSize.y * 0.775) * uniScale * modelScale.y),
      textAlign: "left",
      borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modelScale.x),
      borderColor: new THREE.Color("#FFFFFF"),
      borderRadius: ((screenSize.x * 0.02) * uniScale * modelScale.x),
      padding: ((screenSize.x * 0.04) * uniScale * modelScale.x),
    });

    let text = "";
    const paras = data.getElementsByTagName("text");
    for(let a = 0; a < paras.length; a++)
      text += (paras[a].textContent.trim() + "\n\n");

    const titleText = new MESH_UI.Text({
      
      content: text,
      fontColor: new THREE.Color("#FFFFFF"),
      fontSize: (0.38 * uniScale * modelScale.y)
    })

    titleElement.add(titleText);
    return titleElement;
  }  

  #buildImage(data) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    const modelScale = this.#modelScale;
    const screenSize = this.#screenSize;
    const dis = this.#display;

    const file = data.querySelector("file").textContent.trim();
    const imgScale = parseInt(data.querySelector("scale").textContent.trim());
    const align = data.querySelector("align").textContent.trim();
    const caption = data.querySelector("caption").textContent.trim();
    const captionCol = data.querySelector("caption-colour").textContent.trim();

    const imageElement = new MESH_UI.Block({
      borderWidth: ((screenSize.x * dis.borderWidth) * uniScale * modelScale.x),
      borderColor: new THREE.Color("#FFFFFF"),
      borderRadius: ((screenSize.x * 0.02) * uniScale * modelScale.x),
      padding: ((screenSize.x * 0.04) * uniScale * modelScale.x),
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
        fontSize: (dis.mediumFont * uniScale * modelScale.y)
      })

      imageElement.add(captionElement);
    }

    imageElement.autoLayout = false;
    imageElement.position.set(0, 0, 0)
  
    return imageElement;
  }

  #setImageSize(img, imgScale) {

    const region = this.#parent;
    const uniScale = region.getWorld().getEngine().getScale();
    const modelScale = this.#modelScale;
    const screenSize = this.#screenSize;

    let w = 0;
    let h = 0;
    if(img.width >= img.height) {

      // Landscape Orientation
      const ratio = (img.width / img.height);
      const rW = (imgScale / 100);
      w = ((screenSize.x) * uniScale * modelScale.x) * rW;
      // Use rW to calculate image-height as it is based on a ratio of the width
      h = ((screenSize.y) * uniScale * modelScale.y) * rW;
      if(h > (screenSize.y * uniScale * modelScale.y)) {
      
        h = ((screenSize.y * uniScale * modelScale.y));
        w = (h * ratio);
      }    
    }

    return { width: w, height: h };
  }
}