
const YOUTUBE_API_KEY = "AIzaSyCLH3qeIcweFOKwlksZphgXM5CP7E03HVs";
const OPENAI_API_KEY = "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";

async function generateContent() {
    const keywords = document.getElementById("keywords").value.trim();
    const output = document.getElementById("output");
    const loader = document.getElementById("loader");

    if (!keywords) {
        output.innerHTML = "<p style='color: red;'>يرجى إدخال الكلمات المفتاحية!</p>";
        return;
    }

    loader.style.display = "block"; // Show loader
    output.innerHTML = "";

    try {
        // Fetch video data
        const videos = await fetchYouTubeVideos(keywords);

        // Fetch article content
        const article = await fetchOpenAIContent(keywords);

        // Generate an image using OpenAI DALL·E
        const image = await fetchOpenAIImage(keywords);

        // Generate HTML content
        const articleHTML = `
            <h3 style="text-align: right;">مقال شامل عن "${keywords}"</h3>
            <div style="text-align: right;">
                <h4>المقال:</h4>
                <p>${article}</p>
                <img src="${image}" alt="صورة توضيحية" style="width: 100%; max-width: 640px; margin: 10px 0;"/>
                <h4>الفيديوهات:</h4>
                ${videos.map(video => `
                    <div>
                        <h5>${video.title}</h5>
                        ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; max-width: 640px;"/>` : ""}
                        <p>${video.id !== "#" ? `<a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">شاهد الفيديو</a>` : ""}</p>
                    </div>
                `).join('')}
            </div>
        `;

        output.innerHTML = articleHTML;
    } catch (error) {
        output.innerHTML = `<p style="color: red;">حدث خطأ: ${error.message}</p>`;
    } finally {
        loader.style.display = "none"; // Hide loader
    }
}

async function fetchYouTubeVideos(keywords) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(keywords)}&key=${YOUTUBE_API_KEY}&maxResults=5`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`خطأ في استدعاء YouTube API: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url
    }));
}

async function fetchOpenAIContent(keywords) {
    const url = "https://api.openai.com/v1/completions";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "text-davinci-003",
            prompt: `اكتب مقالًا عن: ${keywords}`,
            max_tokens: 300,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`خطأ في استدعاء OpenAI API: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].text.trim();
}

async function fetchOpenAIImage(keywords) {
    const url = "https://api.openai.com/v1/images/generations";
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            prompt: `صورة تعبر عن ${keywords}`,
            n: 1,
            size: "640x360"
        })
    });

    if (!response.ok) {
        throw new Error(`خطأ في استدعاء OpenAI API لتوليد الصور: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].url;
}

// نسخ المقالة
function copyArticle() {
    const output = document.getElementById("output").innerHTML;
    const tempElement = document.createElement("textarea");
    tempElement.value = output;
    document.body.appendChild(tempElement);
    tempElement.select();
    document.execCommand("copy");
    document.body.removeChild(tempElement);
    alert("تم نسخ المقالة إلى الحافظة!");
}

// تحميل المقال كـ HTML
function downloadArticle() {
    const output = document.getElementById("output").innerHTML;
    const blob = new Blob([output], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "article.html";
    link.click();
}
