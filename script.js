// Replace with your Pollinations API Key if required
const messagesDiv = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const notification = document.getElementById("notification");

// System Prompt as per your lore
const systemPrompt = `Abyss Ascending: A Cosmic Ocean Adventure RPG

Purpose of GPT:
This GPT, titled "Abyss Ascending," is crafted to offer an immersive text-based RPG experience, blending science fiction adventure with subtle environmental themes, all set within an intriguing oceanic and space exploration narrative.

Knowledge Field/Area of Expertise:
The GPT is an expert in Interactive Fiction and RPG Game Mechanics, focusing on Sci-Fi and Oceanic World Building. It excels in crafting compelling narratives and integrating environmental themes into the story.

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
Respond in a text-adventure style, guiding the player through the story and offering relevant narrative and choices. Offer 5 choices every time. And BE CONCISE ON THE TEXT PLEASE, SHORT AND CONCISE.
`;

let messages = [
  {
    role: "system",
    content: systemPrompt,
  },
  {
    role: "assistant",
    content:
      "**Greetings, Captain.**\nThis is the Abyssal Interface. The cosmic oceans beyond are uncharted. The crew looks to you for guidance. The abyss awaits your command.\n\n**What stirs within you, Captain?** Type your thoughts to begin the journey.",
  },
];

/**
 * Parses markdown-like syntax to HTML.
 * Supports bold (**text**) and italics (*text*).
 * @param {string} text - The text to parse.
 * @returns {string} - The parsed HTML string.
 */
function parseMarkdown(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return text;
}

/**
 * Adds a user message to the UI.
 * Removes any existing user message with the same class.
 * @param {string} text - The message text.
 * @param {string} cssClass - The CSS class for styling.
 */
function addUserMessageToUI(text, cssClass) {
  const existingUserMessages = messagesDiv.querySelectorAll(`.message.${cssClass}`);
  existingUserMessages.forEach(msg => msg.remove());

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", cssClass);
  msgDiv.innerHTML = parseMarkdown(text);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Adds an assistant message to the UI with a typewriter effect.
 * Replaces existing assistant messages with the same class.
 * @param {string} text - The message text.
 * @param {string} cssClass - The CSS class for styling.
 * @param {function} callback - Function to call after typing is complete.
 */
function addAssistantMessageToUI(text, cssClass, callback) {
  const existingAssistantMessages = messagesDiv.querySelectorAll(`.message.${cssClass}`);
  existingAssistantMessages.forEach(msg => msg.remove());

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", cssClass);
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  let parsedText = parseMarkdown(text);
  let index = 0;
  const speed = 10; // Typing speed in milliseconds per character

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

/**
 * Shows a notification message.
 * @param {string} message - The message to display.
 */
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

/**
 * Transforms the assistant's text response into a very short image prompt.
 * It sends a new prompt request using the content of the assistant's response.
 * @param {string} content - The assistant's text response.
 * @returns {Promise<string>} - The transformed short image prompt.
 */
async function transformToImagePrompt(content) {
  const transformRequest = {
    model: "llama",
    messages: [
      {
        role: "system",
        content: "You are a transformation engine that converts verbose content into a very short image prompt."
      },
      {
        role: "user",
        content: `TRANSFORM THIS CONTENT TO A VERY SHORT IMAGE PROMPT: ${content}`
      }
    ]
  };

  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformRequest)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data?.choices?.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error transforming content:", error);
    return "";
  }
}

/**
 * Polls the image URL repeatedly until a valid image is returned or a timeout is reached.
 * Updates the URL parameter (timestamp) on each poll.
 * @param {string} formattedPrompt - The final prompt string (already sanitized and encoded).
 * @param {number} maxTime - Maximum time to poll in milliseconds (default: 30000).
 * @param {number} interval - Polling interval in milliseconds (default: 1000).
 * @returns {Promise<{blob: Blob, url: string}>} - Resolves with the image blob and URL.
 */
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
    } catch (e) {
      // Ignore fetch errors and continue polling
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error("Timeout while polling for image.");
}

/**
 * Generates and transitions the background image based on the assistant's response.
 * First, it transforms the assistant text into a very short image prompt,
 * then appends style keywords, sanitizes and encodes the final prompt,
 * and polls the image API until the image is ready.
 * The background change is triggered as soon as the image is available.
 * @param {string} assistantText - The full text response from the assistant.
 */
async function generateImage(assistantText) {
  // Transform the assistant's text into a very short image prompt.
  let shortPrompt = await transformToImagePrompt(assistantText);
  
  // If the transformation returns an empty prompt, fall back to a default prompt.
  if (!shortPrompt) {
    shortPrompt = "Abstract cosmic ocean";
  }
  
  // Sanitize the short prompt: remove any characters except letters, numbers, and spaces.
  shortPrompt = shortPrompt.replace(/[^\w\s]/gi, '');
  
  // Define style keywords.
  const styleKeywords = "Style keywords: Cosmic Ocean, Space Underwater, Sci-Fi, Futuristic, Avatar Movie Style";
  
  // Combine the short prompt and style keywords.
  const finalImagePrompt = `${shortPrompt} ${styleKeywords}`;
  
  // Further sanitize the final prompt (allowing commas if desired).
  const sanitizedPrompt = finalImagePrompt.replace(/[^\w\s,]/gi, '');
  
  const formattedPrompt = encodeURIComponent(sanitizedPrompt.trim());
  
  console.log(`Generating image with prompt: "${sanitizedPrompt}"`);
  
  try {
    // Poll for the image until it's available.
    const { blob: imgBlob, url: imageUrl } = await pollForImage(formattedPrompt, 30000, 1000);
    console.log(`Image ready at URL: ${imageUrl}`);
    const imgObjectURL = URL.createObjectURL(imgBlob);

    const bgTop = document.getElementById("bg-top");
    const bgBottom = document.getElementById("bg-bottom");

    // Trigger background change immediately once the image is ready.
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

/**
 * Sends the user's message to the Pollinations API and handles the response.
 */
async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;

  addUserMessageToUI(userText, "user-message");
  messages.push({ role: "user", content: userText });
  userInput.value = "";

  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama",
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data?.choices?.length > 0) {
      const assistantText = data.choices[0].message.content;
      messages.push({ role: "assistant", content: assistantText });
      // Start background image generation using the new polling procedure.
      generateImage(assistantText);
      // Start the typewriter effect for the assistant's text concurrently.
      addAssistantMessageToUI(assistantText, "gpt-message", () => {});
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

// Initialize default background on load.
document.addEventListener("DOMContentLoaded", () => {
  const bgBottom = document.getElementById("bg-bottom");
  bgBottom.style.backgroundImage = "url('abyss_bg.webp')";
});
