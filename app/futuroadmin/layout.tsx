import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Painel Administrativo',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function FuturoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
