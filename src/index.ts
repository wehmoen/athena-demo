import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import {randomBytes} from 'crypto';
import athena, {AthenaUser} from './athena.js';

dotenv.config();

declare module 'express-session' {
    interface SessionData {
        state: string;
        user?: AthenaUser
    }
}


const server = express();
server.use(express.urlencoded({extended: true}));
server.use(session({
    //In production this should be static and come from an environment variable
    secret: randomBytes(16).toString('hex'),
    resave: false,
    saveUninitialized: true,
}));

const client = await athena.crateClient();

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

server.get("/login", (req, res) => {
    // Generate a random state and store it in the session
    req.session.state = randomBytes(32).toString('hex')

    res.redirect(client.authorizationUrl({
        scope: 'openid',
        state: req.session.state,
        response_mode: 'form_post',
    }))
})

server.post("/callback", async (req, res) => {
    const state = req.session.state;

    if (req.body.state !== state) {
        res.status(403).send('Error: state mismatch');
        return;
    }

    delete req.session.state;


    const token = await client.callback(client.metadata.redirect_uris![0], client.callbackParams(req), {state: state}, {
        exchangeBody: {
            client_id: process.env.ATHENA_OAUTH_ID,
            client_secret: process.env.ATHENA_OAUTH_SECRET
        }
    });

    if (!token.access_token) {
        res.status(403).send('Error: no access token');
        return;
    }

    const profile = await client.userinfo(token.access_token)

    req.session.user = {
        id: profile.sub,
        email: profile.email as string,
        name: profile.name as string,
        roninAddress: profile.roninAddress as string,
        accountCreatedAt: profile.created_at as number,
    }

    return res.redirect("/")
})

server.get("/logout", (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.error(err)
            return res.status(500).send("Error logging out")
        }
        res.redirect("/")
    })
})

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`)
})
