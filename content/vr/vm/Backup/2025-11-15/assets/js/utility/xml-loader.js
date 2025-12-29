// xml-loader.js
export class XMLLoader {
  /**
   * Load and parse XML (streaming) with progress + error hooks.
   * Returns a Promise<XMLDocument>.
   *
   * @param {string} url
   * @param {object} [opts]
   * @param {{numeric?:HTMLElement, graphic?:{bar1?:HTMLElement, bar2?:HTMLElement}}} [opts.progressElements]
   * @param {HTMLElement} [opts.errorElement]
   * @param {(doc: XMLDocument)=>void} [opts.onSuccess]          // optional
   * @param {(err: Error, element?:HTMLElement)=>void} [opts.onError] // defaults to XMLLoader.handleError
   * @param {(p:number, elements?:any)=>void} [opts.onProgress]  // defaults to XMLLoader.handleProgress
   * @param {AbortSignal} [opts.signal]
   * @param {number} [opts.timeoutMs=0]
   * @returns {Promise<XMLDocument>}
   */
  static async loadXml(url, prefix, log, opts = {}) {
    const {
      progressElements,
      errorElement,
      onSuccess,
      onError = XMLLoader.handleError,
      onProgress = XMLLoader.handleProgress,
      signal,
      timeoutMs = 0,
    } = opts;

    // compose an AbortSignal (optional timeout)
    const localCtrl = !signal ? new AbortController() : null;
    const compositeSignal = signal ?? localCtrl?.signal ?? undefined;
    let timeoutId = null;
    if (localCtrl && timeoutMs > 0) {
      timeoutId = setTimeout(
        () => localCtrl.abort(new DOMException('Timeout', 'TimeoutError')),
        timeoutMs
      );
    }

    const startedAt = performance.now();

    try {
      const response = await fetch(url, { signal: compositeSignal, cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText || ''}`.trim());
      }

      const contentLengthHeader = response.headers.get('Content-Length');
      const contentEncoding = (response.headers.get('Content-Encoding') || '').toLowerCase();
      const total =
        contentLengthHeader && !contentEncoding ? parseInt(contentLengthHeader, 10) : null;

      // If the environment has no streaming body, fall back to .text()
      if (!response.body || !response.body.getReader) {
        const text = await response.text();
        // best-effort progress
        try {
          onProgress(prefix, log, 100, progressElements);
        } catch (_) {}
        const doc = XMLLoader.parseXml(text);
        if (onSuccess) onSuccess(doc);
        return doc;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false });

      let received = 0;
      const textParts = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        received += value.byteLength;
        textParts.push(decoder.decode(value, { stream: true }));

        // emit progress (your signature)
        try {
          if (total) {
            const percent = Math.min(100, Math.round((received / total) * 100));
            onProgress(prefix, log, percent, progressElements);
          } else {
            // unknown total: emit a throttled pseudo-progress (optional)
            // here we do nothing; or you could emit null/bytes if you want.
          }
        } catch (_) {}
      }

      // flush decoder
      textParts.push(decoder.decode());
      const xmlString = textParts.join('');

      const xmlDoc = XMLLoader.parseXml(xmlString);

      try {
        onProgress(prefix, log, 100, progressElements);
      } catch (_) {}

      if (onSuccess) onSuccess(xmlDoc);
      return xmlDoc;
    } catch (err) {
      try {
        onError(err, errorElement);
      } catch (_) {
        // fall back to console if user handler throws
        console.error(err);
      }
      throw err; // keep promise semantics
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // === your handlers kept as-is (feel free to keep your originals) ===
  static handleError(error, element) {
    //element.textContent = error;
    console.log(error);
  }

  static handleProgress(prefix, log, progress, elements) {
    
    if(log)
      console.log(prefix + " Progress: " + progress + "%");
    //elements.numeric.textContent = (progress + "%");
    //elements.graphic.bar1.style.width = (progress + "%");
    //elements.graphic.bar2.style.width = ((100 - progress) + "%");
  }

  // --- helper ---
  static parseXml(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    const parserErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parserErrors && parserErrors.length > 0) {
      const message = parserErrors[0].textContent || 'XML parse error';
      const e = new Error(message);
      e.name = 'XMLParseError';
      throw e;
    }

    // preserve your domain-specific check
    if (xmlDoc.getElementsByTagName('misc-error').length > 0) {
      const e = new Error('Miscelleneous Error Found');
      e.name = 'XMLDomainError';
      throw e;
    }

    return xmlDoc;
  }
}


const abortController = new AbortController();

/*
try {
  const xmlDoc = await XMLLoader.loadXml('/assets/nonsense_heavy.xml', {
    progressElements: {
      // numeric: document.querySelector('#pct'),
      // graphic: { bar1: document.querySelector('#bar1'), bar2: document.querySelector('#bar2') }
    },
    errorElement: null,
    onProgress: XMLLoader.handleProgress,
    onError: XMLLoader.handleError,
    timeoutMs: 60000,
    signal: abortController.signal,
  });

  // ... proceed with your WebXR init using xmlDoc
} catch (e) {
  // already surfaced via handleError; keep or remove as you like
}*/