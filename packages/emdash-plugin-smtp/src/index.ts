import type { PluginDescriptor } from "emdash";

export function smtpPlugin(): PluginDescriptor {
	return {
		id: "emdash-plugin-smtp",
		version: "1.0.0",
		format: "standard",
		entrypoint: "emdash-plugin-smtp/sandbox",
		options: {},
		capabilities: ["hooks.email-transport:register", "network:request"],
		allowedHosts: ["smtp.gmail.com"],
	};
}
