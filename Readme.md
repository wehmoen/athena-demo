# SkyMavis Account Service Demo

This is a demo to showcase how to integrate the SkyMavis Account Service.

To get access head over to https://developers.skymavis.com, login, create an application and request
access to the Account Service.

If granted use the credentials shown in the developer portal in the `.env` file.

## Setup

1. Copy `.env.example` to `.env` and fill in the credentials.
2. Set `http://localhost:3000/callback` as the redirect url in the developer portal.
3. Set `http://localhost:3000` as the post logout url in the developer portal.
4. Run `pnpm install` to install the dependencies.

## Running it

Run `pnpm dev` to start the server. Then open `http://localhost:3000` in your browser and click the login button.


