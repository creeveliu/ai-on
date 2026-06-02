"use client";

import { FormEvent, useState } from "react";

export function SubscribeForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("作者买不起域名，此功能遥遥无期");
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
