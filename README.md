# VidTube - YouTube Inspired Professional Backend Overview

## Introduction
This repository hosts the backend infrastructure for **VidTube**, a platform inspired by YouTube, offering comprehensive functionality for video streaming, user authentication, content management, commenting, and more. Designed for high performance and scalability, this server powers an immersive video-sharing experience similar to YouTube.

## Prerequisites
Before setting up the project, ensure your system meets the following requirements:
- **Node.js**: Install the latest stable version.
- **MongoDB**: Set up a MongoDB instance for data storage.

To install dependencies, run:
```bash
npm install
```

## Running the Server
For development mode with hot-reloading and experimental JSON module support, use:
```bash
npm run dev
```

## Project Structure
The backend follows a modular architecture for maintainability and scalability:
- **`src/`** – Core backend logic.
  - **`index.js`** – Main entry point of the server.
  - **`routes/`** – Defines API endpoints for user accounts, videos, comments, and more.
  - **`controllers/`** – Implements business logic for handling video uploads, streaming, and engagement features.
  - **`middlewares/`** – Custom middleware functions for security and request handling.
  - **`models/`** – Database schema definitions using Mongoose for efficient content management.
  - **`utils/`** – Reusable utility functions for common operations.

## Dependencies
The server leverages well-established libraries to ensure security, performance, and maintainability:
- **bcrypt** – Secure password hashing for user authentication.
- **cloudinary** – Cloud-based media storage and optimized delivery of videos and thumbnails.
- **cookie-parser** – Enhances authentication by handling user session cookies.
- **cors** – Enables cross-origin requests for seamless API interaction.
- **dotenv** – Manages environment variables securely.
- **express** – Fast and flexible web framework.
- **jsonwebtoken** – Implements JWT-based authentication for secure user sessions.
- **mongoose** – Simplifies MongoDB interactions for video metadata storage.
- **mongoose-aggregate-paginate-v2** – Efficiently handles video search and pagination for large datasets.
- **multer** – Handles file uploads, including video and thumbnail processing.
- **nodemon** – Automates server restarts during development for better productivity.
- **prettier** – Ensures consistent code formatting and readability.

## License
This project is open-source and licensed under the **ISC License**, encouraging collaboration and innovation. Contributions, suggestions, and improvements are highly welcome. For inquiries, feel free to open an issue.

---
*Explore the repository, contribute, and help refine VidTube's backend into a scalable, high-performance video-sharing platform!*

- [Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)
