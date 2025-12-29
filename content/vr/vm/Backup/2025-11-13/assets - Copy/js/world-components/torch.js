export class Torch {

  #parent;
  #id;
  #type;
  #position;
  
  #tick = 80;
  #intensity = 0.01;
  #distance = 50;
  #decay = 1.25;
  #volume = 0.5
  #proximity = 2;
  
  #dimFlicker = { frequency: 20, upper: 1.1, lower: 0.9 };

  #previousCol;
  #currentCol;
  #previousDim;
  #currentDim;

  #object;
  #sound;
  
  constructor(parent, id, type, position, indicate) {

    this.#parent = parent;
    this.#id = id;
    this.#type = type;
    this.#position = position;
    
    this.#buildSource(indicate);
  }

  #buildSource(indicate) {
    
    const col = this.#parent.getWorld().getTorchColours()[0];
    this.#previousCol = col;
    this.#currentCol = col;
    this.#previousDim = this.#intensity;
    this.#currentDim = this.#intensity;

    const uniScale = this.#parent.getWorld().getEngine().getUniversalScale();
    const modScale = this.#parent.getWorld().getEngine().getModelScale();

    this.#object = new THREE.PointLight(new THREE.Color(col.r, col.g, col.b), this.#intensity, UTILS.scaleDistance(this.#distance, uniScale, modScale), UTILS.scaleDistance(this.#decay, uniScale, modScale));
    this.#object.position.set(this.#position.x, this.#position.y, this.#position.z);
    this.#object.castShadow = true;
    this.#parent.getWorld().getEngine().getScene().add(this.#object);

    const id = ("Light-" + this.#parent.getId() + "-" + this.#id);
    this.#object.userData.LightSourceId = id;

    if(indicate) {

      const geo = new THREE.SphereGeometry(0.1, 16, 16);
      const mat = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(this.#object.position);
      this.#parent.getWorld().getEngine().getScene().add(sphere);
    }
    
    // Setup the sound of the torch
    // Sound Effect by freesound_community from Pixabay
    const loader = new THREE.AudioLoader();
    this.#sound = new THREE.PositionalAudio(this.#parent.getWorld().getEngine().getListener());
    loader.load("./assets/sounds/crackling-torch.mp3", function(buffer) {
        
      this.#sound.setBuffer(buffer);
      // Distance from object where the volume is full
      this.#sound.setRefDistance(UTILS.scaleDistance(this.#proximity, uniScale, modScale));
      this.#sound.setLoop(true);
      this.#sound.setVolume(this.#volume);
      this.#sound.play();

    }.bind(this));

    this.#object.add(this.#sound);
  }

  process(frame) {

    const count = (frame % this.#tick);
    if(count === 0) {

      // Active changes triggered by meeting the tick threshold, generate a random number to identify a new colour
      const cols = this.#parent.getWorld().getTorchColours();
      const rand = Math.floor(Math.random() * cols.length);
      this.#previousCol = this.#currentCol;
      this.#currentCol = cols[rand];

      if((frame % this.#dimFlicker.frequency) === 0) {

        // Generate a random number to create a new dim / intensity setting
        const dim = this.#clampDim((Math.random() * 2).toFixed(2), this.#dimFlicker.lower, this.#dimFlicker.upper);
        this.#previousDim = this.#currentDim;
        this.#currentDim = (this.#intensity * dim);
      }
      
    } else {

      // Passive changes with the torch phasing between two states
      const colPercent = (count / this.#tick);
      const col = new THREE.Color();
      col.lerpColors(this.#previousCol, this.#currentCol, colPercent);
      this.#object.color.copy(col);

      const dimPercent = ((frame % this.#dimFlicker.frequency) / this.#dimFlicker.frequency);
      const eased = dimPercent * dimPercent * (3 - 2 * dimPercent);  // "Smoothsteps" the animation
      this.#object.intensity = THREE.MathUtils.lerp(this.#previousDim, this.#currentDim, eased);
    }
  }

  #clampDim(val, lower, upper) {

    return Math.min(Math.max(val, lower), upper);
  }  
}
