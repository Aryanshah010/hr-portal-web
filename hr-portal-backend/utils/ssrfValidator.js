import dns from "dns";
import { ip2long } from "net";
import ipRangeCheck from "ip-range-check";
import AppError from "./appError.js";

const PRIVATE_IP_BLOCKS = [
  "127.0.0.0/8",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.169.254/32",
  "0.0.0.0/8",
  "::1/128",
  "fe80::/10",
];

export const validateExternalUrl = (targetUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(targetUrl);

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return reject(
          new AppError("Invalid application layer protocol request.", 400),
        );
      }

      const hostname = parsedUrl.hostname;

      dns.lookup(hostname, { all: false }, (err, address) => {
        if (err || !address) {
          return reject(
            new AppError(
              "Target hostname lookup failed verification parameters.",
              400,
            ),
          );
        }

        const isBlacklisted = ipRangeCheck(address, PRIVATE_IP_BLOCKS);

        if (isBlacklisted) {
          console.warn(
            `[SECURITY ALERT] Blocked malicious SSRF trace vector pointing to: ${address}`,
          );
          return reject(
            new AppError(
              "Destination route conflicts with platform network safety restrictions.",
              403,
            ),
          );
        }

        resolve(targetUrl);
      });
    } catch (error) {
      reject(
        new AppError(
          "Malformed or unparseable input string payload supplied.",
          400,
        ),
      );
    }
  });
};
