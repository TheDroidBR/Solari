import init, * as df from './deepfilternet.js';

class DeepFilterProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.initialized = false;
        this.dfState = null;
        this.bufferSize = 480; // Standard DF frame size usually, or we need to check params
        this.inputBuffer = [];
        this.outputBuffer = [];

        this.port.onmessage = async (e) => {
            if (e.data.type === 'init') {
                try {
                    // Initialize WASM
                    await init(e.data.wasmBytes);

                    // Create State within WASM
                    // Default Params usually work for voice
                    // We might need to construct DfParams if the library requires it
                    // Based on typical usage:
                    let params = new df.DfParams();
                    this.dfState = new df.DfState(params);

                    this.initialized = true;
                    this.port.postMessage({ type: 'ready' });
                    console.log('[DeepFilterProcessor] Initialized successfully');
                } catch (err) {
                    console.error('[DeepFilterProcessor] Init failed:', err);
                    this.port.postMessage({ type: 'error', error: err.toString() });
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !input[0] || !output || !output[0]) return true;

        // Passthrough if not ready
        if (!this.initialized || !this.dfState) {
            output[0].set(input[0]);
            return true;
        }

        const inputChannel = input[0];
        const outputChannel = output[0];

        // DeepFilterNet expects chunks of specific size (usually 480 for 48kHz, but often frame-based)
        // We buffer input until we have enough for one process call

        // Push input to buffer
        for (let i = 0; i < inputChannel.length; i++) {
            this.inputBuffer.push(inputChannel[i]);
        }

        // DeepFilter typically processes 1 frame at a time.
        // Let's assume frame size is 480 (10ms @ 48kHz) which is standard for these models.
        // We verify this logic.
        const FRAME_SIZE = 480;

        while (this.inputBuffer.length >= FRAME_SIZE) {
            const frame = new Float32Array(this.inputBuffer.splice(0, FRAME_SIZE));

            // Process Frame
            // Function signature depends on bindings. Usually process_frame(input_float32array) -> output_float32array
            // or modify in place.
            let processed = this.dfState.process(frame);

            // Push to output buffer
            for (let i = 0; i < processed.length; i++) {
                this.outputBuffer.push(processed[i]);
            }
        }

        // Write to output
        for (let i = 0; i < outputChannel.length; i++) {
            if (this.outputBuffer.length > 0) {
                outputChannel[i] = this.outputBuffer.shift();
            } else {
                outputChannel[i] = 0; // Underrun
            }
        }

        return true;
    }
}

registerProcessor('deepfilternet-processor', DeepFilterProcessor);
