// Global Variables and DOM Elements
const messagesDiv = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const notification = document.getElementById("notification");

// Global variables to manage looping music
let currentMusicPart = null;
let currentSynths = [];
let currentEffectNodes = [];
let currentAudio = null; // Add variable to store the current audio element
let audioQueue = []; // Array to store queued audio chunks
let isPlayingAudio = false; // Flag to track if audio is currently playing
let preloadedAudios = {}; // Object to store preloaded audio elements
let maxPreloadCount = 2; // Maximum number of chunks to preload at once

// System prompt and initial messages for the RPG
const systemPrompt = `Abyss Ascending: A Cosmic Ocean Adventure RPG

Your purpose:
You are titled "Abyss Ascending," crafted to offer an immersive text-based RPG experience, blending science fiction adventure with subtle environmental themes, all set within an intriguing oceanic and space exploration narrative.

Knowledge Field/Area of Expertise:
You are an expert in Interactive Fiction and RPG Game Mechanics, focusing on Sci-Fi and Oceanic World Building. You excel in crafting compelling narratives and integrating environmental themes into the story.

The Player:
The Player is Captain Delyra Voss, commander of the advanced submersible spacecraft, CosmoNautilux.

Task Breakdown:
1. Narrative Development: Develop an engaging narrative for "Abyss Ascending," suitable for a text-based RPG.
2. RPG Mechanics Integration: Include numbered choice-driven elements that let players influence the narrative and endings.
3. Environmental Description: Provide vivid descriptions of underwater and space settings for immersive storytelling.
4. Resource Management Gameplay: Incorporate strategic elements like oxygen, fuel, and energy management.
5. Output Format: Create text passages, choice-driven narrative branches, and atmospheric descriptions that enhance the text-based experience.
6. Environmental Themes Integration: Weave environmental themes into the story to complement the narrative.

Important Note:
Respond in a text-adventure style, guiding the player through the story and offering relevant narrative and choices. Offer 5 choices every time. Don´t make the text tooo long, please.
`;

let messages = [
  { role: "system", content: systemPrompt },
  {
    role: "assistant",
    content:
      "**Greetings, Captain.**\nThis is the Abyssal Interface. The cosmic oceans beyond are uncharted. The crew looks to you for guidance. The abyss awaits your command.\n\n**What stirs within you, Captain?** Type your thoughts to begin the journey.",
  },
];

// Utility: Parse Markdown for bold and italic formatting.
function parseMarkdown(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return text;
}

