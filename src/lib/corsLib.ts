export interface corsHeaders {
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Credentials": string;
}

export function addCORSHeaders(origin: string | undefined, method: string): corsHeaders | {} {
    const allowedOrigins = ['http://localhost:5173'];

    if (origin && allowedOrigins.includes(origin)) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": `OPTIONS,${method}`,
            "Access-Control-Allow-Credentials": "true",
        }
    }
    return {};
}