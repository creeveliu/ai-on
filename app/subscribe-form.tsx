"use client";

import { FormEvent, useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "订阅失败");
        return;
      }

      setEmail("");
      setMessage("订阅成功，后续会按日报节奏推送。",
      );
    } catch {
      setMessage("订阅失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="ui-inline-form" style={{ gridTemplateColumns: "1fr auto", gap: 8 }}>
      <input
        className="ui-input"
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button className="ui-button" type="submit" disabled={loading}>
        {loading ? "提交中..." : "订阅"}
      </button>
      {message ? <span className="ui-muted">{message}</span> : null}
    </form>
  );
}