// UI: Add user message to chat
function addUserMessageToUI(text, cssClass) {
  const existingUserMessages = messagesDiv.querySelectorAll(`.message.${cssClass}`);
  existingUserMessages.forEach(msg => msg.remove());
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", cssClass);
  msgDiv.innerHTML = parseMarkdown(text);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// UI: Add assistant message with typing effect
function addAssistantMessageToUI(text, cssClass, callback) {
  const existingAssistantMessages = messagesDiv.querySelectorAll(`.message.${cssClass}`);
  existingAssistantMessages.forEach(msg => msg.remove());
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", cssClass);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  // Generate narration audio for the text
  generateNarration(text);
  
  // Check if text contains a numbered list of options (1-5)
  const hasNumberedList = text.match(/\n\d+\.\s+[^\n]+/g);
  
  if (hasNumberedList && hasNumberedList.length > 0) {
    // First, identify the start of the options section
    const firstOptionPattern = /\n([1-5])\.\s+([^\n]+)/;
    const firstOptionMatch = text.match(firstOptionPattern);
    
    if (!firstOptionMatch) {
      // Fall back to normal display if regex fails
      addStandardMessage(parseMarkdown(text), msgDiv, callback);
      return;
    }
    
    // Find the index where the options section starts
    const firstOptionIndex = text.indexOf(firstOptionMatch[0]);
    
    // Get the text before the options
    const preOptionsText = text.substring(0, firstOptionIndex);
    
    // Use regex to find all numbered options
    const optionsData = [];
    
    // More precise regex to extract each option
    // This captures the option number and its text, but stops at a newline followed by:
    // - another option number (1-5 followed by period and space)
    // - OR a blank line
    // - OR end of string
    const optionPattern = /\n([1-5])\.\s+([^\n]+)(?=\n[1-5]\.\s+|\n\s*\n|\n*$)/g;
    
    let optionMatch;
    let lastIndex = firstOptionIndex;
    
    // Find and process each option
    while ((optionMatch = optionPattern.exec(text)) !== null) {
      optionsData.push({
        number: optionMatch[1],
        text: optionMatch[2].trim(),
        fullMatch: optionMatch[0],
        startIndex: optionMatch.index,
        endIndex: optionMatch.index + optionMatch[0].length
      });
      lastIndex = optionMatch.index + optionMatch[0].length;
    }
    
    // Check if there's content after the options 
    // (typically a "Choose your next step" or similar message)
    let concludingText = "";
    if (lastIndex < text.length) {
      // Get everything after the last identified option
      const remainingText = text.substring(lastIndex).trim();
      
      // If there's non-empty content and it starts with typical prompt text patterns
      if (remainingText && 
         (remainingText.match(/^\s*\n+\s*(Choose|What|Select|Make|Your|Please)/i) || 
          remainingText.match(/^\s*\n+\s*$/))) {
        concludingText = remainingText;
      }
    }
    
    // Parse pre-options text for markdown
    let preOptionsHtml = parseMarkdown(preOptionsText);
    
    // Type the pre-options text first with animation
    let index = 0;
    const speed = 10;
    function typePreOptions() {
      if (index < preOptionsHtml.length) {
        if (preOptionsHtml[index] === '<') {
          const endTag = preOptionsHtml.indexOf('>', index);
          if (endTag !== -1) {
            msgDiv.innerHTML += preOptionsHtml.substring(index, endTag + 1);
            index = endTag + 1;
            typePreOptions();
            return;
          }
        }
        msgDiv.innerHTML += preOptionsHtml[index];
        index++;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        setTimeout(typePreOptions, speed);
      } else {
        // After typing pre-options text, add options as buttons
        const optionsDiv = document.createElement("div");
        optionsDiv.classList.add("choice-buttons");
        
        optionsData.forEach(option => {
          const button = document.createElement("button");
          button.classList.add("choice-btn");
          // Parse any markdown in the option text (like bold formatting)
          button.innerHTML = parseMarkdown(option.text);
          button.addEventListener("click", function() {
            userInput.value = option.text;
            sendMessage();
          });
          optionsDiv.appendChild(button);
        });
        
        msgDiv.appendChild(optionsDiv);
        
        // If there's concluding text, display it after the buttons
        if (concludingText) {
          const concludingDiv = document.createElement("div");
          concludingDiv.classList.add("concluding-text");
          concludingDiv.innerHTML = parseMarkdown(concludingText);
          msgDiv.appendChild(concludingDiv);
        }
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        if (callback) callback();
      }
    }
    
    typePreOptions();
  } else {
    // Original typing effect for regular messages without options
    addStandardMessage(parseMarkdown(text), msgDiv, callback);
  }
}

// Helper function for standard message typing animation
function addStandardMessage(parsedText, msgDiv, callback) {
  let index = 0;
  const speed = 10;
  function type() {
    if (index < parsedText.length) {
      if (parsedText[index] === '<') {
        const endTag = parsedText.indexOf('>', index);
        if (endTag !== -1) {
          msgDiv.innerHTML += parsedText.substring(index, endTag + 1);
          index = endTag + 1;
          type();
          return;
        }
      }
      msgDiv.innerHTML += parsedText[index];
      index++;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      setTimeout(type, speed);
    } else {
      if (callback) callback();
    }
  }
  type();
}

// Notification display
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Transformation functions for image and music prompts
async function transformToImagePrompt(content) {
  const transformRequest = {
    model: "llama",
    messages: [
      { role: "system", content: "You are a transformation engine that converts verbose content into a very short image prompt." },
      { role: "user", content: `TRANSFORM THIS CONTENT TO A VERY SHORT IMAGE PROMPT: ${content}` }
    ]
  };
  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformRequest)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data?.choices?.length > 0 ? data.choices[0].message.content.trim() : "";
  } catch (error) {
    console.error("Error transforming content:", error);
    return "";
  }
}

