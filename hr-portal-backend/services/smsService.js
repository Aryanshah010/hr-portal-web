import { env } from "../config/environment.js";

export const sendSms = async ({ to, body }) => {
  if (!env.isProduction && !env.twilioAccountSid) {
    console.info(`[DEV SMS] to=${to} body=${body}`);
    return;
  }
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFromNumber)
    throw new Error("SMS provider is not configured.");
  const auth = Buffer.from(
    `${env.twilioAccountSid}:${env.twilioAuthToken}`,
  ).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: env.twilioFromNumber,
        Body: body,
      }),
    },
  );
  if (!response.ok) throw new Error("SMS delivery failed.");
};
