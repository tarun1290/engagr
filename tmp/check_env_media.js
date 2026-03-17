const accessToken = "EAAL7mXBItg8BQ1uMKKZCmTR8SCH5gdzumaFDcj4mxNL4m3MFqOsk78ZA57hJK6tFVf2UsgyHCyxYWezHpegkpTP8yd2HsTAcwyooIxBGhZAmh9CYEqbbDZAuzUbZAptC1jw50Qw9lSm1ZCZCeB50uL6GZAFegzbLAJSOxPWTx7Qt4HUuqCcjL6YX2szVfcJZCb2PyJ0SKrwLekgKLIHomm7XDuRYZD";
const businessId = "17841460161632234";

async function checkMedia() {
    console.log("Testing credentials from ai-dm-bot .env...");
    const url = `https://graph.facebook.com/v25.0/${businessId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption&limit=6&access_token=${accessToken}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error("API ERROR:", data.error.message);
        } else if (data.data) {
            console.log("SUCCESS! Media found:", data.data.length);
            data.data.forEach((m, i) => {
                console.log(`${i+1}. ${m.media_type}: ${m.id}`);
            });
        }
    } catch (err) {
        console.error("FETCH ERROR:", err.message);
    }
}

checkMedia();
