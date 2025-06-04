# You Awaken in a Strange Place - Companion App

This is a companion application for the tabletop RPG "You Awaken in a Strange Place". It aims to facilitate game setup, character management, and gameplay for both Game Masters (GMs) and Players.

## ✨ Features

- **User Authentication:**
  - Email/Password sign-up and login.
  - Social login with Google and Facebook (via Firebase).
- **Game Master (GM) Flow:**
  - Create game servers with a name and optional password.
  - GM Lobby to view server details (name, password) and connected players.
  - Ability to "Start Game", transitioning players to the setup phase.
  - Monitor player progress during the initial game setup (dice rolls).
- **Player Flow:**
  - Join existing game servers using server name and password.
  - Player Lobby to see other connected players and wait for the GM to start.
  - Participate in a collaborative game setup phase:
    - **Dice Rolling:** Players roll 2d6 to determine roles in world definition.
- **Real-time Updates:** Player lists and game setup progress are updated in real-time using Firebase Firestore.
- **Session Management:**
  - Prompts users to resume their previous game session (as GM or Player) if one is found.
  - Handles clearing of old session data when starting/joining new games.
- **Firebase Functions for Server Maintenance (Planned):**
  - Automated cleanup of stale/empty game servers (instructions provided for server-side implementation).
- **Character Management (Initial):**
  - Basic character creation flow (theme, details, name/description, primary skill).
  - Character sheet display with skills, items (placeholder), and objective.

## 🚀 Tech Stack

- **Frontend:** React Native with Expo (for web, iOS, and Android compatibility)
- **State Management:** React Context API
- **Backend & Database:** Firebase (Authentication, Firestore)
- **Language:** TypeScript
- **Styling:** React Native StyleSheet

## 🛠️ Setup & Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd youawakeinastrangeplace
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add your Firebase and OAuth configuration:

    ```env
    # Firebase Project Configuration (Get these from your Firebase project settings)
    FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID" # Optional

    # OAuth Client IDs (Get these from Google Cloud Console and Facebook Developer Portal)
    EXPO_GOOGLE_CLIENT_ID="YOUR_EXPO_GOOGLE_CLIENT_ID" # Typically the Web Client ID for Expo Go/Web
    IOS_GOOGLE_CLIENT_ID="YOUR_IOS_GOOGLE_CLIENT_ID"
    ANDROID_GOOGLE_CLIENT_ID="YOUR_ANDROID_GOOGLE_CLIENT_ID"
    FACEBOOK_APP_ID="YOUR_FACEBOOK_APP_ID"
    ```

    _Note: For the Gemini API, ensure `API_KEY` is set as an environment variable in your deployment/build environment. This app assumes `process.env.API_KEY` is available for Gemini calls._

4.  **Firebase Setup:**

    - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    - Enable **Authentication** and configure the sign-in methods you want to support (Email/Password, Google, Facebook).
    - Set up **Firestore Database**.
    - **Security Rules:**
      - For development, you can use permissive rules (allowing authenticated users to read/write). **Remember to secure these for production!**
      - Example development rules for Firestore (`firestore.rules`):
        ```javascript
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow read/write for any authenticated user during development
            match /{document=**} {
              allow read, write: if request.auth != null;
            }
          }
        }
        ```
      - For more specific rules related to `userProfiles` and `gameServers`, refer to the examples provided during development iterations.

5.  **Firebase Functions (for Server Cleanup - Optional but Recommended for Production):**
    - If not already done, initialize Firebase Functions in your project root:
      ```bash
      firebase init functions
      ```
      (Choose TypeScript, install dependencies).
    - Add the `cleanupStaleGameServers` function code (provided in previous development steps) to `functions/src/index.ts`.
    - Deploy the function:
      ```bash
      firebase deploy --only functions
      ```
    - This requires your Firebase project to be on the **Blaze (Pay-as-you-go) plan** and might require enabling Google App Engine in your Google Cloud project for the specified region.

## 📜 Available Scripts

In the project directory, you can run:

- `npm start` or `yarn start`: Runs the app in development mode using Expo CLI.
- `npm run android` or `yarn android`: Runs the app on an Android emulator or connected device.
- `npm run ios` or `yarn ios`: Runs the app on an iOS simulator or connected device (macOS only).
- `npm run web` or `yarn web`: Runs the app in a web browser.

## 🔮 Future Work / Roadmap

- Complete the world definition phase (Genre, Adjective, Location input by players).
- Implement interference token logic.
- Develop the full character creation process after world setup.
- Build the main gameplay screens for players and GMs.
- GM tools for narrative control and player management.
- More robust error handling and UI feedback.

## 🤝 Contributing

Contributions are welcome! Please follow standard coding practices and ensure your changes align with the project's goals. (Further details can be added here if the project becomes open to external contributors).

## 📄 License

This project is currently private. (You can change this to MIT, Apache-2.0, etc., if you decide to open-source it).
