const { overrideSchedule } = require('./common.js');
const schedule = require('../schedule.js').schedule;
const activeSchedule = { ...schedule };


describe('overrideSchedule', () => {
    it('should test the overrideSchedule', () => {
        // deviceID, valve, hour, day
        console.log("Active schedule: ", schedule);
        expect(activeSchedule.days[1].schedule['18:00']).toBe('3B');
        expect(overrideSchedule(activeSchedule, '1', 'A', '18', '1')).toBe(true);
        expect(activeSchedule.days[1].schedule['18:00']).toBe('1A');
    });
});