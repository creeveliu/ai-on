"use client";

import { useState } from "react";

import { SubscribeForm } from "./subscribe-form";

export function SubscribePopover() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="threads-subscribe-trigger" type="button" onClick={() => setOpen(true)}>
        订阅
      </button>

      {open ? (
        <div className="threads-modal-overlay" onClick={() => setOpen(false)}>
          <section className="threads-modal" onClick={(event) => event.stopPropagation()}>
            <div className="threads-modal-head">
              <h3>邮件订阅</h3>
              <button type="button" className="threads-modal-close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <SubscribeForm />
          </section>
        </div>
      ) : null}
    </>
  );
}
