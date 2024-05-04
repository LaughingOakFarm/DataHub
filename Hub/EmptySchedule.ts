
export type ISchedule = IDay[];

export type DayID = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export type TimeID = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23";

export interface IDay {
    name: string;
    schedule: Record<TimeID, IScheduleHour>;
}

export interface IScheduleHour {
    default: string[]; // example: "1A", "2B", "1B"
    overrides: string[]; // example: "1A", "2B", "1B"
}

const timeObject: Record<TimeID, IScheduleHour> = {
    "0": { default: [], overrides: [] },
    "1": { default: [], overrides: [] },
    "2": { default: [], overrides: [] },
    "3": { default: [], overrides: [] },
    "4": { default: [], overrides: [] },
    "5": { default: [], overrides: [] },
    "6": { default: [], overrides: [] },
    "7": { default: [], overrides: [] },
    "8": { default: [], overrides: [] },
    "9": { default: [], overrides: [] },
    "10": { default: [], overrides: [] },
    "11": { default: [], overrides: [] },
    "12": { default: [], overrides: [] },
    "13": { default: [], overrides: [] },
    "14": { default: [], overrides: [] },
    "15": { default: [], overrides: [] },
    "16": { default: [], overrides: [] },
    "17": { default: [], overrides: [] },
    "18": { default: [], overrides: [] },
    "19": { default: [], overrides: [] },
    "20": { default: [], overrides: [] },
    "21": { default: [], overrides: [] },
    "22": { default: [], overrides: [] },
    "23": { default: [], overrides: [] }
};

export const emptySchedule: ISchedule = [
    {
        name: "Monday",
        schedule: { ...timeObject }
    },
    {
        name: "Tuesday",
        schedule: { ...timeObject }
    },
    {
        name: "Wednesday",
        schedule: { ...timeObject }
    },
    {
        name: "Thursday",
        schedule: { ...timeObject }
    },
    {
        name: "Friday",
        schedule: { ...timeObject }
    },
    {
        name: "Saturday",
        schedule: { ...timeObject }
    },
    {
        name: "Sunday",
        schedule: { ...timeObject }
    }
];