Object.defineProperty(document, "fonts", {
  configurable: true,
  value: {
    check: () => true,
    load: () => Promise.resolve([]),
    ready: Promise.resolve(),
  },
});
