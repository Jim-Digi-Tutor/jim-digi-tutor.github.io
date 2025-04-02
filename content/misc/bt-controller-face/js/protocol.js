class Protocol {

  #device;
  #connected;
  #absolute;
  #results;
  
  #UART_SERVICE_UUID;
  #UART_TX_CHARACTERISTIC;
  #UART_RX_CHARACTERISTIC;

  #uartService = null;
  #txCharacteristic = null;
  #rxCharacteristic = null;
  #sending = false;

  constructor() {

    this.#connected = false;
    this.#absolute = false;
    this.#results = new Results();

    this.#UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";  
    // Service 6e400002 - write from MICRO:BIT to WEB
    this.#UART_RX_CHARACTERISTIC = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
    // Service 6e400003 - write from WEB to MICRO:BIT
    this.#UART_TX_CHARACTERISTIC = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
  }

  getAbsolute() { return this.#absolute; }
  setAbsolute(absolute) { this.#absolute = absolute; }
  toggleAbsolute() { this.#absolute = !this.#absolute; }

  async connect() {

    if(this.#connected) {

      // If already connected, disconnect from the device
      this.#connected = false;
      this.#device.gatt.disconnect();
      connectButton.innerHTML = "Connect to Micro:Bit";
      statusElement.innerHTML = "❌ Disconnected";

    } else {

      // Attempt connection
      try {
        
        // Initialise the device
        this.#device = await navigator.bluetooth.requestDevice({
          filters: [ { namePrefix: 'BBC micro:bit' } ],
          optionalServices: [ this.#UART_SERVICE_UUID ]
        });

        // Connect to the device
        console.warn("Connecting to " + this.#device.name + "...");
        let server = await this.#device.gatt.connect();

        // Initialise the UART service and txCaracteristic (Send to Micro:Bit)
        this.#uartService = await server.getPrimaryService(this.#UART_SERVICE_UUID);
        this.#txCharacteristic = await this.#uartService.getCharacteristic(this.#UART_TX_CHARACTERISTIC);

        // Initialise rxCharacteristic (Receive from Micro:Bit)
        this.#rxCharacteristic = await this.#uartService.getCharacteristic(this.#UART_RX_CHARACTERISTIC);

        // Begin to listen for notifications
        await this.#rxCharacteristic.startNotifications();
        this.#rxCharacteristic.addEventListener('characteristicvaluechanged', this.#receive);

        // Amend the interface and flag the device as disconnected
        this.#connected = true;
        connectButton.innerHTML = "Disconnect";
        statusElement.textContent = ("✅ Connected");
        
      // Log failure to connect
      } catch (error) {

        statusElement.textContent = "❌ Bluetooth Error";
        console.error(error)
      }
    }
  }

  #receive(event) {

    let value = event.target.value;
    let decoder = new TextDecoder("utf-8");
    let message = decoder.decode(value);

    console.log("Received from micro:bit:", message);
  }

  async #send(message) {

    console.log(this.#txCharacteristic.properties);
      
    if (!this.#txCharacteristic) {
      console.warn("TX characteristic is null.");
      return;
    }

    // Check if characteristic supports writing
    if (!this.#txCharacteristic.properties.write && !this.#txCharacteristic.properties.writeWithoutResponse) {
      console.error("❌ Characteristic not writable. Check micro:bit firmware/services.");
      return;
    }

    try {
      console.log(message)
      const data = new TextEncoder().encode(message + '\n');
      await this.#txCharacteristic.writeValue(data);
      console.log("📤 Sent to micro:bit:", message);
    } catch (err) {
      console.error("❌ Failed to send:", err);
    } finally {

      console.log("CLOSING")
      this.#sending = false;
    }
  }

  processResults(results) {

    // Clear the canvas and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  
    if (results.multiFaceLandmarks.length > 0) {
      
      let landmarks = results.multiFaceLandmarks[0];
  
      // Draw the face landmarks - this is optional, can be commented out
      ctx.fillStyle = "#00FF00";
      for (let i = 0; i < landmarks.length; i++) {
        
        let x = (landmarks[i].x * canvas.width);
        let y = (landmarks[i].y * canvas.height);
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, (2 * Math.PI));
        ctx.fill();
      }
  
      // Set the data object
      let data = {
        roll: this.#clampTo(calcX(landmarks), 15, 0),
        yaw: this.#clampTo(calcY(landmarks), 50, 0),
        pitch: this.#clampTo(calcZ(landmarks), 20, 0),
        mouth: this.#clampTo(calcMouth(landmarks), 12, 0),
        brows: this.#clampTo(calcBrows(landmarks, 7, 0)) 
      };

      // Update the data on the page
      this.#displayResults(data);

      // Set the data in the results object
      this.#results.setData(data);

      if(this.#connected && !this.#sending) {
      
        // Construct and send the data string
        let tx = this.#results.constructTx();
        this.#sending = true;
        this.#send(tx);
      }

    } else {

      //log.innerText = "Status: Face not detected";
    }
  }

  #clampTo(value, max, min) {

    let mod = value;
    if(value >= 0) {
          
      if(value > max)
        mod = max;
      else if(value < min)
        mod = min;
    
    } else {

      if(value < -max)
        mod = -max;
      else if(value > -min)
        mod = -min;
    }
    
    return mod;
  }

  #displayResults(data) {

    let displayRoll = data.roll.toFixed(1);
    document.getElementById("x-axis-rotation-value").innerHTML = (displayRoll + "°");
    if(displayRoll > 0) {

      document.getElementById("x-axis-rotation-left-bar").style.backgroundSize = ((100 - ((displayRoll / 15) * 100) + "% 100%"));
      // Clear the right bar
      document.getElementById("x-axis-rotation-right-bar").style.backgroundSize = ("0% 100%");
    
    } else {
    
      document.getElementById("x-axis-rotation-right-bar").style.backgroundSize = (((Math.abs(displayRoll) / 15) * 100) + "% 100%");
      // Clear the left bar
      document.getElementById("x-axis-rotation-left-bar").style.backgroundSize = ("100% 100%");
    }

    let displayYaw = data.yaw.toFixed(1);
    document.getElementById("y-axis-rotation-value").innerHTML = (displayYaw + "°");
    if(displayYaw > 0) {

      document.getElementById("y-axis-rotation-left-bar").style.backgroundSize = ((100 - (displayYaw * 2)) + "% 100%");
      // Clear the right bar
      document.getElementById("y-axis-rotation-right-bar").style.backgroundSize = ("0% 100%");
    
    } else {
    
      document.getElementById("y-axis-rotation-right-bar").style.backgroundSize = (Math.abs(displayYaw * 2) + "% 100%");
      // Clear the left bar
      document.getElementById("y-axis-rotation-left-bar").style.backgroundSize = ("100% 100%");
    }
    
    let displayPitch = data.pitch.toFixed(1);
    document.getElementById("z-axis-rotation-value").innerHTML = (displayPitch + "°");
    if(displayPitch < 0) {

      document.getElementById("z-axis-rotation-left-bar").style.backgroundSize = ((100 - ((Math.abs(displayPitch) / 20) * 100) + "% 100%"));
      // Clear the right bar
      document.getElementById("z-axis-rotation-right-bar").style.backgroundSize = ("0% 100%");
    
    } else {
    
      document.getElementById("z-axis-rotation-right-bar").style.backgroundSize = (((Math.abs(displayPitch) / 20) * 100) + "% 100%");
      // Clear the left bar
      document.getElementById("z-axis-rotation-left-bar").style.backgroundSize = ("100% 100%");
    }

    let displayMouth = data.mouth.toFixed(2);
    document.getElementById("mouth-open-value").innerHTML = (displayMouth);
    document.getElementById("mouth-open-left-bar").style.backgroundSize = ((100 - ((displayMouth / 12) * 100) + "% 100%"));
    document.getElementById("mouth-open-right-bar").style.backgroundSize = (((displayMouth / 12) * 100) + "% 100%");
  
    let displayBrows = data.brows.toFixed(2);
    document.getElementById("eyebrows-raised-value").innerHTML = (displayBrows);
    document.getElementById("eyebrows-raised-left-bar").style.backgroundSize = ((100 - ((displayBrows / 7) * 100) + "% 100%"));
    document.getElementById("eyebrows-raised-right-bar").style.backgroundSize = (((displayBrows / 7) * 100) + "% 100%");
  }
}

class Results {

  #data;

  constructor() {}

  setData(data) { this.#data = data; }

  constructTx() {

    let d = this.#data;
    let str = "";
    str += (Math.round(d.pitch) + "|");
    str += (Math.round(d.yaw) + "|");
    str += (Math.round(d.roll) + "|");
    str += (Math.round(d.mouth) + "|");
    str += (Math.round(d.brows));
    return str;
  }

}