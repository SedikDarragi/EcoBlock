# EcoBlock Network

EcoBlock Network is a decentralized autonomous organization (DAO) and blockchain platform designed to incentivize, track, and verify sustainable actions across various ecological domains. It aims to foster a global community committed to reducing environmental impact by providing tangible rewards and transparent accountability for eco-friendly behaviors.

## Disclaimer

This project is developed for educational and non-commercial purposes only, it was developed during the hackathon IMSET 2025. It is not intended for commercial use. If you are interested in using this project for commercial applications, please contact me on LinkedIn: [https://www.linkedin.com/in/sedik-darragi-73b205352/]

## Installation Steps

Before you begin, ensure you have the following environment set up:

*   **Node.js v18+**: [Download Node.js](https://nodejs.org/en/download/)
*   **MongoDB**: Ensure MongoDB is running locally. Follow the [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/) for your operating system.
*   **Git**: [Download Git](https://git-scm.com/downloads)
*   **(Optional) Ionic CLI**: `npm install -g @ionic/cli`

Once your environment is set up, follow these steps:

1.  **Configure Metamask Wallet**: create a connection on the `contracts/.env` file within the project directory. Add your Metamask wallet private key and a URL for the Metamask API development key.

    Example `contracts/.env`:
    ```
    PRIVATE_KEY=your-private-key
    SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
    ```

2.  **Configure server database**: create a connection on the `server/.env` file within the project directory. Add your mongoDB connection link and port into the file.

    Example `server/.env`:
    ```
    MONGO_URI=your_mongodb_connection
    JWT_SECRET=your_jwt_secret_here
    PORT=5000
    ```

3.  **Install Dependencies**: Open your terminal and run `npm install --legacy-peer-deps` in the following directories:
    *   `client/`
    *   `server/`
    *   The root of the project (`./`)

## Execution Steps

To run the project, ensure MongoDB is running with the correct connection link configured in your `server/.env` file. Then, from the root directory of the project, execute:

```bash
npm start
```

This will start both the client and server applications.
