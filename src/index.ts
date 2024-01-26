import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import {randomBytes} from 'crypto';
import athena, {AthenaUser} from './athena.js';

// Load environment variables from .env file
dotenv.config();

// Extend express-session to include state and user in the session data
declare module 'express-session' {
    interface SessionData {
        state: string;
        user?: AthenaUser
    }
}

// Initialize express server
const server = express();
// Middleware to parse URL-encoded bodies
server.use(express.urlencoded({extended: true}));
// Middleware to handle session
server.use(session({
    // Secret should be static and come from an environment variable in production
    secret: randomBytes(16).toString('hex'),
    resave: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    saveUninitialized: true,
}));

// Create OAuth client
const client = await athena.createClient();

/**
 * Route for home page.
 * If user is not logged in, show login page.
 * Else, show user details.
 */
server.get("/", (req, res) => {
    if (!req.session.user) {
        return res.send(`
            <html lang="en">
                <head>
                    <title>SkyMavis Account Service Demo</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
                    <link rel="shortcut icon" href="https://ronin.axiedao.org/favicon.svg">
                </head>
                <body style="background-image: url('https://ronin.axiedao.org/_next/static/media/background.8f35b61e.svg'); background-repeat: no-repeat; background-size: cover">
                    <div class="d-flex justify-content-center flex-column align-items-center vh-100">
                        <h2>Welcome to the SkyMavis Account Service Demo</h2>
                        <p>To login click the button below</p>

                        <a class="btn btn-primary" href="/login">
                            Login with SkyMavis
                        </a>
                    </div>
                </body>
            </html>
        `)
    } else {
        return res.send(`
        <html lang="en">
                <head>
                    <title>SkyMavis Account Service Demo</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
                    <link rel="shortcut icon" href="https://ronin.axiedao.org/favicon.svg">
                </head>
                <body style="background-image: url('https://ronin.axiedao.org/_next/static/media/background.8f35b61e.svg'); background-repeat: no-repeat; background-size: cover">
                    <div class="d-flex justify-content-center flex-column align-items-center vh-100">
                        <h1>Hello ${req.session.user.name}</h1>
                        <p>Thank you for logging in.</p>

                       <p>Here are some of your account details.</p>

                       <div style="max-width: 35vw">
                           <table class="table table-bordered table-responsive">
                                <tr>
                                    <td>Account ID</td>
                                    <td>${req.session.user.id}</td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td>${req.session.user.email}</td>
                                </tr>
                                <tr>
                                    <td>Ronin Address</td>
                                    <td>${req.session.user.roninAddress}</td>
                                </tr>
                                <tr>
                                    <td>Account Created At</td>
                                    <td>${(new Date(req.session.user.accountCreatedAt * 1000).toISOString())}</td>
                                </tr>
                           </table>
                       </div>

                        <a class="btn btn-primary" href="/logout">
                            Logout
                        </a>
                     </div>
                </body>
            </html>
        `)
    }
})

/**
 * Route for login.
 * Generate a random state and store it in the session.
 * Redirect to authorization URL.
 */
server.get("/login", (req, res) => {
    // Generate a random state
    req.session.state = randomBytes(32).toString('hex')

    // Redirect to the authorization URL with the generated state and other parameters
    res.redirect(client.authorizationUrl({
        scope: 'openid',
        state: req.session.state,
        response_mode: 'form_post',
    }))
})

/**
 * Route for OAuth callback.
 * Handle OAuth callback.
 */
server.post("/callback", async (req, res) => {
    // Retrieve the state from the session
    const state = req.session.state;

    // Check if the state from the request matches the state stored in the session
    if (req.body.state !== state) {
        // If the states do not match, send an error response
        res.status(403).send('Error: state mismatch');
        return;
    }

    // If the states match, delete the state from the session
    delete req.session.state;

    // Exchange the authorization code for an access token
    const token = await client.callback(client.metadata.redirect_uris![0], client.callbackParams(req), {state: state}, {
        exchangeBody: {
            client_id: process.env.ATHENA_CLIENT_ID,
            client_secret: process.env.ATHENA_CLIENT_SECRET
        }
    });

    // Check if the access token exists
    if (!token.access_token) {
        // If the access token does not exist, send an error response
        res.status(403).send('Error: no access token');
        return;
    }

    // If the access token exists, retrieve the user's profile
    const profile = await client.userinfo(token.access_token)

    // Store the user's profile in the session
    req.session.user = {
        id: profile.sub,
        email: profile.email as string,
        name: profile.name as string,
        roninAddress: profile.roninAddress as string,
        accountCreatedAt: profile.created_at as number,
    }

    // Redirect to the home page
    return res.redirect("/")
})
/**
 * Route for logout.
 * Destroy session and redirect to home page.
 */
server.get("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy(function (err) {
        // If an error occurs while destroying the session, log the error and send an error response
        if (err) {
            console.error(err)
            return res.status(500).send("Error logging out")
        }
        // If the session is successfully destroyed, redirect to the home page
        res.redirect("/")
    })
})

// Start server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`)
})
