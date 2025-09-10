declare module 'react-native-call-log' {
  interface CallLogEntry {
    phoneNumber: string;
    type: number;
    dateTime: string;
    duration: string;
    name?: string;
  }

  interface CallLogOptions {
    limit?: number;
    startDate?: number;
    endDate?: number;
  }

  const CallLogs: {
    load(limit?: number, startDate?: number, endDate?: number): Promise<CallLogEntry[]>;
  };

  export default CallLogs;
}
