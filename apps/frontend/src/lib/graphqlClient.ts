"use client";

import "@/lib/amplify";

import { generateClient } from "aws-amplify/api";

const client = generateClient();

export function getGraphQLClient() {
  return client;
}
