import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
const appClientId = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ?? "";
const region = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-east-1";
const appSyncEndpoint = process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT;
const oauthDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const redirectSignIn = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN;
const redirectSignOut = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT;

Amplify.configure(
  {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: appClientId,
        loginWith: {
          email: true,
          ...(oauthDomain && redirectSignIn && redirectSignOut
            ? {
                oauth: {
                  domain: oauthDomain,
                  scopes: ["openid", "email", "profile"] as const,
                  redirectSignIn: [redirectSignIn],
                  redirectSignOut: [redirectSignOut],
                  responseType: "code" as const,
                },
              }
            : {}),
        },
        signUpVerificationMethod: "code",
        userAttributes: { email: { required: true } },
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: false,
        },
      },
    },
    ...(appSyncEndpoint && {
      API: {
        GraphQL: {
          endpoint: appSyncEndpoint,
          region,
          defaultAuthMode: "userPool" as const,
          apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
        },
      },
    }),
  },
  { ssr: false }
);
