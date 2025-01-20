export class Settings {

  // Renderer configuration
  static fov = 75;
  static near = 0.1;
  static far = 1000;

  static baseScale = 1;

  static pickDistance = 10;
  static pickTimer = 2000;
  static pickIncrements = 10;
  
  static INTERACTION_MODE_CONTROLLER_DUAL = 0;
  static INTERACTION_MODE_CONTROLLER_SINGLE = 1;
  static INTERACTION_MODE_GAZE = 2;

  static MOVEMENT_MODE_CUSTOM_TELEPORT = 0;

  static INTERACTABLE_TYPE_STANDARD = 0;
  
  static MODEL_TYPE_3D_BUILDER_OBJ = 0;
  static MODEL_TYPE_THREE_MESH = 1;
  static MODEL_TYPE_TINKERCAD_GLB = 2;

  constructor() {}




}