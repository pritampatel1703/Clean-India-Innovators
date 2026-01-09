document.addEventListener('DOMContentLoaded', () => {

    // 1. Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/chatbot.css';
    document.head.appendChild(link);

    // 2. Inject HTML
    // 2. Determine Mode & Inject
    const fullPageContainer = document.getElementById('chatbot-full-page-container');

    // Template for the Inner Window
    const chatWindowHTML = `
        <!-- Header -->
        <div class="chat-header">
            <div class="bot-info">
                <img src="LOGO/logo circle.png" alt="Bot">
                <div class="bot-text">
                    <h3>Clean India BOT</h3>
                    <span>Online, ready to help!</span>
                </div>
            </div>
            <div class="header-controls" style="display: flex; align-items: center; gap: 10px;">
                <button id="clear-chat" class="close-chat" title="Clear Chat" style="font-size: 1.2rem;"><i class="fa-solid fa-trash"></i></button>
                <button id="close-chat" class="close-chat">&times;</button>
            </div>
        </div>

        <!-- Messages -->
        <div id="chat-messages" class="chat-messages">
            <!-- Welcome -->
            <div class="message bot">
                <img src="LOGO/logo circle.png" class="avatar">
                <div class="bubble">
                    Hello there! I'm Clean India Bot, your friendly waste expert. How can I help you learn about recycling today?
                </div>
            </div>
            
            <!-- Suggestions -->
            <div class="suggestions">
                <button class="suggestion-chip">What is compost?</button>
                <button class="suggestion-chip">How do I recycle glass?</button>
                <button class="suggestion-chip">Why is recycling important?</button>
                <button class="suggestion-chip">What are the 3 Rs?</button>
            </div>
        </div>

        <!-- Input -->
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Ask Clean India Bot anything...">
            <button id="send-btn" class="send-btn">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        </div>

        <!-- Custom Clear Modal -->
        <div id="clear-modal" class="chat-modal hidden">
            <div class="chat-modal-content">
                <div class="modal-icon"><i class="fa-solid fa-trash-can"></i></div>
                <h3>Clear History?</h3>
                <p>This will delete your conversation history. You can't undo this action.</p>
                <div class="modal-actions">
                    <button id="btn-cancel-clear" class="btn-cancel">Cancel</button>
                    <button id="btn-confirm-clear" class="btn-danger">Clear Chat</button>
                </div>
            </div>
        </div>
    `;

    if (fullPageContainer) {
        // --- EMBEDDED MODE ---
        fullPageContainer.innerHTML = `
            <div id="chatbot-window" class="chatbot-window embedded">
                ${chatWindowHTML}
            </div>
        `;
        // Hide floating toggle if exists (it won't be injected, but just in case)

    } else {
        // --- FLOATING MODE ---
        const floatingHTML = `
            <div id="chatbot-widget">
                <button id="chatbot-toggle" class="chatbot-toggle">
                    <i class="fa-regular fa-comment-dots"></i>
                </button>
                <div id="chatbot-window" class="chatbot-window hidden">
                    ${chatWindowHTML}
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', floatingHTML);
    }

    // 3. Logic

    // --- CONFIGURATION & STATE ---
    const API_PROVIDER = 'gemini'; // Options: 'gemini', 'ollama'
    const STORAGE_KEY = 'clean_india_chat_history';

    const SYSTEM_PROMPT = `
    You are Clean India Bot, an expert on waste management, recycling, and the Clean India user's mission.
    Your goal is to engage users in conversation about cleanliness and the environment.

    INSTRUCTIONS:
    1. If the user asks about waste, bins, or recycling, answer directly and helpfully.
    2. If the user asks about ANY unrelated topic (movies, sports, coding, daily life, anything else), DO NOT REFUSE.
       Instead, creatively BRIDGE the topic back to waste management, recycling, or cleanliness.
    
    Examples of Bridging:
    - User: "Who won the match?"
      Bot: "I'm focusing on the green game! Speaking of matches, stadiums generate a lot of waste to recycle. 🏟️♻️"
    - User: "I love pizza."
      Bot: "Pizza is delicious! 🍕 Remember to put the greasy box in the Green Bin (compost) if it's soiled, or Blue Bin if clean!"
    - User: "Write a poem."
      Bot: "Here's a poem: Roses are red, violets are blue, recycle your plastic, and the earth thanks you! 🌍"

    Always keep the tone fun, polite, and educational about Clean India.
    `;

    // --- CONTEXT STATE ---
    let chatHistory = [
        { role: 'user', text: SYSTEM_PROMPT },
        { role: 'model', text: "Understood. I will answer all questions by connecting them back to cleanliness and recycling." }
    ]; // For Gemini (Initialized with System Prompt)
    let ollamaContext = null; // For Ollama

    const toggleBtn = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('close-chat');
    const clearBtn = document.getElementById('clear-chat');
    const navTrigger = document.querySelector('.nav-chatbot');

    // Modal Elements
    const clearModal = document.getElementById('clear-modal');
    const btnCancelClear = document.getElementById('btn-cancel-clear');
    const btnConfirmClear = document.getElementById('btn-confirm-clear');

    // Toggle Function
    function toggleChat() {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.focus();
        }
    }

    // Event Listeners
    // Event Listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleChat);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Show Custom Modal
            clearModal.classList.remove('hidden');
        });
    }

    if (btnCancelClear) {
        btnCancelClear.addEventListener('click', () => {
            clearModal.classList.add('hidden');
        });
    }

    if (btnConfirmClear) {
        btnConfirmClear.addEventListener('click', () => {
            performClearChat();
            clearModal.classList.add('hidden');
        });
    }

    // Nav Trigger (only works for floating mode usually, but safety check)


    // Basic Message Handling (Expandable later)
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');

    function addMessage(text, sender, save = true) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;

        let messageHtml = text;
        if (sender === 'bot' && typeof marked !== 'undefined') {
            // Parse Markdown
            messageHtml = marked.parse(text);
        }

        let content = '';
        if (sender === 'bot') {
            content = `<img src="LOGO/logo circle.png" class="avatar"><div class="bubble">${messageHtml}</div>`;
        } else {
            content = `<img src="LOGO/member%20logo.png" class="avatar"><div class="bubble">${text}</div>`;
        }

        div.innerHTML = content;
        messages.insertBefore(div, messages.querySelector('.suggestions'));
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        if (save) {
            saveToStorage(text, sender);
        }
    }

    // --- PERSISTENCE LOGIC ---
    function saveToStorage(text, sender) {
        const nav = localStorage.getItem(STORAGE_KEY);
        let history = nav ? JSON.parse(nav) : [];
        history.push({ text, sender });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function loadChatHistory() {
        const nav = localStorage.getItem(STORAGE_KEY);
        if (nav) {
            const history = JSON.parse(nav);
            // If history exists, clear default welcome message? 
            // Better: if history exists, we probably want to clear the default "Hello" to avoid dupes, 
            // OR we assume the default hello was part of the first session.
            // Let's clear current messages to be safe and rebuild.

            // However, the template has hardcoded welcome.
            // Let's remove all .message divs except invalid ones?
            // Easier: clear chat-messages innerHTML but keep suggestions?
            // Actually, let's just clear everything and rebuild.

            // Wait, we need the suggestion chips.
            // Let's remove only .message elements
            const existingMessages = messages.querySelectorAll('.message');
            existingMessages.forEach(msg => msg.remove());

            // Re-render
            history.forEach(msg => {
                addMessage(msg.text, msg.sender, false); // false = don't save again

                // Rebuild Gemini History
                chatHistory.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    text: msg.text
                });
            });

            // Scroll to bottom
            messages.scrollTop = messages.scrollHeight;
        }
    }

    function clearChat() {
        clearModal.classList.remove('hidden');
    }

    function performClearChat() {
        if (true) {
            localStorage.removeItem(STORAGE_KEY);
            chatHistory = [
                { role: 'user', text: SYSTEM_PROMPT },
                { role: 'model', text: "Understood. I will answer all questions by connecting them back to cleanliness and recycling." }
            ];
            ollamaContext = null;

            // Reset UI
            // We can just reload the page or manually reset. Manual is smoother.
            // Remove messages
            const existingMessages = messages.querySelectorAll('.message');
            existingMessages.forEach(msg => msg.remove());

            // Add Default Welcome
            addMessage("Hello there! I'm Clean India Bot, your friendly waste expert. How can I help you learn about recycling today?", 'bot', true);
        }
    }

    // Load on init
    loadChatHistory();

    // --- SMART LOGIC ---

    const knowledgeBase = {
        // Greetings
        "hello": "Namaste! 🙏 How can I help you keep India clean today?",
        "hi": "Hello there! Ready to recycle? ♻️",
        "hey": "Hi! What waste item are you confused about?",
        "bye": "Goodbye! Remember: Reduce, Reuse, Recycle! 🌱",
        "thank": "You're welcome! Together for a Clean India! 🇮🇳",

        // Identity
        "who are you": "I am the Clean India Bot, your AI assistant for smart waste management.",
        "name": "My name is Clean India Bot.",
        "created": "I was created by the Clean India Innovators team.",

        // Waste Categories (The Core Knowledge)
        "plastic": "Plastics like bottles and clean wrappers go in the **Blue Bin** (Dry Waste). 🔵",
        "dustbin": "Plastics like bottles and clean wrappers go in the **Blue Bin** (Dry Waste). 🔵",
        "bottle": "Plastic bottles go in the **Blue Bin** 🔵. Please crush them first! Glass bottles also go in Blue.",
        "paper": "Paper, newspaper, and cardboard go in the **Blue Bin** (Dry Waste). 🔵 Please keep them dry.",
        "cardboard": "Cardboard boxes should be flattened and put in the **Blue Bin** 🔵.",
        "food": "Leftover food, vegetable peels, and fruits go in the **Green Bin** (Wet Waste) 🟢 for composting.",
        "vegetable": "Vegetable peels are great for compost! Put them in the **Green Bin**. 🟢",
        "fruit": "Fruit skins and scraps go in the **Green Bin**. 🟢",
        "glass": "Glass bottles and broken glass go in the **Blue Bin**. 🔵 Handle with care!",
        "metal": "Metal cans and foil go in the **Blue Bin**. 🔵 Clean them if possible.",
        "can": "Aluminum and tin cans go in the **Blue Bin**. 🔵",

        // E-Waste & Hazardous
        "battery": "Batteries are **E-Waste/Hazardous**. 🔴 Do NOT throw them in regular bins. Look for specific e-waste collection points.",
        "phone": "Old phones are E-Waste. 🔴 Please drop them at an electronics recycling center.",
        "wire": "Wires and cables are E-Waste. 🔴",
        "bulb": "Light bulbs are hazardous/sanitary waste. 🔴 Wrap them safely and look for specialized collection.",

        // Sanitary
        "diaper": "Diapers and sanitary napkins go in the **Red Bin** (Sanitary/Hazardous). 🔴",
        "bandage": "Medical waste like bandages goes in the **Red Bin**. 🔴",

        // General Concepts
        "recycle": "Recycling turns waste into new products! Paper, plastic, glass, and metal are recyclable. ♻️",
        "compost": "Composting turns wet waste (food, plants) into fertilizer for soil. It happens in the **Green Bin**. 🟢",
        "3r": "The 3Rs are **Reduce** (create less waste), **Reuse** (use items again), and **Recycle** (process old items into new ones).",
        "bin color": "🟢 Green = Wet/Organic\n🔵 Blue = Dry/Recyclable\n🔴 Red = Hazardous/Sanitary",
        "color": "🟢 Green = Wet/Organic\n🔵 Blue = Dry/Recyclable\n🔴 Red = Hazardous/Sanitary"
    };

    function getBotResponse(input) {
        input = input.toLowerCase();

        // 1. Direct Keyword Search
        for (const key in knowledgeBase) {
            if (input.includes(key)) {
                return knowledgeBase[key];
            }
        }

        // 2. Fallbacks
        if (input.includes("dry")) return "Dry waste includes paper, plastic, metal, and glass. It goes in the **Blue Bin**. 🔵";
        if (input.includes("wet")) return "Wet waste includes food, peels, and garden waste. It goes in the **Green Bin**. 🟢";

        return "I'm not sure about that one yet! 🤔 Try asking about specific items like 'plastic', 'food', 'batteries', or 'paper'.";
    }

    // --- GEMINI API INTEGRATION ---
    // 🔴 IMPORTANT: Paste your API Key below!
    // const API_KEY = "AIzaSyD8XnsZHrHCsv6d-o8fL-n2K9TCFvjvJt4";

    // async function callGeminiAPI(userMessage) {
    //     if (!API_KEY) {
    //         console.warn("Gemini API Key missing. Using local logic.");
    //         return null; // Fallback to local
    //     }

    //     const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    //     // Construct System Prompt using our Local Knowledge
    //     const systemContext = `
    //         You are Clean India Bot, a helpful artificial intelligence assistant for the 'Clean India Innovators' platform.
    //         Your goal is to educate users on waste management, recycling, and the 3Rs (Reduce, Reuse, Recycle) in the Indian context.

    //         Key Rules/Knowledge:
    //         ${JSON.stringify(knowledgeBase)}

    //         Instructions:
    //         1. Answer the user's question concisely.
    //         2. If they ask about bins, strictly follow the Green/Blue/Red colors defined in the knowledge.
    //         3. Be polite and encouraging. Use emojis like 🌿, ♻️, 🇮🇳.
    //         4. Keep answers short (under 50 words) if possible, appropriate for a chat window.
    //     `;

    //     try {
    //         const response = await fetch(API_URL, {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({
    //                 contents: [{
    //                     parts: [
    //                         { text: systemContext },
    //                         { text: `User Question: ${userMessage}` }
    //                     ]
    //                 }]
    //             })
    //         });

    //         const data = await response.json();
    //         if (data.candidates && data.candidates[0].content) {
    //             return data.candidates[0].content.parts[0].text;
    //         } else {
    //             throw new Error("Invalid API response");
    //         }
    //     } catch (error) {
    //         console.error("Gemini Error:", error);
    //         return null; // Fallback
    //     }
    // }











































    async function callGeminiAPI(userText) {
        const API_KEY = "AIzaSyAn7dnVYbsSs_tO58XHiXZ_41z54ciD_BY";
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        try {
            // Construct the contents array from history
            const contents = chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            // Add the current user message
            contents.push({
                role: 'user',
                parts: [{ text: userText }]
            });

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": API_KEY
                },
                body: JSON.stringify({ contents: contents })
            });

            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;

            // Update History on Success
            chatHistory.push({ role: 'user', text: userText });
            chatHistory.push({ role: 'model', text: botResponse });

            return botResponse;

        } catch (error) {
            console.error("API Error:", error);
            return "Failed to get response.";
        }
    }

    async function callOllamaAPI(userText) {
        const API_URL = "http://localhost:11434/api/generate";

        try {
            const payload = {
                model: "smollm2:360m",
                prompt: userText,
                stream: false,
                system: SYSTEM_PROMPT
            };

            // Add context if available
            if (ollamaContext) {
                payload.context = ollamaContext;
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // Save context for next turn
            if (data.context) {
                ollamaContext = data.context;
            }

            return data.response;

        } catch (error) {
            console.error("Ollama API Error:", error);
            return null;
        }
    }






























































    if (sendBtn && input) {
        sendBtn.addEventListener('click', async () => {
            const text = input.value.trim();
            if (text) {
                addMessage(text, 'user');
                input.value = '';
                input.disabled = true; // Prevent double send

                // Show Typing Indicator (Optional, reusing bot message style)
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message bot typing-indicator';
                typingDiv.innerHTML = `<img src="LOGO/logo circle.png" class="avatar"><div class="bubble">...</div>`;
                messages.appendChild(typingDiv);
                messages.scrollTop = messages.scrollHeight;

                // Select API based on Configuration
                let response;
                if (API_PROVIDER === 'ollama') {
                    response = await callOllamaAPI(text);
                } else {
                    response = await callGeminiAPI(text);
                }
                // let response = await callGeminiAPI(text);
                // let response = await callOllamaAPI(text);

                console.log(response)
                // Remove Typing Indicator
                if (messages.contains(typingDiv)) {
                    messages.removeChild(typingDiv);
                }
                input.disabled = false;
                input.focus();

                // Fallback to Local Knowledge if Gemini failed or no key
                if (!response) {
                    response = getBotResponse(text);
                }

                addMessage(response, 'bot');
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendBtn.click();
        });
    }

    // Quick Chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.innerText;
            addMessage(text, 'user');
            setTimeout(() => {
                addMessage(`Great question about "${text}"! (Simulated response)`, 'bot');
            }, 800);
        });
    });

});
