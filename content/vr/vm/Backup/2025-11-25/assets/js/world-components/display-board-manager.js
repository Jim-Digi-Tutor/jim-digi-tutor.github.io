import { DisplayBoard } from "./sub-components/display-board.js";

/**
 * Manages the InfoBoard instances of a particular region.
 * @class
 */
export class DisplayBoardManager {

  /**
   * Whether or not to log construction and processing data to the console
   * @type {Boolean}
   * @private
   */
  #log = true;

  /**
   * The parent region of this manager.
   * @type {Region}
   * @private
   */  
  #region;

  /**
   * The data from which the boards in this manager are constructed.
   * @type {XML}
   * @private
   */  
  #data;

  /**
   * An array of InfoBoard instances representing all the boards in this region.
   * @type {Array}
   * @private
   */
  #boards;

  /**
   * How many boards have been loaded; used to display loading progression.
   * @type {Number}
   * @private
   */
  #boardsLoaded = 0;

  /**
   * Creates an InfoBoardManager.
   * @param {Region} region The parent region of this manager.
   * @param {XML} data The data from which the boards are constructed.
  */
  constructor(region, data) {

    this.#region = region;
    this.#data = data;
    this.#boards = [];
  }

  /**
   * Gets the parent Region object of this manager.
   * @returns {Region} The parent Region object.
   */
  getRegion() { return this.#region; }

  /**
   * Searches for and returns the Info Board matching the given ID.
   * @param {Number} id The id of the required board.
   * @returns {InfoBoard | null} The requested board; or null if no board matching that ID is found.
   */
  getBoardById(id) {

    for(let a = 0; a < this.#boards.length; a++)
      if(this.#boards[a].getId() === id)
        return this.#boards[a];

    return null;
  }
  
  /**
   * Iterates through the XML data and creates an InfoBoard object from each record.
   */  
  processInfoBoards(isXML) {

    const data = this.#data;
    const promises = [];
    for(let a = 0; a < data.length; a++) {

      const board = new DisplayBoard(this, data[a], isXML);
      board.buildBoard();
      this.#boards.push(board);
      this.#countLoadedBoards(data.length);
    }
  }

  /**
   * Counts the loaded InfoBoards and, if required, logs the data to the console.
   * @param {Number} total The number of boards currently loaded.
   */   
  #countLoadedBoards(total) {

    this.#boardsLoaded++;
    if(this.#log) console.log("Info Boards Loaded for " + this.#region.getName() + " (" + this.#region.getId() + "): " + this.#boardsLoaded + " / " + total);
  }

  /**
   * Iterates through the boards in this region and manages based on the player's proximity to the parent region.
   * @param {String} prox A string representation of the player's proximity to the parent region.
   */  
  manageBoards(prox) {
    
    for(let a = 0; a < this.#boards.length; a++) {

      if(prox === "IN")
        this.#boards[a].onEnterRegion();
      else
        this.#boards[a].onLeaveRegion();
    }
  }

  refreshDisplayBoards(time) {

    for(let a = 0; a < this.#boards.length; a++)
      this.#boards[a].refresh(time);
  }
}