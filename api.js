let LINUX = require('linux-commands-async');
let EXECUTOR = LINUX.Command.LOCAL;

//------------------------------------
// SOURCE ERRORS

function SourceError(src) {
  if (src === undefined)
    return 'Path is undefined';
  else if (src == null)
    return 'Path is null';
  else if (src == '')
    return 'Path is empty';
  else if (src.trim() == '')
    return 'Path is whitespace';
  else
    return null;
}

//------------------------------------
// FUNCTIONS

/**
 * List all codec types.
 * @param {string} src Source
 * @returns {Promise<Array<string>>} Returns a promise. If it resolves, it returns an array of strings. Else, it returns an error.
 */
function CodecTypes(src) { // returns 'audio', 'video', or both
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get codec types: ${srcError}`);

  return new Promise((resolve, reject) => {
    let args = ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'default=nw=1', src]; // If fails, put double-quotes around src
    EXECUTOR.Execute('ffprobe', args).then(output => {
      if (output.stderr) {
        reject(`Failed to get codec types: ${output.stderr}`);
        return;
      }

      let types = [];

      let lines = output.stdout.split('\n');
      lines.forEach(line => {
        if (line.includes('audio'))
          types.push('audio');
        else if (line.includes('video'))
          types.push('video');
      });
      resolve(types);
    }).catch(error => `Failed to get codec types: ${error}`);
  });
}

/**
 * Check if source is a video file.
 * @param {string} src Source
 * @returns {Promise<boolean>} Returns a promise. If it resolves, it returns a boolean value. Else, it returns an error.
 */
function IsVideo(src) {
  return new Promise((resolve, reject) => {
    CodecTypes(src).then(types => {
      resolve(types.includes('video'));
    }).catch(error => `Failed to check if source is a video: ${error}`);
  });
}

/**
 * Check if source is an audio file.
 * @param {string} src Source
 * @returns {Promise<boolean>} Returns a promise. If it resolves, it returns a boolean value. Else, it returns an error.
 */
function IsAudio(src) {
  return new Promise((resolve, reject) => {
    CodecTypes(src).then(types => {
      resolve(types.includes('audio') && !types.includes('video'));
    }).catch(error => `Failed to check if source is an audio file: ${error}`);
  });
}

/**
 * Get duration of source (as string)
 * @param {string} src Source
 * @returns {Promise<string>} Returns a promise. If it resolves, it returns a string. Else, it returns an error.
 */
function DurationString(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get duration string: ${srcError}`);

  return new Promise((resolve, reject) => {
    let args = ['-i', src, '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', '-sexagesimal'];
    EXECUTOR.Execute('ffprobe', args).then(output => {
      if (output.stderr) {
        reject(`Failed to get duration string: ${output.stderr}`);
        return;
      }
      resolve(output.stdout.trim());
    }).catch(error => `Failed to get duration string: ${error}`);
  });
}

/**
 * Get duration of source as an object with properties (i.e. hours. minutes. seconds).
 * @param {string} src Source
 * @returns {Promise<{hours: number, minutes: number, seconds: number}>} Returns a promise. If it resolves, it returns an object. Else, it returns an error.
 */
function DurationTimeUnits(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get duration time units: ${srcError}`);

  return new Promise((resolve, reject) => {
    DurationString(src).then(string => {
      let strTrimmed = string.trim();
      if (strTrimmed && strTrimmed.split(':').length == 3) {
        let parts = strTrimmed.split(':');
        let hours = parseFloat(parts[0]);
        let minutes = parseFloat(parts[1]);
        let seconds = parseFloat(parts[2].substring(0, 5));
        resolve({
          hours: hours,
          minutes: minutes,
          seconds: seconds  // all floats
        });
        return;
      }
      reject(`Failed to get duration time units: Unexpected error parsing duration string`);
    }).catch(error => `Failed to get duration time units: ${error}`);
  });
}

/**
 * Get duration of source (in seconds)
 * @param {string} src Source
 * @returns {Promise<number>} Returns a promise. If it resolves, it returns a number. Else, it returns an error.
 */
function DurationInSeconds(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get duration time units: ${srcError}`);

  return new Promise((resolve, reject) => {
    DurationString(src).then(string => {
      let strTrimmed = string.trim();
      if (strTrimmed && strTrimmed.split(':').length == 3) {
        let parts = strTrimmed.split(':');
        let hours = parseFloat(parts[0]);
        let minutes = parseFloat(parts[1]);
        let seconds = parseFloat(parts[2].substring(0, 5));
        resolve((hours * 3600) + (minutes * 60) + seconds);  // float
        return;
      }
      reject(`Failed to get duration in seconds: Unexpected error happened while parsing duration string`);
    }).catch(error => `Failed to get duration in seconds: ${error}`);
  });
}

/**
 * Get source info (i.e. streams, formats, etc).
 * @param {string} src Source
 * @returns {Promise<{streams: Object, formats: Object}>} Returns a promise. If it resolves, it returns an object. Else, it returns an error.
 */
function Info(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get info: ${srcError}`);

  return new Promise((resolve, reject) => {
    let args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', src];
    EXECUTOR.Execute('ffprobe', args).then(output => {
      if (output.stderr) {
        reject(`Failed to get info: ${output.stderr}`);
        return;
      }
      resolve(JSON.parse(output.stdout.trim())); // returns { "streams": {...}, "formats": {...} }
    }).catch(error => `Failed to get info: ${error}`);
  });
}

/**
 * Execute FFPROBE command using the provided args in the order listed.
 * @param {Array<string|number>} args
 * @returns {Promise} Returns a promise that resolves if successful. Otherwise, it returns an error.
 */
function Manual(args) {
  return new Promise((resolve, reject) => {
    LOCAL_COMMAND.Execute('ffprobe', args).then(output => {
      if (output.stderr) {
        reject(`Failed to smooth out video: ${output.stderr}`);
        return;
      }
      resolve();
    }).catch(error => `Failed to smooth out video: ${error}`);
  });
}

//------------------------------------
// EXPORTS

exports.CodecTypes = CodecTypes;
exports.IsVideo = IsVideo;
exports.IsAudio = IsAudio;
exports.DurationString = DurationString;
exports.DurationTimeUnits = DurationTimeUnits;
exports.DurationInSeconds = DurationInSeconds;
exports.Info = Info;
exports.Manual = Manual;