import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { handle } from "../lib/pollcore.mjs";

export default async (req: Request) => {
  const store = getStore({ name: "polls", consistency: "strong" });
  return handle(req, store, (key: string) => Netlify.env.get(key));
};

export const config: Config = { path: "/api/poll" };
