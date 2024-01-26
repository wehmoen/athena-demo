# SkyMavis Account Service Demo

The purpose of this application is to demonstrate the integration of the SkyMavis Account Service using OAuth for authentication.

## Getting Started

To get access to the SkyMavis Account Service, head over to [SkyMavis Developer Portal](https://developers.skymavis.com), login, create an application and request access to the Account Service. If granted, use the credentials shown in the developer portal in the `.env` file.

## Setup

1. Copy `.env.example` to `.env` and fill in the credentials.
2. Set `http://localhost:3000/callback` as the redirect url in the developer portal.
3. Set `http://localhost:3000` as the post logout url in the developer portal.
4. Run `pnpm install` to install the dependencies.

## Key Files

- `src/athena.ts`: This file contains the `AthenaUser` interface and the `createClient` function. The `AthenaUser` interface defines the user object returned from the account service. The `createClient` function creates the OAuth client used to communicate with the account service.
- `.env`: This file contains environment variables for the application, including `ATHENA_CLIENT_ID` and `ATHENA_CLIENT_SECRET`.
- `src/index.ts`: This is the main entry point of the application. It sets up the Express server, configures session handling, and defines several routes (`/`, `/login`, `/callback`, `/logout`).

## Environment Variables

- `ATHENA_CLIENT_ID`: The client ID for the Athena OAuth client.
- `ATHENA_CLIENT_SECRET`: The client secret for the Athena OAuth client.

## Routes

- `/`: The home route. If the user is not logged in, it displays a login button. If the user is logged in, it displays some of the user's account details.
- `/login`: This route generates a random state, stores it in the session, and redirects the user to the authorization URL.
- `/callback`: This route handles the OAuth callback. It checks the state, exchanges the authorization code for an access token, retrieves the user's profile, and stores the user's profile in the session.
- `/logout`: This route destroys the session and redirects the user to the home route.

## Running the Project

To run the project, use the following command:

```bash
pnpm dev
```

The server will start listening on the port specified by the PORT environment variable, or 3000 if PORT is not set. Then open http://localhost:3000 in your browser and click the login button.
