// Porcupine Wake Word Detection Worker (Placeholder Version)
let isListening = false;
let audioBuffer = [];
let detectionTimeout = null;

self.onmessage = async function(e) {
  const { command, data } = e.data;
  
  switch (command) {
    case 'init':
      initializeWakeWord();
      break;
    case 'process':
      if (isListening && data) {
        processAudio(data);
      }
      break;
    case 'stop':
      stopListening();
      break;
  }
};

function initializeWakeWord() {
  isListening = true;
  
  self.postMessage({
    command: 'ready',
    message: 'Wake word detection initialized'
  });
}

function processAudio(audioData) {
  if (!isListening) return;
  
  // Simple energy-based detection (placeholder for real Porcupine)
  const samples = new Int16Array(audioData);
  const energy = calculateAudioEnergy(samples);
  
  // Collect audio in buffer for pattern detection
  audioBuffer.push(energy);
  if (audioBuffer.length > 30) {
    audioBuffer.shift();
  }
  
  // Look for speech pattern
  if (detectSpeechPattern()) {
    triggerWakeWord();
  }
}

function calculateAudioEnergy(samples) {
  let energy = 0;
  for (let i = 0; i < samples.length; i++) {
    energy += samples[i] * samples[i];
  }
  return Math.sqrt(energy / samples.length);
}

function detectSpeechPattern() {
  if (audioBuffer.length < 15) return false;
  
  const recent = audioBuffer.slice(-15);
  const avgEnergy = recent.reduce((a, b) => a + b) / recent.length;
  
  // Trigger on sustained audio above threshold
  return avgEnergy > 800 && !detectionTimeout;
}

function triggerWakeWord() {
  if (detectionTimeout) return;
  
  self.postMessage({
    command: 'keyword',
    keyword: 'jarvis'
  });
  
  // 4 second cooldown
  detectionTimeout = setTimeout(() => {
    detectionTimeout = null;
  }, 4000);
}

function stopListening() {
  isListening = false;
  audioBuffer = [];
  if (detectionTimeout) {
    clearTimeout(detectionTimeout);
    detectionTimeout = null;
  }
}