/** One viewport for the isolated X root, player, fit guard and recording. */
export function reviewViewport(value = "1920x1080") {
  if (typeof value !== "string" || !/^[1-9]\d{2,3}x[1-9]\d{2,3}$/.test(value))
    throw Error("Review viewport must be WIDTHxHEIGHT in whole pixels.");
  const [width, height] = value.split("x").map(Number);
  if (width < 320 || height < 320 || width > 2560 || height > 2560
      || width * height > 1920 * 1080)
    throw Error("Review viewport must be 320–2560 pixels per side and at most 1920×1080 pixels in area.");
  return { width, height };
}

export function viewportArgument(args) {
  const values = args.filter(arg => arg === "--viewport" || arg.startsWith("--viewport="));
  if (values.length > 1) throw Error("Specify --viewport only once.");
  if (values[0] === "--viewport") throw Error("Use --viewport=WIDTHxHEIGHT.");
  return reviewViewport(values[0]?.slice("--viewport=".length));
}

export function recordedViewport(ownership) {
  // Old evidence predates explicit dimensions and used this fixed size.
  if (ownership.viewport === undefined) return reviewViewport();
  const { width, height } = ownership.viewport ?? {};
  if (!Number.isInteger(width) || !Number.isInteger(height))
    throw Error("Invalid recorded review viewport.");
  return reviewViewport(`${width}x${height}`);
}
