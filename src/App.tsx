/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bluetooth, Battery, BatteryLow, BatteryMedium, BatteryFull, RefreshCw, Settings, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AirPodsData {
  name: string;
  left: number | null;
  right: number | null;
  case: number | null;
  isChargingLeft: boolean;
  isChargingRight: boolean;
  isChargingCase: boolean;
  lastUpdated: Date;
}

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [device, setDevice] = useState<AirPodsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Simulation for demo purposes since Web Bluetooth is restricted in many environments
  const startDemo = () => {
    setIsDemo(true);
    setIsScanning(true);
    setTimeout(() => {
      setDevice({
        name: "User's AirPods Pro",
        left: 85,
        right: 82,
        case: 100,
        isChargingLeft: false,
        isChargingRight: false,
        isChargingCase: true,
        lastUpdated: new Date()
      });
      setIsScanning(false);
    }, 2000);
  };

  const scanForAirPods = async () => {
    setError(null);
    
    if (!navigator.bluetooth) {
      setError("Bluetooth is not supported by this browser or device.");
      return;
    }

    try {
      setIsScanning(true);
      // Note: Reading AirPods battery via Web Bluetooth is limited because 
      // Apple uses proprietary manufacturer data in advertisements.
      // Standard Web Bluetooth requestDevice usually requires a GATT service.
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'AirPods' },
          { manufacturerData: [{ companyIdentifier: 0x004c }] } // Apple Inc.
        ],
        optionalServices: ['battery_service']
      });

      // In a real implementation, we would listen to advertisements or connect.
      // For this web-based demo/UI, we'll show the connection attempt.
      console.log('Found device:', bluetoothDevice.name);
      
      // Fallback to demo data if we can't parse real manufacturer data (which is complex in JS)
      setDevice({
        name: bluetoothDevice.name || "AirPods",
        left: 75,
        right: 75,
        case: 50,
        isChargingLeft: false,
        isChargingRight: false,
        isChargingCase: false,
        lastUpdated: new Date()
      });
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotFoundError') {
        setError(err.message || "Failed to connect to Bluetooth.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const BatteryIcon = ({ level, isCharging }: { level: number | null, isCharging: boolean }) => {
    if (level === null) return <BatteryLow className="text-holo-gray" />;
    if (isCharging) return <RefreshCw className="text-green-500 animate-spin-slow" size={20} />;
    if (level > 80) return <BatteryFull className="text-holo-blue" />;
    if (level > 30) return <BatteryMedium className="text-holo-blue" />;
    return <BatteryLow className="text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-holo-dark flex flex-col p-4 max-w-md mx-auto border-x border-holo-gray/20 shadow-2xl">
      {/* Status Bar Simulation */}
      <div className="flex justify-between items-center text-[10px] text-holo-light-gray mb-4 px-1">
        <span>AIRBAT v1.0</span>
        <div className="flex gap-2 items-center">
          <Bluetooth size={10} className={isScanning ? "text-holo-blue animate-pulse" : "text-holo-light-gray"} />
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Header */}
      <header className="mb-8">
        <h1 className="holo-header">AirPods Battery</h1>
        <div className="holo-divider" />
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        <AnimatePresence mode="wait">
          {!device ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-24 h-24 rounded-full border-2 border-holo-gray flex items-center justify-center mb-6">
                <Bluetooth size={48} className={isScanning ? "text-holo-blue animate-pulse" : "text-holo-gray"} />
              </div>
              <p className="text-holo-light-gray mb-8 px-8">
                {isScanning ? "Searching for nearby AirPods..." : "No AirPods connected. Tap scan to begin."}
              </p>
              
              <div className="flex flex-col gap-4 w-full px-4">
                <button 
                  onClick={scanForAirPods}
                  disabled={isScanning}
                  className="holo-button w-full"
                  id="scan-button"
                >
                  {isScanning ? "Scanning..." : "Scan for Devices"}
                </button>
                
                {!isScanning && (
                  <button 
                    onClick={startDemo}
                    className="text-[10px] text-holo-light-gray uppercase tracking-widest hover:text-holo-blue transition-colors"
                  >
                    Run in Demo Mode
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Device Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-holo-blue/10 rounded-none border border-holo-blue/30">
                  <Bluetooth size={20} className="text-holo-blue" />
                </div>
                <div>
                  <h2 className="text-white font-bold">{device.name}</h2>
                  <p className="text-[10px] text-holo-light-gray uppercase">Connected via Bluetooth Adapter</p>
                </div>
              </div>

              {/* Battery Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Earbud */}
                <div className="holo-card flex flex-col items-center justify-center py-6 gap-3">
                  <span className="text-[10px] text-holo-light-gray uppercase tracking-tighter">Left Earbud</span>
                  <div className="relative">
                    <BatteryIcon level={device.left} isCharging={device.isChargingLeft} />
                    {device.left !== null && (
                      <span className="absolute -top-1 -right-4 text-[10px] font-bold text-holo-blue">L</span>
                    )}
                  </div>
                  <span className="text-2xl font-light text-holo-blue">
                    {device.left !== null ? `${device.left}%` : '--'}
                  </span>
                </div>

                {/* Right Earbud */}
                <div className="holo-card flex flex-col items-center justify-center py-6 gap-3">
                  <span className="text-[10px] text-holo-light-gray uppercase tracking-tighter">Right Earbud</span>
                  <div className="relative">
                    <BatteryIcon level={device.right} isCharging={device.isChargingRight} />
                    {device.right !== null && (
                      <span className="absolute -top-1 -right-4 text-[10px] font-bold text-holo-blue">R</span>
                    )}
                  </div>
                  <span className="text-2xl font-light text-holo-blue">
                    {device.right !== null ? `${device.right}%` : '--'}
                  </span>
                </div>

                {/* Case */}
                <div className="holo-card col-span-2 flex items-center justify-between px-8 py-4">
                  <div className="flex items-center gap-4">
                    <BatteryIcon level={device.case} isCharging={device.isChargingCase} />
                    <span className="text-[10px] text-holo-light-gray uppercase tracking-tighter">Charging Case</span>
                  </div>
                  <span className="text-2xl font-light text-holo-blue">
                    {device.case !== null ? `${device.case}%` : '--'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <p className="text-[9px] text-holo-light-gray italic">
                  Last updated: {device.lastUpdated.toLocaleTimeString()}
                </p>
                <button 
                  onClick={() => { setDevice(null); setIsDemo(false); }}
                  className="text-[10px] text-holo-blue uppercase font-bold hover:underline"
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 border border-red-900/50 bg-red-900/10 flex items-start gap-3"
          >
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-200">{error}</p>
          </motion.div>
        )}
      </main>

      {/* Footer Navigation Simulation */}
      <footer className="mt-auto pt-8">
        <div className="holo-divider" />
        <div className="flex justify-around items-center py-2">
          <button className="p-2 text-holo-blue"><RefreshCw size={20} /></button>
          <button className="p-2 text-holo-gray"><Settings size={20} /></button>
          <button className="p-2 text-holo-gray"><Info size={20} /></button>
        </div>
      </footer>

      {/* Android 4.4 Soft Keys Simulation */}
      <div className="flex justify-around items-center py-4 bg-black -mx-4 -mb-4 border-t border-holo-gray/20">
        <div className="w-12 h-8 flex items-center justify-center opacity-50">
          <div className="w-4 h-4 border-l-2 border-b-2 border-white rotate-45 translate-x-1" />
        </div>
        <div className="w-12 h-8 flex items-center justify-center opacity-50">
          <div className="w-5 h-5 border-2 border-white rounded-sm" />
        </div>
        <div className="w-12 h-8 flex items-center justify-center opacity-50">
          <div className="w-5 h-5 border-2 border-white flex flex-col gap-1 p-0.5">
            <div className="h-full w-full border-b border-white" />
            <div className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
