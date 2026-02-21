import React from "react";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function PortalContainer({ title, description, children }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description ? (
          <p className="text-slate-500 text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
