import { Settings } from "./settings.js";

export class Utility {

  constructor() {}

  static getProperty(data, property) {

    if(data.hasOwnProperty(property)) {

      return data[property];
    }

    return undefined;
  }

  static isModelInteractable(type) {

    return (
      type === Settings.INTERACTABLE_MODEL_STANDARD ||
      type === Settings.INTERACTABLE_MODEL_MOVEMENT_TRIGGER ||
      type === Settings.INTERACTABLE_MODEL_TELEPORT_TRIGGER ||
      type === Settings.INTERACTABLE_MODEL_CLIMB_TRIGGER
    );
  }
}