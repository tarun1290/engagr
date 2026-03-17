import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String },
  instagramAccessToken: { type: String },
  instagramBusinessId: { type: String },
  instagramUsername: { type: String },
  instagramProfilePic: { type: String },
  pageAccessToken: { type: String },
  pageId: { type: String },
  isConnected: { type: Boolean, default: false },
  automation: {
    postTrigger: { type: String, default: 'any' },
    selectedPostId: { type: String },
    commentTrigger: { type: String, default: 'any' },
    keywords: { type: [String], default: [] },
    replyEnabled: { type: Boolean, default: true },
    replyMessages: { type: [String], default: ['Check your DM! 📩'] },
    dmContent: { type: String },
    buttonText: { type: String },
    linkUrl: { type: String },
    isActive: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
