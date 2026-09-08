export enum TimeExtensionRequestStatus {
  PENDING,
  ACCEPTED,
  REJECTED,
}

export interface TimeExtensionRequestItem {
  id: number;
  addedMinutes: number;
  requestedEndTime: string;
  status: TimeExtensionRequestStatus;
  createdAt: string;
  requestedById: number;
  requestedByName: string;
  decidedById: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  session: {
    id: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    topic: string | null;
    cancelledBy: number | null;
    groupId: number;
    groupName: string;
    tutorName: string;
    studentNames: string[];
  };
}