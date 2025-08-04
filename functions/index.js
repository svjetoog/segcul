const functions = require("firebase-functions");
const https = require("https");
const cors = require("cors")({ origin: true });

exports.generateSummary = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method !== "POST") {
      return response.status(405).send("Method Not Allowed");
    }

    const prompt = request.body.prompt;
    if (!prompt) {
      return response.status(400).send("Bad Request: prompt is missing.");
    }

    // Aquí la magia: la clave se lee desde la configuración segura.
    const geminiApiKey = functions.config().gemini.key;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-0514:generateContent?key=${geminiApiKey}`;

    const payload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    const apiRequest = https.request(apiUrl, options, (apiResponse) => {
      let data = "";
      apiResponse.on("data", (chunk) => { data += chunk; });
      apiResponse.on("end", () => {
        response.status(200).send(JSON.parse(data));
      });
    });

    apiRequest.on("error", (error) => {
      console.error("Error calling Gemini API:", error);
      response.status(500).send("Internal Server Error");
    });

    apiRequest.write(payload);
    apiRequest.end();
  });
});