const mongoose = require('mongoose');

const uri = "mongodb+srv://amanraj5687_db_user:axMyo759PrdOxEpY@querybot.wxojyis.mongodb.net/test?retryWrites=true&w=majority";

const UserSchema = new mongoose.Schema({
  clerkId: String,
  instagramUsername: String,
  instagramAccessToken: String,
  instagramBusinessId: String,
  isConnected: Boolean,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkMedia() {
    console.log("Connecting to MongoDB...");
    try {
        await mongoose.connect(uri);
        console.log("SUCCESS: Connected!");
        
        const user = await User.findOne({ isConnected: true });
        if (!user) {
            console.log("No connected user found.");
            return;
        }

        console.log(`ClerkID: ${user.clerkId}, IG Username: ${user.instagramUsername}, BusinessID: ${user.instagramBusinessId}`);
        
        // Test media fetch
        const fbUrl = `https://graph.facebook.com/v25.0/${user.instagramBusinessId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption&limit=6&access_token=${user.instagramAccessToken}`;
        console.log("Fetching media from Meta API...");
        
        const response = await fetch(fbUrl);
        const data = await response.json();
        
        if (data.error) {
            console.error("API ERROR:", data.error.message);
        } else if (data.data) {
            console.log("Media found:", data.data.length);
            data.data.forEach((m, i) => {
                console.log(`${i+1}. ${m.media_type}: ${m.id}`);
            });
        } else {
            console.log("No media found in the response.");
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error("FAILURE:", err.message);
    }
}

checkMedia();
