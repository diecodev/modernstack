import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/utils/auth";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;
export const POST = handlers.POST;
