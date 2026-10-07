import { handle, json } from "./_lib.js";
export const onRequestPost = ({ request, env }) => handle(request, env, "wantlist");
export const onRequest = () => json({ error: "POST only." }, 405);
