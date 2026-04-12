// frontend/src/contexts/AgitationContext.tsx
// Global context for tracking agitation events from the Recognize button
// This data feeds the heatmap in AnalyticsDashboard

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export interface AgitationDataPoint {
  day: string;
  hour: number;
  count: number;
  label: string;
}

interface AgitationContextType {
  heatmapData: AgitationDataPoint[];
  incrementAgitation: () => void;
  getCurrentCount: () => number;
  resetData: () => void;
}

// Generate rolling 7-day labels ending with today
function getRollingWeekDays(): string[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const todayIndex = now.getDay();
  
  // Create array of last 6 days + today
  const rollingDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (todayIndex - i + 7) % 7;
    rollingDays.push(days[dayIndex]);
  }
  return rollingDays;
}

// Generate initial data with mock entries for past 6 days, today empty
function generateHeatmapDataWithMockHistory(): AgitationDataPoint[] {
  const data: AgitationDataPoint[] = [];
  const rollingDays = getRollingWeekDays(); // [6days ago, ..., yesterday, today]

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      let count = 0;
      const isToday = d === 6; // Last day in rolling window is today

      // Past 6 days get mock data, today stays empty
      if (!isToday) {
        if (Math.random() < 0.3) {
          const rand = Math.random();
          if (rand < 0.4) count = 1;           // 40% light green
          else if (rand < 0.7) count = 2;      // 30% light green
          else if (rand < 0.85) count = 3;    // 15% dark green
          else if (rand < 0.95) count = 4;    // 10% dark green
          else count = 7;                    // 5% red blocks (>=6)
        }
      }

      data.push({
        day: rollingDays[d],
        hour: h,
        count,
        label: `${rollingDays[d]} ${h}:00`,
      });
    }
  }
  return data;
}

const AgitationContext = createContext<AgitationContextType | undefined>(undefined);

export const AgitationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [heatmapData, setHeatmapData] = useState<AgitationDataPoint[]>(generateHeatmapDataWithMockHistory());

  const incrementAgitation = useCallback(() => {
    const now = new Date();
    const rollingDays = getRollingWeekDays();
    const currentDay = rollingDays[6]; // Today is always last in rolling window
    const currentHour = now.getHours();

    setHeatmapData((prevData) =>
      prevData.map((point) => {
        if (point.day === currentDay && point.hour === currentHour) {
          return { ...point, count: point.count + 1 };
        }
        return point;
      })
    );
  }, []);

  const getCurrentCount = useCallback(() => {
    const now = new Date();
    const rollingDays = getRollingWeekDays();
    const currentDay = rollingDays[6]; // Today is always last in rolling window
    const currentHour = now.getHours();
    const point = heatmapData.find((p) => p.day === currentDay && p.hour === currentHour);
    return point?.count || 0;
  }, [heatmapData]);

  const resetData = useCallback(() => {
    setHeatmapData(generateHeatmapDataWithMockHistory());
  }, []);

  const value = useMemo(
    () => ({
      heatmapData,
      incrementAgitation,
      getCurrentCount,
      resetData,
    }),
    [heatmapData, incrementAgitation, getCurrentCount, resetData]
  );

  return <AgitationContext.Provider value={value}>{children}</AgitationContext.Provider>;
};

export const useAgitation = (): AgitationContextType => {
  const context = useContext(AgitationContext);
  if (!context) {
    throw new Error("useAgitation must be used within an AgitationProvider");
  }
  return context;
};
