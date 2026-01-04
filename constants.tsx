
import React from 'react';
import { QrCode, CreditCard, BadgeInfo, Store, StickyNote } from 'lucide-react';

export const COLORS = {
  blue: '#009FE3',
  yellow: '#FFD200',
  lightGray: '#F1F5F9',
  darkBlue: '#007BB0'
};

export const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  'QR A5': <QrCode size={24} />,
  'PVC': <CreditCard size={24} />,
  'Badge': <BadgeInfo size={24} />,
  'Stand': <Store size={24} />,
  'Stickers': <StickyNote size={24} />
};
