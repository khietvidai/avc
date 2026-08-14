# SMTP Email Delivery Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Gmail SMTP email transport plugin into `AVC` for sending admin login/magic link emails.

**Architecture:** Add internal workspace package `packages/emdash-plugin-smtp` containing standard EmDash plugin implementing `email:deliver` hook with TLS socket connections for both Node and Cloudflare Worker runtimes; replace `cloudflareEmail` in `astro.config.mjs`.

**Tech Stack:** Astro, EmDash CMS, TypeScript, Node `tls` / Cloudflare `sockets`.

## Global Constraints

- Use Gmail SMTP credentials: Host `smtp.gmail.com`, Port `465`, Username `khietvidai@gmail.com`, App password `xxhq ykiq phrc pjgj`.
- Do not break existing Astro/EmDash plugins or site features.
- All code must pass `pnpm run typecheck`.

---

### Task 1: Create `packages/emdash-plugin-smtp` Package

**Files:**
- Create: `packages/emdash-plugin-smtp/package.json`
- Create: `packages/emdash-plugin-smtp/tsconfig.json`
- Create: `packages/emdash-plugin-smtp/src/index.ts`
- Create: `packages/emdash-plugin-smtp/src/sandbox-entry.ts`

**Interfaces:**
- Produces: `export function smtpPlugin(): PluginDescriptor` exported from `emdash-plugin-smtp`

- [ ] **Step 1: Create `packages/emdash-plugin-smtp/package.json`**

```json
{
  "name": "emdash-plugin-smtp",
  "version": "1.0.0",
  "description": "Preconfigured Gmail SMTP email transport plugin for EmDash",
  "type": "module",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./sandbox": "./src/sandbox-entry.ts"
  },
  "peerDependencies": {
    "emdash": ">=0.11.0"
  }
}
```

- [ ] **Step 2: Create `packages/emdash-plugin-smtp/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": []
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `packages/emdash-plugin-smtp/src/index.ts`**

```typescript
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
```

- [ ] **Step 4: Create `packages/emdash-plugin-smtp/src/sandbox-entry.ts`**

```typescript
import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";

interface SmtpSocket {
	readResponse(): Promise<{ code: number; text: string }>;
	writeCommand(cmd: string): Promise<void>;
	close(): Promise<void>;
}

class NodeSmtpSocket implements SmtpSocket {
	socket: any;
	buffer: string = "";
	resolveRead?: (value: { code: number; text: string }) => void;
	rejectRead?: (reason: any) => void;

	constructor(socket: any) {
		this.socket = socket;
		socket.setEncoding("utf8");
		socket.on("data", (chunk: string) => {
			this.buffer += chunk;
			this.checkBuffer();
		});
		socket.on("error", (err: any) => {
			if (this.rejectRead) {
				this.rejectRead(err);
			}
		});
		socket.on("end", () => {
			if (this.rejectRead) {
				this.rejectRead(new Error("SMTP socket closed by server"));
			}
		});
	}

	checkBuffer() {
		if (!this.resolveRead) return;
		const lines = this.buffer.split("\r\n");
		if (lines.length > 1) {
			const lastLine = lines[lines.length - 2];
			const match = lastLine.match(/^(\d{3})( |-)/);
			if (match && match[2] === " ") {
				const responseText = lines.slice(0, lines.length - 1).join("\r\n");
				this.buffer = lines[lines.length - 1];
				const code = parseInt(match[1], 10);
				const resolve = this.resolveRead;
				this.resolveRead = undefined;
				this.rejectRead = undefined;
				resolve({ code, text: responseText });
			}
		}
	}

	async readResponse(): Promise<{ code: number; text: string }> {
		const lines = this.buffer.split("\r\n");
		if (lines.length > 1) {
			const lastLine = lines[lines.length - 2];
			const match = lastLine.match(/^(\d{3})( |-)/);
			if (match && match[2] === " ") {
				const responseText = lines.slice(0, lines.length - 1).join("\r\n");
				this.buffer = lines[lines.length - 1];
				const code = parseInt(match[1], 10);
				return { code, text: responseText };
			}
		}

		return new Promise((resolve, reject) => {
			this.resolveRead = resolve;
			this.rejectRead = reject;
		});
	}

