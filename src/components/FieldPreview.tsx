import React from 'react';

export function FieldPreview({ item }) {
  if (!item) return null;
  const Icon = item.icon;
  return (
    <div className="p-4 flex items-center gap-4 bg-card border rounded-lg shadow-lg">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-sm font-medium">{item.label}</p>
    </div>
  );
}
