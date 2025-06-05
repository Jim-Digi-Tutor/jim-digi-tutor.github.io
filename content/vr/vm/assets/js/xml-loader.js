export class XMLLoader {

  static async loadXml(url, onSuccess, onError, errorElement, onProgress, progressElements) {

    try {
    
      const response = await fetch(url);

      if(!response.ok) {
        throw new Error("HTTP error! Status: " + response.status);
      }

      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : null;
      const reader = response.body.getReader();

      let received = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if(done) break;

        chunks.push(value);
        received += value.length;

        if(total && typeof onProgress === 'function') {
          const percent = Math.round((received / total) * 100);
          onProgress(percent, progressElements);
        }
      }

      const decoder = new TextDecoder("utf-8");
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
      }
      const xmlString = decoder.decode(combined);

      // Parse as XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");

      // Check for parsing errors
      if(xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Error parsing XML");
      }

      // Check for parsing errors
      if(xmlDoc.getElementsByTagName("misc-error").length > 0) {
        throw new Error("Miscelleneous Error Found");
      }

      onSuccess(xmlDoc);
    
    } catch(error) {
      onError(error, errorElement);
    }
  }

  static handleError(error, element) {

    //element.textContent = error;
    console.log(error)
  }

  static handleProgress(progress, elements) {

    console.log(progress + "%");
    //elements.numeric.textContent = (progress + "%");
    //elements.graphic.bar1.style.width = (progress + "%");
    //elements.graphic.bar2.style.width = ((100 - progress) + "%");
  }  
}
