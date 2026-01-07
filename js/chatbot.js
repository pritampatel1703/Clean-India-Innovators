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
            <button id="close-chat" class="close-chat">&times;</button>
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
    const toggleBtn = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('close-chat');
    const navTrigger = document.querySelector('.nav-chatbot');

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

    // Nav Trigger (only works for floating mode usually, but safety check)


    // Basic Message Handling (Expandable later)
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');

    function addMessage(text, sender) {
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
        // Keep suggestions at the bottom, or append if none
        // messages.appendChild(div); // The original code had appendChild after insertBefore...
        // Let's stick to simple append for now as the original logic was a bit mixed.
        // If I look at the file content again:
        /*
        123: messages.insertBefore(div, messages.querySelector('.suggestions')); // Keep tips at bottom or scroll? 
        124:         // Actually, normally suggestions go away or stay at bottom. For now append to end.
        125:         messages.appendChild(div);
        */
        // It seems it was appending to the end in the original code (line 125 overrides 123 if both run? No, insertBefore moves it, appendChild moves it again). 
        // I will trust the user wants it at the bottom.
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

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
        // This is the special OpenAI-compatible URL for Gemini
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization": `Bearer ${API_KEY}`,
                    "x-goog-api-key": "AIzaSyAn7dnVYbsSs_tO58XHiXZ_41z54ciD_BY"
                },
                body: JSON.stringify({
                    contents: [{ "parts": [{ "text": userText }] }
                    ]
                })
            });
            console.log("***", response)
            const data = await response.json();

            console.log(data);
            // Output the result
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error("API Error:", error);
            return "Failed to get response.";
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

                // Try Gemini First
                let response = await callGeminiAPI(text);
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
