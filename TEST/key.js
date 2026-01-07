async function getGeminiResponse(userText) {
    const API_KEY = "AIzaSyD8XnsZHrHCsv6d-o8fL-n2K9TCFvjvJt4";
    // This is the special OpenAI-compatible URL for Gemini
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gemini-1.5-flash", // or "gemini-1.5-pro"
                messages: [
                    { role: "system", content: "You are a helpful AI assistant." },
                    { role: "user", content: userText }
                ]
            })
        });

        const data = await response.json();

        // Output the result
        return data.choices[0].message.content;

    } catch (error) {
        console.error("API Error:", error);
        return "Failed to get response.";
    }
}