async function transformToMusicPrompt(content) {
  const transformRequest = {
    model: "llama",
    messages: [
      { role: "system", content: "You are a transformation engine that converts verbose content into a very short music prompt consisting of 3 to 5 words." },
      { role: "user", content: `TRANSFORM THIS CONTENT TO A VERY SHORT MUSIC PROMPT: ${content}` }
    ]
  };
  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformRequest)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data?.choices?.length > 0 ? data.choices[0].message.content.trim() : "";
  } catch (error) {
    console.error("Error transforming content to music prompt:", error);
    return "";
  }
}

async function pollForImage(formattedPrompt, maxTime = 30000, interval = 1000) {
  const start = Date.now();
  let currentUrl = "";
  while (Date.now() - start < maxTime) {
    currentUrl = `https://image.pollinations.ai/prompt/${formattedPrompt}&timestamp=${new Date().getTime()}`;
    try {
      const response = await fetch(currentUrl);
      if (response.ok) {
        const blob = await response.blob();
        return { blob, url: currentUrl };
      }
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error("Timeout while polling for image.");
}

async function generateImage(assistantText) {
  let shortPrompt = await transformToImagePrompt(assistantText);
  if (!shortPrompt) shortPrompt = "Abstract cosmic ocean";
  shortPrompt = shortPrompt.replace(/[^\w\s]/gi, '');
  const styleKeywords = "Style keywords: Cosmic Ocean, Space Underwater, Sci-Fi, Futuristic, Avatar Movie Style";
  const finalImagePrompt = `${shortPrompt} ${styleKeywords}`;
  const sanitizedPrompt = finalImagePrompt.replace(/[^\w\s,]/gi, '');
  const formattedPrompt = encodeURIComponent(sanitizedPrompt.trim());
  console.log(`Generating image with prompt: "${sanitizedPrompt}"`);
  try {
    const { blob: imgBlob, url: imageUrl } = await pollForImage(formattedPrompt, 30000, 1000);
    console.log(`Image ready at URL: ${imageUrl}`);
    const imgObjectURL = URL.createObjectURL(imgBlob);
    const bgTop = document.getElementById("bg-top");
    const bgBottom = document.getElementById("bg-bottom");
    bgTop.style.backgroundImage = `url('${imgObjectURL}')`;
    bgTop.style.opacity = 1;
    bgTop.addEventListener('transitionend', function handler() {
      bgTop.removeEventListener('transitionend', handler);
      bgBottom.style.backgroundImage = `url('${imgObjectURL}')`;
      bgTop.style.opacity = 0;
      URL.revokeObjectURL(imgObjectURL);
    });
  } catch (error) {
    console.error("Error loading image after polling:", error);
    // Silent fail - don't show notification to user
    // Instead, just keep the existing background
  }
}

async function generateMusic(assistantText) {
  let musicPrompt = await transformToMusicPrompt(assistantText);
  if (!musicPrompt) musicPrompt = "Ambient cosmic melody";
  console.log(`Generating music with prompt: "${musicPrompt}"`);
  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a melody maker." },
          { role: "user", content: musicPrompt }
        ],
        seed: Math.floor(Math.random() * 1000000),
        model: "midijourney"
      })
    });
    const data = await response.json();
    const content = data.content || (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    const notationRegex = /notation:\s*\|-\s*\n([\s\S]*)/i;
    const notationMatch = content.match(notationRegex);
    if (!notationMatch) {
      console.error("No notation block found in the music API response.");
      return;
    }
    const notationBlock = notationMatch[1];
    let noteLines = notationBlock.split('\n').map(line => line.trim()).filter(line => line !== "");
    if (noteLines.length && noteLines[0].toLowerCase().startsWith('pitch')) {
      noteLines.shift();
    }
    const notes = noteLines.map(line => {
      const parts = line.split(',');
      return {
        pitch: parseInt(parts[0].trim(), 10),
        time: parseFloat(parts[1].trim()),
        duration: parseFloat(parts[2].trim()),
        velocity: parseInt(parts[3].trim(), 10)
      };
    });
    if (currentMusicPart) {
      currentMusicPart.stop();
      currentMusicPart.dispose();
      currentMusicPart = null;
    }
    if (currentSynths.length) {
      currentSynths.forEach(synth => synth.dispose());
      currentSynths = [];
    }
    if (currentEffectNodes.length) {
      currentEffectNodes.forEach(node => node.dispose());
      currentEffectNodes = [];
    }
    await Tone.start();
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
    const delay1 = new Tone.FeedbackDelay({ delayTime: 1.8, feedback: 0.25 });
    const reverb1 = new Tone.Reverb({ decay: 8, preDelay: 0.3 }).toDestination();
    const synth1 = new Tone.FMSynth({
      harmonicity: 2,
      oscillator: { type: "sine" },
      envelope: { attack: 5, decay: 3, sustain: 0.8, release: 10 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 2, decay: 2, sustain: 0.8, release: 5 }
    }).chain(delay1, reverb1);
    const delay2 = new Tone.FeedbackDelay({ delayTime: 1.5, feedback: 0.3 });
    const reverb2 = new Tone.Reverb({ decay: 7, preDelay: 0.25 }).toDestination();
    const synth2 = new Tone.AMSynth({
      oscillator: { type: "triangle" },
      envelope: { attack: 3, decay: 2.5, sustain: 0.75, release: 8 }
    }).chain(delay2, reverb2);
    const chorus3 = new Tone.Chorus(4, 2.8, 0.6).start();
    const delay3 = new Tone.FeedbackDelay({ delayTime: 1.3, feedback: 0.2 });
    const reverb3 = new Tone.Reverb({ decay: 9, preDelay: 0.35 }).toDestination();
    const synth3 = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 4, decay: 2, sustain: 0.7, release: 9 }
    }).chain(chorus3, delay3, reverb3);
    currentSynths = [synth1, synth2, synth3];
    currentEffectNodes.push(delay1, reverb1, delay2, reverb2, chorus3, delay3, reverb3);
    const events = notes.map(note => {
      const noteName = Tone.Frequency(note.pitch, "midi").toNote();
      const velocity = note.velocity / 127;
      return { time: note.time, noteName, duration: note.duration, velocity };
    });
    const loopEnd = events.reduce((max, ev) => Math.max(max, ev.time + ev.duration), 0);
    const part = new Tone.Part((time, event) => {
      synth1.triggerAttackRelease(event.noteName, event.duration, time, event.velocity);
      synth2.triggerAttackRelease(event.noteName, event.duration, time, event.velocity);
      synth3.triggerAttackRelease(event.noteName, event.duration, time, event.velocity);
    }, events);
    part.loop = true;
    part.loopEnd = loopEnd;
    part.start(0);
    currentMusicPart = part;
    
  } catch (error) {
    console.error("Error generating music:", error);
  }
}

