let LINUX = require('linux-commands-async');
let EXECUTOR = LINUX.EXECUTOR.LOCAL;

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

function CodecTypes(src) { // returns 'audio', 'video', or both
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get codec types: ${srcError}`);

  return new Promise((resolve, reject) => {
    LINUX.Path.Exists(src, EXECUTOR).then(exists => {
      if (!exists) {
        reject(`Failed to get codec types: Path does not exist: ${src}`);
        return;
      }

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
    }).catch(error => `Failed to get codec types: ${error}`);
  });
}

function IsVideo(src) {
  return new Promise((resolve, reject) => {
    CodecTypes(src).then(types => {
      resolve(types.includes('video'));
    }).catch(fatalFail);
  });
}

function IsAudio(src) {
  return new Promise((resolve, reject) => {
    CodecTypes(src).then(types => {
      resolve(types.includes('audio') && !types.includes('video'));
    }).catch(fatalFail);
  });
}

function DurationString(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get duration string: ${srcError}`);

  return new Promise((resolve, reject) => {
    LINUX.Path.Exists(src, EXECUTOR).then(exists => {
      if (!exists) {
        reject(`Failed to get duration string: Path does not exist: ${src}`);
        return;
      }

      let args = ['-i', src, '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', '-sexagesimal'];
      EXECUTOR.Execute('ffprobe', args).then(output => {
        if (results.stderr) {
          reject(`Failed to get duration string: ${output.stderr}`);
          return;
        }
        resolve(results.stdout.trim());
      }).catch(error => `Failed to get duration string: ${error}`);
    }).catch(error => `Failed to get duration string: ${error}`);
  });
}

function DurationTimeUnits(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get duration time units: ${srcError}`);

  return new Promise((resolve, reject) => {
    LINUX.Path.Exists(src, EXECUTOR).then(exists => {
      if (!exists) {
        reject({ units: null, error: `Failed to get duration time units: Path does not exist: ${src}` });
        return;
      }

      DurationString(src).then(string => {
        let strTrimmed = string.trim();
        if (strTrimmed && strTrimmed.split(':').length == 3) {
          let parts = strTrimmed.split(':');
          let hours = parseFloat(parts[0]);
          let minutes = parseFloat(parts[1]);
          let seconds = parseFloat(parts[2].substring(0, 5));
          resolve({
            units: { hours: hours, minutes: minutes, seconds: seconds }  // float, float, float
          });
          return;
        }
        reject(`Failed to get duration time units: Unexpected error parsing duration string`);
      }).catch(error => `Failed to get duration time units: ${error}`);
    }).catch(error => `Failed to get duration time units: ${error}`);
  });
}

function DurationInSeconds(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get duration time units: ${srcError}`);

  return new Promise((resolve, reject) => {
    LINUX.Path.Exists(src, EXECUTOR).then(exists => {
      if (!exists) {
        reject(`Failed to get duration in seconds: Path does not exist: ${src}`);
        return;
      }

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
    }).catch(error => `Failed to get duration in seconds: ${error}`);
  });
}

function Info(src) {
  let srcError = SourceError(src);
  if (srcError)
    return Promise.reject(`Failed to get info: ${srcError}`);

  return new Promise((resolve, reject) => {
    LINUX.Path.Exists(src, EXECUTOR).then(exists => {
      if (!exists) {
        reject({ info: null, error: `Failed to get info: Path does not exist: ${src}` });
        return;
      }

      let args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', src];
      EXECUTOR.Execute('ffprobe', args).then(output => {
        if (output.stderr) {
          reject(`Failed to get info: ${output.stderr}`);
          return;
        }
        resolve(JSON.parse(results.stdout)); // returns { "streams": {...}, "formats": {...} }
      }).catch(error => `Failed to get info: ${error}`);
    }).catch(error => `Failed to get info: ${error}`);
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