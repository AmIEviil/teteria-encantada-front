// crypto.randomUUID only exists in secure contexts (HTTPS or localhost).
// On plain HTTP over an IP (e.g. EC2 at http://52.55.22.213) it is undefined.
// Provide an RFC4122 v4 fallback so the app works in insecure contexts.
if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function") {
  const getRandom = (): number => {
    if (typeof crypto.getRandomValues === "function") {
      return crypto.getRandomValues(new Uint8Array(1))[0];
    }
    return Math.floor(Math.random() * 256);
  };

  crypto.randomUUID =
    function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (getRandom() & (15 >> (Number(c) / 4)))).toString(16),
      ) as `${string}-${string}-${string}-${string}-${string}`;
    };
}
