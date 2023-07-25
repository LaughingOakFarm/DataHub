#!/bin/bash
# This script monitors a process and restarts it if it dies

# Set your process command here
PROCESS_CMD="node serial.js"

# Check if the process is running
PID=$(pgrep -f "$PROCESS_CMD")

if [ -z "$PID" ]; then
    # If the process is not running, start it
    echo "$(date) - Process not running, starting the process..."
    $PROCESS_CMD &
else
    # If the process is running, do nothing
    echo "$(date) - Process is running with PID: $PID"
fi


# * * * * * /home/pi/monitor_process.sh > /dev/null 2>&1
