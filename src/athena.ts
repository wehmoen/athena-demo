import {BaseClient, Issuer} from 'openid-client';

/**
 * Interface for the user object returned from the account service.
 * Note: This is not a complete representation and only includes the fields needed for this demo.
 * @interface
 * @property {string} id - The user's ID.
 * @property {string} email - The user's email.
 * @property {string} name - The user's name.
 * @property {string} roninAddress - The user's Ronin address.
 * @property {number} accountCreatedAt - The timestamp of when the user's account was created.
 */
export interface AthenaUser {
    id: string,
    email: string,
    name: string,
    roninAddress: string,
    accountCreatedAt: number,
}

/**
 * Asynchronously creates an OAuth client used to communicate with the account service.
 * @async
 * @function
 * @throws Will throw an error if the Athena OAuth environment variables are not set.
 * @returns {Promise<BaseClient>} A promise that resolves to an instance of BaseClient.
 */
async function createClient(): Promise<BaseClient> {
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
    createClient,
}
