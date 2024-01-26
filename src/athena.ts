import {BaseClient, Issuer} from 'openid-client';

//This is the user object returned from the account service. It is not complete and only has the fields needed for this demo
export interface AthenaUser {
    id: string,
    email: string,
    name: string,
    roninAddress: string
    accountCreatedAt: number,
}

//This creates the oauth client used to communicate with the account service
async function crateClient(): Promise<BaseClient> {
    const skyMavisIssuer = await Issuer.discover('https://athena.skymavis.com/.well-known/openid-configuration');

    if (!process.env.ATHENA_CLIENT_ID || !process.env.ATHENA_CLIENT_SECRET) {
        throw new Error("Missing required environment variables for Athena OAuth");
    }

    return new skyMavisIssuer.Client({
        client_id: process.env.ATHENA_CLIENT_ID,
        client_secret: process.env.ATHENA_CLIENT_SECRET,
        redirect_uris: ["http://localhost:3000/callback"],
        post_logout_redirect_uris: ["http://localhost:3000/"],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
    })
}

export default {
    crateClient,
}
