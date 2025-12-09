export const analyzeDailyAttendance = (dailyLogs, timeRules) => {
    // dailyLogs: Array of logs for ONE user for ONE day, sorted by time ASC
    // timeRules: { workStartTime: "09:00", workEndTime: "17:00", gracePeriodMinutes: 5 }

    if (!dailyLogs || dailyLogs.length === 0) {
        return { status: 'Absent', color: 'red' };
    }

    const result = {
        status: 'Present',
        color: 'green',
        tags: [],
        warnings: []
    };

    // Sort just in case
    const sortedLogs = [...dailyLogs].sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];

    if (!timeRules) return result; // No rules, just return basic Present

    // 1. Check Lateness
    if (firstLog.type === 'in' && timeRules.workStartTime) {
        const checkInTime = new Date(firstLog.timestamp.seconds * 1000);
        const [ruleHour, ruleMinute] = timeRules.workStartTime.split(':').map(Number);

        const ruleDate = new Date(checkInTime);
        ruleDate.setHours(ruleHour, ruleMinute, 0, 0);

        // Add Grace Period
        ruleDate.setMinutes(ruleDate.getMinutes() + (timeRules.gracePeriodMinutes || 0));

        if (checkInTime > ruleDate) {
            result.status = 'Late';
            result.color = 'orange'; // Late is usually orange or yellow
            result.tags.push('Late In');
        }
    }

    // 2. Check Early Departure (Only if they have clocked out)
    if (lastLog.type === 'out' && timeRules.workEndTime) {
        const checkOutTime = new Date(lastLog.timestamp.seconds * 1000);
        const [ruleHour, ruleMinute] = timeRules.workEndTime.split(':').map(Number);

        const ruleDate = new Date(checkOutTime);
        ruleDate.setHours(ruleHour, ruleMinute, 0, 0);

        if (checkOutTime < ruleDate) {
            result.tags.push('Early Leave');
            if (result.status === 'Present') {
                result.status = 'Early Leave';
                result.color = 'orange';
            }
        }
    }

    // 3. Check Missing Punches
    // Simple logic: Must start with IN, end with OUT.
    const hasIn = sortedLogs.some(l => l.type === 'in');
    const hasOut = sortedLogs.some(l => l.type === 'out');

    if (hasIn && !hasOut) {
        // Only mark as missing out if the day has ended? 
        // For now, let's just flag it as "Currently In" if it's today, or "Missing Out" if it's past.
        const logDate = new Date(firstLog.timestamp.seconds * 1000).toDateString();
        const today = new Date().toDateString();

        if (logDate !== today) {
            result.warnings.push('Missing Check-out');
            result.status = 'Incomplete';
            result.color = 'red';
        } else {
            result.status = 'Working';
            result.color = 'blue';
        }
    } else if (!hasIn && hasOut) {
        result.warnings.push('Missing Check-in');
        result.status = 'Incomplete';
        result.color = 'red';
    }

    return result;
};
