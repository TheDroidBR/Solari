/**
 * RNNoise AudioWorklet Processor - Jitsi WASM Edition v2
 * 
 * Uses official Jitsi rnnoise-wasm binary.
 * Fixed import structure based on rnnoise.js analysis:
 * - Imports: { a: { a: resize_heap, b: memcpy_big } }
 * - Exports: c=memory, e=init, f=create, g=malloc, h=destroy, i=free, j=process_frame
 */

class RNNoiseProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.wasmLoaded = false;
        this.bufferSize = 480; // RNNoise frame @ 48kHz (10ms)

        // WASM state
        this.ptrIn = 0;
        this.ptrOut = 0;
        this.rnnoiseState = null;
        this.HEAPU8 = null;
        this.HEAPF32 = null;
        this.wasmMemory = null;

        // Buffering
        this.inputBuffer = new Float32Array(this.bufferSize);
        this.bufferCount = 0;
        this.outputQueue = [];

        // HPF State
        this.hp1PrevIn = 0;
        this.hp1PrevOut = 0;
        this.hp2PrevIn = 0;
        this.hp2PrevOut = 0;
        this.hpAlpha = 0.985;

        // VAD Gate
        this.currentGain = 0.0;
        this.vadThreshold = 0.50; // Default: 50% slider = 0.5 VAD threshold

        this.port.onmessage = async (event) => {
            if (event.data.type === 'load-wasm') {
                try {
                    await this.initWasm(event.data.wasmBytes);
                } catch (e) {
                    console.error('[RNNoise] Init failed:', e);
                    this.port.postMessage({ type: 'error', error: e.toString() });
                }
            } else if (event.data.type === 'set-threshold') {
                // Update VAD threshold from UI slider (0.3 to 0.95)
                this.vadThreshold = event.data.threshold;
            }
        };
    }

    updateHeapViews(buffer) {
        this.HEAPU8 = new Uint8Array(buffer);
        this.HEAPF32 = new Float32Array(buffer);
    }

    async initWasm(wasmBytes) {
        const self = this;

        // Jitsi WASM import structure (from rnnoise.js analysis)
        const importObject = {
            a: {
                // a = _emscripten_resize_heap
                a: (requestedSize) => {
                    requestedSize = requestedSize >>> 0;
                    const oldSize = self.HEAPU8.length;
                    const maxHeapSize = 2147483648;

                    if (requestedSize > maxHeapSize) return false;

                    const alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;

                    for (let cutDown = 1; cutDown <= 4; cutDown *= 2) {
                        let overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
                        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
                        const newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));

                        try {
                            self.wasmMemory.grow((newSize - oldSize + 65535) >>> 16);
                            self.updateHeapViews(self.wasmMemory.buffer);
                            return true;
                        } catch (e) { }
                    }
                    return false;
                },
                // b = _emscripten_memcpy_big
                b: (dest, src, num) => {
                    self.HEAPU8.copyWithin(dest, src, src + num);
                }
            }
        };

        // Compile and instantiate
        const module = await WebAssembly.instantiate(wasmBytes, importObject);
        this.wasmInstance = module.instance;
        this.exports = this.wasmInstance.exports;

        // Get memory (export 'c')
        this.wasmMemory = this.exports.c;
        this.updateHeapViews(this.wasmMemory.buffer);

        // Call __wasm_call_ctors if exists (export 'd')
        if (this.exports.d) {
            this.exports.d();
        }

        // Initialize RNNoise
        // e = rnnoise_init (optional)
        // f = rnnoise_create
        // g = malloc
        // j = rnnoise_process_frame

        this.rnnoiseState = this.exports.f(0); // rnnoise_create(NULL)
        this.ptrIn = this.exports.g(this.bufferSize * 4); // malloc for input
        this.ptrOut = this.exports.g(this.bufferSize * 4); // malloc for output

        if (!this.rnnoiseState || !this.ptrIn || !this.ptrOut) {
            throw new Error('Failed to allocate RNNoise state or buffers');
        }

        this.wasmLoaded = true;
        this.port.postMessage({ type: 'loaded' });
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !input[0] || !output || !output[0]) return true;

        if (!this.wasmLoaded) {
            output[0].set(input[0]);
            return true;
        }

        const inputChannel = input[0];
        const outputChannel = output[0];

        for (let i = 0; i < inputChannel.length; i++) {
            let sample = inputChannel[i];

            // Pre-filter: Dual HPF
            let s1 = this.hp1PrevOut * this.hpAlpha + sample - this.hp1PrevIn;
            this.hp1PrevIn = sample;
            this.hp1PrevOut = s1;

            let s2 = this.hp2PrevOut * this.hpAlpha + s1 - this.hp2PrevIn;
            this.hp2PrevIn = s1;
            this.hp2PrevOut = s2;

            this.inputBuffer[this.bufferCount] = s2;
            this.bufferCount++;

            if (this.bufferCount === this.bufferSize) {
                // Refresh heap views in case memory grew
                this.updateHeapViews(this.wasmMemory.buffer);

                // Copy to WASM heap
                this.HEAPF32.set(this.inputBuffer, this.ptrIn >> 2);

                // Process with RNNoise (j = rnnoise_process_frame)
                const vadProb = this.exports.j(this.rnnoiseState, this.ptrOut, this.ptrIn);

                // Read processed output
                const outStart = this.ptrOut >> 2;

                // Pass RNNoise output directly - RNNoise handles noise removal
                for (let j = 0; j < this.bufferSize; j++) {
                    this.outputQueue.push(this.HEAPF32[outStart + j]);
                }

                this.bufferCount = 0;
            }
        }

        for (let i = 0; i < outputChannel.length; i++) {
            outputChannel[i] = this.outputQueue.length > 0 ? this.outputQueue.shift() : 0;
        }

        if (this.outputQueue.length > 4800) {
            this.outputQueue.splice(0, this.outputQueue.length - 2400);
        }

        return true;
    }
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
