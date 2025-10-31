/**
 * Super Admin Bridge - Simple Version
 * Direct rendering without delays
 */

import React from 'react';
import { SuperAdminApp } from '../SuperAdminApp';

export function SuperAdminBridge() {
  console.log('🚀 SuperAdminBridge mounting...');

  return <SuperAdminApp />;
}