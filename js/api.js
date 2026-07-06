(function () {
  const originalFetch = window.fetch.bind(window);
  const apiBaseUrl = "https://sakurasao-coffebreakapi.hf.space";

  window.SABAR_API = {
    apiBaseUrl,
  };

  window.fetch = async function (resource, config = {}) {
    const finalConfig = { ...config };
    finalConfig.headers = finalConfig.headers || {};

    if (typeof resource === "string" && resource.includes("/admin/")) {
      finalConfig.headers.Authorization = "Bearer rahasia-kopi-sabar-123";

      if (
        !finalConfig.headers["Content-Type"] &&
        (finalConfig.method === "POST" || finalConfig.method === "PATCH")
      ) {
        finalConfig.headers["Content-Type"] = "application/json";
      }
    }

    return originalFetch(resource, finalConfig);
  };
})();
