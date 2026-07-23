import dns from "dns/promises";
import ipRangeCheck from "ip-range-check";
import AppError from "./appError.js";
import { env } from "../config/environment.js";

const PRIVATE_IP_BLOCKS = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "::1/128",
  "fc00::/7",
  "fe80::/10",
];

export const isPrivateAddress = (address) =>
  ipRangeCheck(address, PRIVATE_IP_BLOCKS);

export const validateExternalUrl = async (targetUrl) => {
  let parsed;
  try {
    parsed = new URL(String(targetUrl));
  } catch {
    throw new AppError("Enter a valid absolute URL.", 400);
  }

  if (parsed.protocol !== "https:")
    throw new AppError("Only HTTPS URLs are accepted.", 400);

  if (parsed.port && !["", "443"].includes(parsed.port))
    throw new AppError("Only the default HTTPS port is permitted.", 400);

  const hostname = parsed.hostname.toLowerCase();

  const allowlist = env.avatarHostAllowlist;
  if (allowlist.size > 0) {
    const permitted = [...allowlist].some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
    );
    if (!permitted)
      throw new AppError(
        "That host is not on the permitted image-host allowlist.",
        403,
      );
  }

  if (isPrivateAddress(hostname))
    throw new AppError("That destination is not permitted.", 403);

  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new AppError("That hostname could not be resolved.", 400);
  }

  const addresses = records.map((record) => record.address);
  const blocked = addresses.filter(isPrivateAddress);
  if (blocked.length > 0)
    throw new AppError("That destination is not permitted.", 403);

  return { url: parsed.toString(), hostname, addresses };
};
