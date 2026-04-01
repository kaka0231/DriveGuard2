export interface DriverBehavior {
  carPlate: string;
  overspeedCount: number;
  fatigueDrivingCount: number;
  totalOverspeedTime: number; // in seconds
  neutralSlideTime: number; // in seconds
  rapidlySpeedupCount: number;
  rapidlySlowdownCount: number;
  hThrottleStopCount: number;
  oilLeakDetected: boolean;
}

export interface SpeedData {
  timestamp: string;
  speed: number;
}

export interface Driver {
  id: string;
  name: string;
  carPlate: string;
  behaviorSummary: DriverBehavior;
  currentSpeed: number;
  speedHistory: SpeedData[];
}

export const MOCK_DRIVERS: Driver[] = [
  {
    id: "1",
    name: "John Doe",
    carPlate: "ABC-1234",
    behaviorSummary: {
      carPlate: "ABC-1234",
      overspeedCount: 12,
      fatigueDrivingCount: 2,
      totalOverspeedTime: 2700, // 45 mins in seconds
      neutralSlideTime: 600, // 10 mins in seconds
      rapidlySpeedupCount: 8,
      rapidlySlowdownCount: 5,
      hThrottleStopCount: 3,
      oilLeakDetected: false,
    },
    currentSpeed: 65,
    speedHistory: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 30000).toLocaleTimeString(),
      speed: 60 + Math.random() * 20,
    })),
  },
  {
    id: "2",
    name: "Jane Smith",
    carPlate: "XYZ-5678",
    behaviorSummary: {
      carPlate: "XYZ-5678",
      overspeedCount: 5,
      fatigueDrivingCount: 0,
      totalOverspeedTime: 900,
      neutralSlideTime: 300,
      rapidlySpeedupCount: 2,
      rapidlySlowdownCount: 1,
      hThrottleStopCount: 0,
      oilLeakDetected: false,
    },
    currentSpeed: 55,
    speedHistory: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 30000).toLocaleTimeString(),
      speed: 50 + Math.random() * 15,
    })),
  },
  {
    id: "3",
    name: "Robert Brown",
    carPlate: "GHI-9012",
    behaviorSummary: {
      carPlate: "GHI-9012",
      overspeedCount: 25,
      fatigueDrivingCount: 4,
      totalOverspeedTime: 7200,
      neutralSlideTime: 1800,
      rapidlySpeedupCount: 15,
      rapidlySlowdownCount: 12,
      hThrottleStopCount: 8,
      oilLeakDetected: true,
    },
    currentSpeed: 85,
    speedHistory: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 30000).toLocaleTimeString(),
      speed: 70 + Math.random() * 30,
    })),
  },
  {
    id: "4",
    name: "Emily Davis",
    carPlate: "JKL-3456",
    behaviorSummary: {
      carPlate: "JKL-3456",
      overspeedCount: 2,
      fatigueDrivingCount: 0,
      totalOverspeedTime: 300,
      neutralSlideTime: 120,
      rapidlySpeedupCount: 1,
      rapidlySlowdownCount: 0,
      hThrottleStopCount: 0,
      oilLeakDetected: false,
    },
    currentSpeed: 45,
    speedHistory: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 30000).toLocaleTimeString(),
      speed: 40 + Math.random() * 10,
    })),
  },
  {
    id: "5",
    name: "Michael Wilson",
    carPlate: "MNO-7890",
    behaviorSummary: {
      carPlate: "MNO-7890",
      overspeedCount: 18,
      fatigueDrivingCount: 1,
      totalOverspeedTime: 3600,
      neutralSlideTime: 900,
      rapidlySpeedupCount: 10,
      rapidlySlowdownCount: 7,
      hThrottleStopCount: 4,
      oilLeakDetected: false,
    },
    currentSpeed: 72,
    speedHistory: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 30000).toLocaleTimeString(),
      speed: 65 + Math.random() * 20,
    })),
  },
];
