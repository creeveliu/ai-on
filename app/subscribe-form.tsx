"use client";

import { FormEvent, useState } from "react";

export function SubscribeForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("暂不支持，敬请期待");
  }

  return (
    <form onSubmit={onSubmit} className="ui-inline-form" style={{ gridTemplateColumns: "1fr auto", gap: 8 }}>
      <input
        className="ui-input"
        type="email"
        placeholder="you@example.com"
      />
      <button className="ui-button" type="submit">
        订阅
      </button>
      {message ? <span className="ui-muted">{message}</span> : null}
    </form>
  );
}
