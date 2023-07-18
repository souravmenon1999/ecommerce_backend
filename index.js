import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();
const server = express();
server.use(express.json({ limit: "50mb" }));
server.use(cors());
server.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected!"));

server.use("/", app);

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
