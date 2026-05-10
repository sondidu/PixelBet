import type { ReactNode } from "react";

export default function Card({ children }: { children: ReactNode }) {
  return (
    <section className="px-2 py-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg [box-shadow:7px_7px_rgba(100,100,100,0.25)] px-6 py-4">
        {children}
      </div>
    </section>
  )
}

