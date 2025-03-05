# Abyss Ascending: Generative Cosmic Adventure

![Abyss Ascending](https://interzone.art.br/abyss_ascending/thumb.png)

**Abyss Ascending** is a web-based **generative interactive fiction** that takes players on an immersive journey through the depths of an **oceanic sci-fi universe**. Featuring **dynamic AI-driven storytelling**, **generative backgrounds**, **audio narration**, and an interactive **cosmic submarine interface**, this project blends deep narrative exploration with cutting-edge web technologies.

🚀 **Live Demo:** [Abyss Ascending](https://interzone.art.br/abyss_ascending/)

---

## 🌊 Features

- **📝 Interactive Text RPG:** A choice-driven adventure where every decision shapes the journey.
- **🎨 AI-Generated Backgrounds:** Uses **Pollinations' API** to dynamically generate sci-fi oceanic visuals based on story progression.
- **🔄 Seamless Background Transitions:** Implemented a **polling mechanism** to fetch images in real time for flawless transitions.
- **🌌 Sci-Fi Themed UI:** A **futuristic terminal-style** chat system with a glowing, immersive design.
- **🎵 Procedural Music Generation:** Dynamic MIDI-based soundscapes using **Tone.js** and **Midijourney** for an immersive audio experience.
- **🎤 Audio Narration:** Text-to-speech narration using the **Pollinations' API** with optimized chunk processing for faster response.
- **🔊 Separate Audio Controls:** Independent volume sliders for background music and narration.
- **📱 Welcome Screen:** An engaging intro screen that introduces players to the game before starting the adventure.
- **🎼 Sound Processing:** Adaptive audio manipulation with delay, reverb, and FM synthesis for deep atmospheric tension.
- **⚡ Optimized Performance:** Efficient image and audio handling with **progressive preloading** and **auto-retry mechanisms**.
- **💻 Responsive Design:** Fully optimized for both **desktop and mobile devices**.

---

## 🛠️ Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/rafabez/abyss_ascending.git
cd abyss_ascending
```

### 2️⃣ Open in a Browser
Since this project is built using HTML, CSS, and JavaScript, you can simply open `index.html` in any modern browser.

Alternatively, you can serve it using a simple Python HTTP server:
```bash
python3 -m http.server
```
Then, visit `http://localhost:8000` in your browser.

---

## 🖥️ Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **AI-Generated Content:** [Pollinations API](https://pollinations.ai)
- **Text-to-Speech Narration:** Pollinations Audio API with asynchronous queue processing
- **Dynamic Backgrounds:** Fetching and real-time polling for seamless image transitions
- **Audio Processing:** **Tone.js** for sound synthesis, adaptive ambient effects, and procedural music generation
- **Music Prompt Processing:** **Midijourney** for generating short MIDI-based sequences
- **UI Design:** Sci-Fi styled text-based interface with futuristic glowing elements

---

## 🚀 How It Works

### 🎭 Story & Gameplay
- The game begins with an **immersive intro screen** that introduces players to the cosmic ocean universe.
- Players take on the role of **Captain Delyra Voss**, navigating the advanced submersible spacecraft, **CosmoNautilux**.
- Each decision impacts the unfolding narrative, leading to multiple branching storylines.
- The text interface simulates an onboard AI terminal, guiding players through an uncharted abyss.

### 🖼️ Image Generation Process
1. **Extracts** a relevant short image description from the AI-generated story response.
2. **Creates a refined image prompt** and sends it to Pollinations API.
3. **Polls the API** every second until the image is ready.
4. **Seamlessly updates the background** to match the ongoing story atmosphere.

### 🎤 Audio Narration Process
1. **Splits text** into optimized chunks with smaller first segments for fast initial response.
2. **Uses Progressive Preloading** to fetch upcoming audio segments while current audio plays.
3. **Manages an asynchronous audio queue** for seamless playback between segments.
4. **Provides separate volume controls** for narration and background music.

### 🎵 Music Generation Process
1. **Extracts a short, contextually relevant music prompt** from the AI-generated text.
2. **Converts the text prompt into a MIDI sequence** using Midijourney.
3. **Processes the MIDI sequence** through **Tone.js** to generate ambient background music.
4. **Applies effects** such as reverb, delay, and FM synthesis to create an immersive soundscape.
5. **Loops the music dynamically**, adapting to story progression.

### 🔄 Auto-Retry & Performance Optimizations
- **Audio Preloading Buffer:** Maintains a sliding window of upcoming audio chunks to eliminate gaps.
- **Image Polling:** Continuously checks image status and reattempts fetching if necessary.
- **Event-Driven Architecture:** Uses event listeners for efficient resource management.
- **Dynamic Resource Allocation:** Prioritizes immediate content while background-loading future content.

---

## 🖼️ Screenshots

### Welcome Screen
![Abyss Ascending Intro Screen](screenshot_AA_intro.jpg)

### Example Gameplay Scene
![Abyss Ascending Screenshot](screenshot_AA_01.jpg)

---

## 📜 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Contributing
We welcome contributions! If you'd like to improve the game, please:
1. Fork the repo
2. Create a new branch (`feature-xyz`)
3. Commit changes (`git commit -m 'Added new feature'`)
4. Push the branch (`git push origin feature-xyz`)
5. Submit a Pull Request

---

## 📬 Contact
Developed by **[Rafael Beznos](https://github.com/rafabez)**  
For inquiries, feedback, or feature requests, feel free to open an issue or reach out via GitHub!

---

Happy exploring, Captain! 🌌🤿
