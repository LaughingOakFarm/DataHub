export type ZoneID = "0A" | "1A" | "1B" | "2A" | "2B" | "3A" | "3B" | "4A" | "5A" | "5B" | "5C";

export type IZones = Record<ZoneID, IZone>;

export interface IZone {
    name: string;
    type: string;
    deviceID: number;
    valve: string;
}

export const zones: IZones = {
    "0A": {
        name: "Don't Run",
        type: "",
        deviceID: 0,
        valve: "A",
    },

    "1A": {
        name: "Girls Zone (5)",
        type: "pasture",
        deviceID: 1,
        valve: "A",
    },
    "1B": {
        name: "Pond Zone (3)",
        type: "pasture",
        deviceID: 1,
        valve: "B",
    },

    "2A": {
        name: "Oak Zone (4)",
        type: "pasture",
        deviceID: 2,
        valve: "A",
    },
    "2B": {
        name: "Boys Zone (3)",
        type: "pasture",
        deviceID: 2,
        valve: "B",
    },

    "3A": {
        name: "Pond Fill (1)",
        type: "pond",
        deviceID: 3,
        valve: "A",
    },
    "3B": {
        name: "Pond Path (2)",
        type: "lawn",
        deviceID: 3,
        valve: "B",
    },

    "4A": {
        name: "Lawn (5)",
        type: "lawn",
        deviceID: 4,
        valve: "A",
    },

    "5A": {
        name: "Oak Zone (4) [v2]",
        type: "pasture",
        deviceID: 5,
        valve: "A",
    },
    "5B": {
        name: "Boys Zone (3) [v2]",
        type: "pasture",
        deviceID: 5,
        valve: "B",
    },
    "5C": {
        name: "Bottom Zone (4) [v2]",
        type: "lawn",
        deviceID: 5,
        valve: "C",
    },
};