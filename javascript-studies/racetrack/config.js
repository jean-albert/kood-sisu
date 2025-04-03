require('dotenv').config();

// Export environment variables as constants. This way the program can access them and there's no need to store them in other code files.
const UNIVERSAL_KEY = process.env.KEY_UNIVERSAL;
const FRONT_DESK_KEY = process.env.KEY_FRONT_DESK;
const RACE_CONTROL_KEY = process.env.KEY_RACE_CONTROL;
const LAP_TRACKER_KEY = process.env.KEY_LAP_LINE_TRACKER;
const RACE_DURATION = process.env.NORM_RACE_DURATION *60;
const DEV_DURATION = process.env.DEV_RACE_DURATION * 60;
const MAX_DRIVERS = process.env.MAX_DRIVERS_NUM;

module.exports = {
  UNIVERSAL_KEY,
  FRONT_DESK_KEY,
  RACE_CONTROL_KEY,
  LAP_TRACKER_KEY,
  RACE_DURATION,
  DEV_DURATION,
  MAX_DRIVERS,
};