	async writeCommand(cmd: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.socket.write(cmd + "\r\n", "utf8", (err: any) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	async close(): Promise<void> {
		this.socket.destroy();
	}
}

class CloudflareSmtpSocket implements SmtpSocket {
	reader: ReadableStreamDefaultReader<Uint8Array>;
	writer: WritableStreamDefaultWriter<Uint8Array>;
	buffer: string = "";
	decoder = new TextDecoder();
	encoder = new TextEncoder();
	socket: any;

	constructor(socket: any) {
		this.socket = socket;
		this.reader = socket.readable.getReader();
		this.writer = socket.writable.getWriter();
	}

	async readResponse(): Promise<{ code: number; text: string }> {
		while (true) {
			const lines = this.buffer.split("\r\n");
			if (lines.length > 1) {
				const lastLine = lines[lines.length - 2];
				const match = lastLine.match(/^(\d{3})( |-)/);
				if (match && match[2] === " ") {
					const code = parseInt(match[1], 10);
					const responseText = lines.slice(0, lines.length - 1).join("\r\n");
					this.buffer = lines[lines.length - 1];
					return { code, text: responseText };
				}
			}

			const { value, done } = await this.reader.read();
			if (done) {
				if (this.buffer.length > 0) {
					const lines = this.buffer.split("\r\n");
					const lastLine = lines[lines.length - 1] || lines[lines.length - 2] || "";
					const match = lastLine.match(/^(\d{3})/);
					const code = match ? parseInt(match[1], 10) : 0;
					return { code, text: this.buffer };
				}
				throw new Error("SMTP connection closed unexpectedly");
			}
			this.buffer += this.decoder.decode(value, { stream: true });
		}
	}

	async writeCommand(cmd: string): Promise<void> {
		await this.writer.write(this.encoder.encode(cmd + "\r\n"));
	}

	async close(): Promise<void> {
		try {
			this.reader.releaseLock();
		} catch {}
		try {
			this.writer.releaseLock();
		} catch {}
		try {
			this.socket.close();
		} catch {}
	}
}

async function connectSmtp(host: string, port: number): Promise<SmtpSocket> {
	const isNode = typeof process !== "undefined" && process.versions && process.versions.node;
	if (isNode) {
		const tlsModule = "node:tls";
		const tls = await import(tlsModule);
		return new Promise((resolve, reject) => {
			const socket = tls.connect({ host, port, rejectUnauthorized: true }, () => {
				resolve(new NodeSmtpSocket(socket));
			});
			socket.on("error", (err: any) => {
				reject(err);
			});
		});
	} else {
		const socketsModule = "cloudflare:sockets";
		const sockets = await import(socketsModule);
		const socket = sockets.connect({ hostname: host, port }, { secureTransport: "on" });
		return new CloudflareSmtpSocket(socket);
	}
}

export default definePlugin({
	id: "emdash-plugin-smtp",
	version: "1.0.0",
	capabilities: ["hooks.email-transport:register", "network:request"],
	allowedHosts: ["smtp.gmail.com"],
	hooks: {
		"email:deliver": {
			exclusive: true,
			handler: async ({ message }, ctx: PluginContext) => {
				const from = "khietvidai@gmail.com";
				const to = [message.to];

				const host = "smtp.gmail.com";
				const port = 465;
				const username = "khietvidai@gmail.com";
				// App password with spaces removed (standard Gmail authentication format)
				const password = "xxhq ykiq phrc pjgj".replace(/\s+/g, "");

				ctx.log.info(`Sending SMTP email to ${message.to} via Gmail`);

				const client = await connectSmtp(host, port);
				try {
					// 1. Read greeting (code 220)
					let res = await client.readResponse();
					if (res.code !== 220) {
						throw new Error(`SMTP Greeting failed: ${res.code} ${res.text}`);
					}

					// 2. Send EHLO
					await client.writeCommand("EHLO localhost");
					res = await client.readResponse();
					if (res.code !== 250) {
						throw new Error(`EHLO failed: ${res.code} ${res.text}`);
					}

					// 3. Send AUTH LOGIN
					await client.writeCommand("AUTH LOGIN");
					res = await client.readResponse();
					if (res.code !== 334) {
						throw new Error(`AUTH LOGIN command failed: ${res.code} ${res.text}`);
					}

					// 4. Send Base64 Username
					const b64User = btoa(username);
					await client.writeCommand(b64User);
					res = await client.readResponse();
					if (res.code !== 334) {
						throw new Error(`AUTH Username failed: ${res.code} ${res.text}`);
					}

					// 5. Send Base64 Password
					const b64Pass = btoa(password);
					await client.writeCommand(b64Pass);
					res = await client.readResponse();
					if (res.code !== 235) {
						throw new Error(`AUTH Password failed: ${res.code} ${res.text}`);
					}

					// 6. Send MAIL FROM
					await client.writeCommand(`MAIL FROM:<${from}>`);
					res = await client.readResponse();
					if (res.code !== 250) {
						throw new Error(`MAIL FROM failed: ${res.code} ${res.text}`);
					}

					// 7. Send RCPT TO for each recipient
					for (const recipient of to) {
						await client.writeCommand(`RCPT TO:<${recipient}>`);
						res = await client.readResponse();
						if (res.code !== 250 && res.code !== 251) {
							throw new Error(`RCPT TO <${recipient}> failed: ${res.code} ${res.text}`);
						}
					}

					// 8. Send DATA
					await client.writeCommand("DATA");
					res = await client.readResponse();
					if (res.code !== 354) {
						throw new Error(`DATA command failed: ${res.code} ${res.text}`);
					}

					// 9. Send email payload (headers and body)
					let emailContent = "";
					emailContent += `From: <${from}>\r\n`;
					emailContent += `To: ${to.join(", ")}\r\n`;
					if (message.subject) {
						emailContent += `Subject: ${message.subject}\r\n`;
					}

					const isHtml = !!message.html;
					const bodyText = message.html || message.text || "";
					emailContent += `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8\r\n`;
					emailContent += `MIME-Version: 1.0\r\n`;
					emailContent += `\r\n`;

					// Escape lone dots at the start of a line (RFC 5321 dot-stuffing)
					const stuffedBody = bodyText.replace(/^\./gm, "..");
					emailContent += stuffedBody;
					if (!emailContent.endsWith("\r\n")) {
						emailContent += "\r\n";
					}
					emailContent += ".\r\n";

					await client.writeCommand(emailContent);
					res = await client.readResponse();
					if (res.code !== 250) {
						throw new Error(`Sending email payload failed: ${res.code} ${res.text}`);
					}

					// 10. Send QUIT
					await client.writeCommand("QUIT");
					await client.readResponse();
				} finally {
					await client.close();
				}
			},
		},
	},
});
```

- [ ] **Step 5: Commit**

```bash
git add packages/emdash-plugin-smtp
git commit -m "feat: add emdash-plugin-smtp package"
```

---

### Task 2: Configure Workspace Dependencies and Install

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `packages/emdash-plugin-smtp`
- Produces: `emdash-plugin-smtp` dependency in `node_modules`

- [ ] **Step 1: Update `package.json`**

Add `"emdash-plugin-smtp": "file:./packages/emdash-plugin-smtp"` to `"dependencies"`.

- [ ] **Step 2: Run `pnpm install`**

Run: `pnpm install`
Expected: Dependencies resolved and `emdash-plugin-smtp` linked.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add emdash-plugin-smtp dependency"
```

---

### Task 3: Update `astro.config.mjs`

**Files:**
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: `smtpPlugin` from `emdash-plugin-smtp`
- Produces: Updated EmDash configuration registering `smtpPlugin()`

- [ ] **Step 1: Update `astro.config.mjs`**

Remove:
```typescript
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
```
and
```typescript
cloudflareEmail({
    from: { email: "cms@avc.equipment", name: "AVC CMS" },
}),
```

Add:
```typescript
import { smtpPlugin } from "emdash-plugin-smtp";
```
and
```typescript
plugins: [
    formsPlugin(),
    localeSync,
    smtpPlugin(),
],
```

- [ ] **Step 2: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: configure smtpPlugin in astro.config.mjs"
```

---

### Task 4: Verification and Type Checking

**Files:**
- None (verification)

- [ ] **Step 1: Run type checking**

Run: `pnpm run typecheck`
Expected: 0 errors.

- [ ] **Step 2: Build verification**

Run: `pnpm run build`
Expected: Astro build succeeds.
