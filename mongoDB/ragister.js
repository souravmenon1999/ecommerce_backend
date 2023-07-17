import mongoose from "mongoose";

const userRagisterSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, unique: true },
  number: { type: Number, unique: true },
  password: { type: String },
  token: { type: String },
});

const UserRagister = mongoose.model("UserRagister", userRagisterSchema);

export default UserRagister;