// New function to generate narration from text
async function generateNarration(text) {
  try {
    // Stop any currently playing narration
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    // Reset queue and playback state
    audioQueue = [];
    isPlayingAudio = false;
    
    // Split text into sentences for better narration flow
    const sentences = splitIntoSentences(text);
    console.log(`Split text into ${sentences.length} chunks for narration`);
    
    // Process each sentence as a separate audio chunk
    processAudioQueue(sentences);
    
  } catch (error) {
    console.error("Error generating narration:", error);
  }
}

// Function to split text into sentences
function splitIntoSentences(text) {
  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // Check if this is the intro text (from first message)
  const isIntroText = plainText.includes("Greetings, Captain") && 
                      plainText.includes("Abyssal Interface") && 
                      plainText.includes("What stirs within you");
  
  // Use larger chunks for intro text
  if (isIntroText) {
    // Split intro into just 2-3 larger, logical chunks
    const chunks = [];
    
    // Find natural breaking points in the intro text
    if (plainText.includes("The crew looks to you for guidance")) {
      const firstPart = plainText.substring(0, plainText.indexOf("The crew looks to you for guidance"));
      const secondPart = plainText.substring(plainText.indexOf("The crew looks to you for guidance"));
      
      chunks.push(firstPart.trim());
      chunks.push(secondPart.trim());
    } else {
      // Fallback if the expected text pattern isn't found
      chunks.push(plainText);
    }
    
    return chunks;
  }
  
  // For regular text, use paragraph-based chunking for longer sections
  // First try to split by double newlines (paragraphs)
  if (plainText.includes("\n\n")) {
    const paragraphs = plainText.split(/\n\n+/);
    if (paragraphs.length >= 2) {
      return paragraphs.map(p => p.trim()).filter(p => p.length > 0);
    }
  }
  
  // Regular expression to split by sentence endings followed by space or newline
  const sentenceRegex = /[.!?]+[\s\n]+/;
  
  // Split text
  let sentences = plainText.split(sentenceRegex);
  
  // Add back the punctuation (which gets removed by split)
  sentences = sentences.map((sentence, i) => {
    if (i < sentences.length - 1) {
      // Find the punctuation that follows this sentence
      const match = plainText.match(new RegExp(`${escapeRegExp(sentence)}([.!?]+)`, 'i'));
      const punctuation = match ? match[1] : '.';
      return sentence.trim() + punctuation;
    }
    return sentence.trim();
  });
  
  // Use larger chunks - combine multiple sentences
  const maxLength = 300; // Increased max length per chunk
  let chunks = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
    if (!sentence.trim()) return;
    
    const potentialChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    
    if (potentialChunk.length > maxLength) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk = potentialChunk;
    }
  });
  
  if (currentChunk) chunks.push(currentChunk);
  
  // If we ended up with many small chunks, try to combine them further
  if (chunks.length > 5 && chunks.every(chunk => chunk.length < 100)) {
    const combinedChunks = [];
    let combined = '';
    
    chunks.forEach(chunk => {
      if ((combined + ' ' + chunk).length > maxLength) {
        combinedChunks.push(combined);
        combined = chunk;
      } else {
        combined = combined ? combined + ' ' + chunk : chunk;
      }
    });
    
    if (combined) combinedChunks.push(combined);
    return combinedChunks;
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process the audio queue sequentially
function processAudioQueue(sentences) {
  // Reset preloaded audios
  preloadedAudios = {};
  
  // Add all sentences to the queue
  audioQueue = [...sentences];
  
  // Start processing the queue
  playNextInQueue();
  
  // Start preloading next chunks
  preloadNextChunks();
}

// Preload the next few audio chunks
function preloadNextChunks() {
  const chunksToPreload = audioQueue.slice(0, maxPreloadCount);
  
  chunksToPreload.forEach((sentence, index) => {
    if (!preloadedAudios[index] && sentence) {
      // Prepare the narration text with "Say:" prefix
      const narrateText = `Say: ${sentence}`;
      
      // Create URL for the Pollinations audio API
      const url = `https://text.pollinations.ai/${encodeURIComponent(narrateText)}?model=openai-audio&voice=nova`;
      
      console.log(`Preloading chunk ${index + 1}: "${sentence.substring(0, 30)}..."`);
      
      // Create audio element and set source
      const audio = new Audio();
      
      // Set up event listener for successful preload
      audio.addEventListener('canplaythrough', () => {
        console.log(`Chunk ${index + 1} preloaded successfully`);
      });
      
      // Set up error handling
      audio.addEventListener('error', () => {
        console.error(`Error preloading chunk ${index + 1}`);
        delete preloadedAudios[index];
      });
      
      // Start preloading by setting the source
      audio.src = url;
      
      // Force loading to begin immediately
      audio.load();
      
      // Store in preloaded audios object
      preloadedAudios[index] = {
        audio: audio,
        sentence: sentence,
        url: url
      };
    }
  });
}

// Play the next sentence in the queue
function playNextInQueue() {
  if (audioQueue.length === 0) {
    isPlayingAudio = false;
    return;
  }
  
  if (isPlayingAudio) {
    return;
  }
  
  isPlayingAudio = true;
  const nextSentence = audioQueue.shift();
  let audio;
  
  // Check if we have this chunk preloaded
  if (preloadedAudios[0] && preloadedAudios[0].sentence === nextSentence) {
    console.log(`Using preloaded audio for: "${nextSentence.substring(0, 30)}..."`);
    audio = preloadedAudios[0].audio;
    
    // Shift the preloaded audios
    for (let i = 0; i < maxPreloadCount - 1; i++) {
      preloadedAudios[i] = preloadedAudios[i + 1];
    }
    delete preloadedAudios[maxPreloadCount - 1];
    
    // Trigger preload of the next chunk
    setTimeout(preloadNextChunks, 100); // Small delay to ensure UI responsiveness
  } else {
    // If not preloaded, create a new audio element
    console.log(`Narrating (not preloaded): "${nextSentence.substring(0, 30)}..."`);
    
    // Prepare the narration text with "Say:" prefix
    const narrateText = `Say: ${nextSentence}`;
    
    // Create URL for the Pollinations audio API
    const url = `https://text.pollinations.ai/${encodeURIComponent(narrateText)}?model=openai-audio&voice=nova`;
    
    audio = new Audio(url);
  }
  
  // Set volume to match the current system volume
  audio.volume = Tone.Destination.mute ? 0 : Math.pow(10, Tone.Destination.volume.value / 20);
  
  // Set up event handlers for playback
  if (!audio.paused && typeof audio.pause === 'function') {
    audio.pause();
  }
  
  const audioPlayHandler = () => {
    audio.play().catch(e => {
      console.error("Error playing audio:", e);
      handleAudioEnd();
    });
  };
  
  // Remove any existing listeners to prevent duplicates
  audio.removeEventListener('canplaythrough', audioPlayHandler);
  
  // Add the event listener
  audio.addEventListener('canplaythrough', audioPlayHandler);
  
  const audioEndHandler = () => handleAudioEnd();
  
  // Remove any existing listeners to prevent duplicates
  audio.removeEventListener('ended', audioEndHandler);
  
  // Add the event listener
  audio.addEventListener('ended', audioEndHandler);
  
  const audioErrorHandler = () => {
    console.error("Error playing audio chunk");
    handleAudioEnd();
  };
  
  // Remove any existing listeners to prevent duplicates
  audio.removeEventListener('error', audioErrorHandler);
  
  // Add the event listener
  audio.addEventListener('error', audioErrorHandler);
  
  // Function to handle end of audio playback
  function handleAudioEnd() {
    isPlayingAudio = false;
    
    // Clean up event listeners
    audio.removeEventListener('canplaythrough', audioPlayHandler);
    audio.removeEventListener('ended', audioEndHandler);
    audio.removeEventListener('error', audioErrorHandler);
    
    // Play the next sentence when this one finishes
    playNextInQueue();
  }
  
  // Store reference to control later if needed
  currentAudio = audio;
  
  // Ensure loading starts immediately for non-preloaded audio
  if (!preloadedAudios[0] || preloadedAudios[0].sentence !== nextSentence) {
    audio.load();
  }
  
  // Add debug info to check preloading status
  console.log("Current audio queue length:", audioQueue.length);
  console.log("Preloaded audio count:", Object.keys(preloadedAudios).length);
}

async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;
  addUserMessageToUI(userText, "user-message");
  messages.push({ role: "user", content: userText });
  userInput.value = "";
  try {
    const seed = Math.floor(Math.random() * 1000000); // Generate random seed
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama", messages: messages, seed: seed }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data?.choices?.length > 0) {
      const assistantText = data.choices[0].message.content;
      messages.push({ role: "assistant", content: assistantText });
      generateImage(assistantText);
      addAssistantMessageToUI(assistantText, "gpt-message", () => {});
      generateMusic(assistantText);
    } else {
      addAssistantMessageToUI("No response from the system.", "gpt-message", () => {});
    }
  } catch (error) {
    console.error("Error:", error);
    addAssistantMessageToUI("Error: Unable to contact the system.", "gpt-message", () => {});
  }
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Configuration Menu Toggle
  const menuToggle = document.getElementById("menu-toggle");
  const configMenu = document.getElementById("config-menu");

  menuToggle.addEventListener("click", () => {
    configMenu.classList.toggle("active");
  });

  const bgBottom = document.getElementById("bg-bottom");
  bgBottom.style.backgroundImage = "url('abyss_bg.webp')";
  
  // Sound control elements
  const volumeSlider = document.getElementById("volumeSlider");
  const muteBtn = document.getElementById("muteBtn");

  // SVG icons for mute button.
  const speakerIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="#00FFFF" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9v6h4l5 5V4L7 9H3z"/>
    <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" opacity=".6"/>
  </svg>`;
  const speakerMuteIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="#00FFFF" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 12c0-1.77-.77-3.29-2-4.3v8.6c1.23-1.01 2-2.53 2-4.3z" opacity=".3"/>
    <path d="M3 9v6h4l5 5V4L7 9H3z"/>
    <path d="M2.1 2.1l19.8 19.8-1.41 1.41L16.5 19.5c-1.16.64-2.48 1-3.84 1-3.87 0-7-3.13-7-7 0-1.36.36-2.68 1-3.84L.69 3.51 2.1 2.1z"/>
  </svg>`;

  function updateVolume() {
    const dB = parseFloat(volumeSlider.value);
    Tone.Destination.volume.value = dB;
    if (Tone.Destination.mute) {
      Tone.Destination.mute = false;
    }
    
    // Also update narration volume if it's playing
    if (currentAudio) {
      currentAudio.volume = Math.pow(10, dB / 20);
    }
    
    updateMuteIcon();
  }

  function updateMuteIcon() {
    if (Tone.Destination.mute) {
      muteBtn.innerHTML = speakerMuteIcon;
    } else {
      muteBtn.innerHTML = speakerIcon;
    }
  }

  muteBtn.addEventListener("click", () => {
    Tone.Destination.mute = !Tone.Destination.mute;
    
    // Also mute/unmute narration if it's playing
    if (currentAudio) {
      currentAudio.muted = Tone.Destination.mute;
    }
    
    updateMuteIcon();
  });

  volumeSlider.addEventListener("input", updateVolume);
  updateVolume();
  updateMuteIcon();
  
  // Intro Screen Handling
  const introOverlay = document.getElementById("intro-overlay");
  const startJourneyBtn = document.getElementById("start-journey");
  
  startJourneyBtn.addEventListener("click", () => {
    // Hide the intro overlay
    introOverlay.classList.add("hidden");
    
    // Narrate the intro text
    const introText = document.querySelector(".message.gpt-message").textContent;
    generateNarration(introText);
    
    // Start Tone.js audio context (required after user interaction)
    Tone.start();
    
    // After a short delay, remove the overlay completely to prevent any interference
    setTimeout(() => {
      introOverlay.style.display = "none";
    }, 1000);
  });
});
