"use client";

import "@/lib/amplify";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signIn as amplifySignIn,
  signInWithRedirect,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { fetchMe } from "@/lib/api";

export type AuthUser = {
  userId: string;
  username: string;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  redirectError: string | null;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  confirmSignUp: (username: string, confirmationCode: string) => Promise<void>;
  resendCode: (username: string) => Promise<void>;
  resetPassword: (username: string) => Promise<void>;
  confirmResetPassword: (
    username: string,
    confirmationCode: string,
    newPassword: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export class EmailNotConfirmedError extends Error {
  constructor() {
    super("Please confirm your email before signing in.");
    this.name = "EmailNotConfirmedError";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
      });
      setRedirectError(null);
      void fetchMe().catch(() => {});
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const completingRedirect = params.has("code") && params.has("state");

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signInWithRedirect") {
        setRedirectError(null);
        void checkAuth();
      } else if (payload.event === "signInWithRedirect_failure") {
        setUser(null);
        setRedirectError(
          payload.data?.error?.message ??
            "Google sign-in failed. Please try again."
        );
        setLoading(false);
      }
    });

    if (!completingRedirect) {
      void checkAuth();
    }

    return unsubscribe;
  }, [checkAuth]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const result = await amplifySignIn({ username, password });
      if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        throw new EmailNotConfirmedError();
      }
      if (result.nextStep?.signInStep === "RESET_PASSWORD") {
        throw new Error("Password reset required. Use forgot password.");
      }
      if (!result.isSignedIn) {
        throw new Error("Sign in could not be completed. Please try again.");
      }
      await checkAuth();
    },
    [checkAuth]
  );

  const signInWithGoogle = useCallback(async () => {
    setRedirectError(null);
    await signInWithRedirect({ provider: "Google" });
  }, []);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setUser(null);
  }, []);

  const signUp = useCallback(
    async (username: string, password: string) => {
      await amplifySignUp({
        username,
        password,
        options: {
          userAttributes: { email: username },
        },
      });
    },
    []
  );

  const resendCode = useCallback(async (username: string) => {
    await resendSignUpCode({ username });
  }, []);

  const confirmSignUp = useCallback(
    async (username: string, confirmationCode: string) => {
      await amplifyConfirmSignUp({
        username,
        confirmationCode,
      });
    },
    []
  );

  const resetPasswordFn = useCallback(async (username: string) => {
    await resetPassword({ username });
  }, []);

  const confirmResetPasswordFn = useCallback(
    async (username: string, confirmationCode: string, newPassword: string) => {
      await confirmResetPassword({
        username,
        confirmationCode,
        newPassword,
      });
    },
    []
  );

  const value: AuthState = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    redirectError,
    signOut,
    signUp,
    confirmSignUp,
    resendCode,
    resetPassword: resetPasswordFn,
    confirmResetPassword: confirmResetPasswordFn,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
