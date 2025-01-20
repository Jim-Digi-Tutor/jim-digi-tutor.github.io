export class Utility {

  constructor() {}

  static getProperty(data, property) {

    if(data.hasOwnProperty(property)) {

      return data[property];
    }

    return undefined;
  }
}