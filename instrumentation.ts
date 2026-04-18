export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/cronJobs");
    console.log("[Instrumentation] Cron jobs registered");
  }
}
