// Global Variables and DOM Elements
const messagesDiv = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const notification = document.getElementById("notification");

// Global variables to manage looping music
let currentMusicPart = null;
let currentSynths = [];
let currentEffectNodes = [];

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
  let parsedText = parseMarkdown(text);
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
    showNotification("Failed to load the generated image after several attempts.");
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
    updateMuteIcon();
  });

  volumeSlider.addEventListener("input", updateVolume);
  updateVolume();
  updateMuteIcon();
});
