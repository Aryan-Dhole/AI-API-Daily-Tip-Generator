// ---------- Helpers (midnight reset) ----------
function isNewDay(lastTime) {
    if (!lastTime) return true;
    const lastDate = new Date(lastTime).toDateString();
    const todayDate = new Date().toDateString();
    return lastDate !== todayDate; // reset at midnight
}

function saveTipToStorage(tip, category) {
    const now = Date.now();
    localStorage.setItem("dailyTip", tip);
    localStorage.setItem("tipTimestamp", now.toString());
    localStorage.setItem("tipCategory", category || "");
}

function loadStoredTip() {
    const tip = localStorage.getItem("dailyTip");
    const ts = parseInt(localStorage.getItem("tipTimestamp"), 10);
    const category = localStorage.getItem("tipCategory");
    return { tip, ts, category };
}

function resetLock() {
    localStorage.removeItem("dailyTip");
    localStorage.removeItem("tipTimestamp");
    localStorage.removeItem("tipCategory");
    alert("Tip lock cleared (DEV ONLY)");
}

// ---------- Typewriter ----------
function typeWriterEffect(text, i = 0) {
    const output = document.getElementById("output");

    if (i < text.length) {
        output.innerHTML += text.charAt(i);
        setTimeout(() => typeWriterEffect(text, i + 1), 24);
    }
}

// ---------- Build prompt ----------
function buildPrompt(category, topic) {
    const base = {
        coding: `Give one short, actionable coding tip about "${topic || 'general coding'}". One sentence.`,
        productivity: `Give one short, actionable productivity tip about "${topic || 'general productivity'}". One sentence.`,
        fitness: `Give one short, actionable fitness tip about "${topic || 'general fitness'}". One sentence.`,
        career: `Give one short, actionable career tip about "${topic || 'general career advice'}". One sentence.`
    };
    return base[category] || base.coding;
}

// ---------- Main generate ----------
async function generateTip() {
    const category = document.getElementById("categorySelect").value;
    const topic = document.getElementById("topicInput").value.trim();
    const output = document.getElementById("output");
    const spinner = document.getElementById("spinner");
    const { tip, ts, category: storedCategory } = loadStoredTip();

    // Check stored tip
    if (tip && ts && !isNewDay(ts) && storedCategory === category) {
        output.innerText = tip;
        alert("You've already received today's tip for this category.");
        return;
    }

    output.innerHTML = "";
    spinner.style.display = "block";

    try {
        const prompt = buildPrompt(category, topic);
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer YOUR_OPENROUTER_KEY_HERE",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://app.netlify.com",
                "X-Title": "daily-ai-tip"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 80
            })
        });

        const data = await res.json();
        if (!res.ok || !data.choices || !data.choices[0]) {
            throw new Error("Invalid AI response");
        }

        const raw = data.choices[0].message.content.trim();
        const cleaned = raw.replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').replace(/(\r\n|\n|\r)/gm, '').trim();

        output.innerText = "";
        typeWriterEffect(cleaned);
        saveTipToStorage(cleaned, category);
        console.log(data);


    } catch (err) {
        output.innerHTML = `<span style="color:#ff6b6b">Error: ${err.message}</span>`;
        console.error(err);
    } finally {
        spinner.style.display = "none";
    }
}

// ---------- Events ----------
document.getElementById("generateBtn").addEventListener("click", generateTip);
document.getElementById("resetBtn").addEventListener("click", resetLock);

window.addEventListener("load", () => {
    const { tip, ts } = loadStoredTip();
    if (tip && ts && !isNewDay(ts)) {
        document.getElementById("output").innerText = tip;
    }
});
