import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./db/index.js"


dotenv.config({
    path: "../.env"
})

const port = process.env.PORT || 8000

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Sever is running at https://localhost:${port}`)
        })
    })
    .catch((err) => console.log("MongoDB connection error", err))