import { IZones } from "./Interfaces";

export const zones: IZones = {
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
    }
};