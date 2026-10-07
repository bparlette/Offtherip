import { handle, json } from "./_lib.js";
export const onRequestPost = ({ request, env }) => handle(request, env, "subscribe");
export const onRequest = () => json({ error: "POST only." }, 405);
