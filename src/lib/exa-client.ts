import Exa from "exa-js";

let instance: Exa | null = null;

export function getExaClient(): Exa | null {
  if (!process.env.EXA_API_KEY) return null;
  if (!instance) {
    instance = new Exa(process.env.EXA_API_KEY);
  }
  return instance;
}
