var FILESYSTEM = require('filesystem-async');

//-----------------------------------
// ERROR CATCHING

function fatalFail(error) {
  console.log(error);
  process.exit(-1);
}

//------------------------------------
// FUNCTIONS

function codec_types(src) { // returns 'audio', 'video', or both
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ types: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ types: null, error: `Path does not exist: ${src}` });
        return;
      }

      let args = ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'default=nw=1', src.trim()]; // If fails, put double-quotes around src
      FILESYSTEM.Execute.local('ffprobe', args).then(results => {
        if (results.stderr) {
          reject({ types: null, error: results.stderr });
          return;
        }

        let types = [];

        let lines = results.stdout.split('\n');
        lines.forEach(line => {
          if (line.includes('audio'))
            types.push('audio');
          else if (line.includes('video'))
            types.push('video');
        });
        resolve({ types: types, error: null });
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

function is_video(src) {
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ isVideo: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ isVideo: null, error: `Path does not exist: ${src}` });
        return;
      }

      codec_types(src.trim()).then(results => {
        if (results.error) {
          reject({ isVideo: null, error: results.error });
          return;
        }
        resolve({ isVideo: results.types.includes('video'), error: results.error });
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

function is_audio(src) {
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ isAudio: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ isAudio: null, error: `Path does not exist: ${src}` });
        return;
      }

      codec_types(src.trim()).then(results => {
        if (results.error) {
          reject({ isAudio: null, error: results.error });
          return;
        }
        resolve({
          isAudio: results.types.includes('audio') && !results.types.includes('video'),
          error: results.error
        });
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

function duration_string(src) {
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ string: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ string: null, error: `Path does not exist: ${src}` });
        return;
      }

      let args = ['-i', src.trim(), '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', '-sexagesimal'];
      FILESYSTEM.Execute.local('ffprobe', args).then(results => {
        if (results.stderr) {
          reject({ string: null, error: results.stderr });
          return;
        }
        resolve({ string: results.stdout.trim(), error: null });
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

function duration_time_units(src) {
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ units: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ units: null, error: `Path does not exist: ${src}` });
        return;
      }

      duration_string(src.trim()).then(results => {
        if (results.error) {
          reject({ units: null, error: results.error });
          return;
        }

        if (results.string.trim() && results.string.split(':').length == 3) {
          let parts = results.string.trim().split(':');
          let hours = parseFloat(parts[0]);
          let minutes = parseFloat(parts[1]);
          let seconds = parseFloat(parts[2].substring(0, 5));
          resolve({
            units: { hours: hours, minutes: minutes, seconds: seconds },  // float, float, float
            error: null
          });
          return;
        }
        reject({ units: null, error: null }); // No string returned
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

function duration_in_seconds(src) {  // in seconds
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ seconds: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ seconds: null, error: `Path does not exist: ${src}` });
        return;
      }

      duration_string(src.trim()).then(results => {
        if (results.error) {
          reject({ seconds: null, error: results.error });
          return;
        }

        if (results.string.trim() && results.string.split(':').length == 3) {
          let parts = results.string.trim().split(':');
          let hours = parseFloat(parts[0]);
          let minutes = parseFloat(parts[1]);
          let seconds = parseFloat(parts[2].substring(0, 5));
          resolve({ seconds: (hours * 3600) + (minutes * 60) + seconds, error: null });  // float
          return;
        }
        reject({ seconds: null, error: null }); // No string returned
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

function info(src) {
  return new Promise((resolve, reject) => {
    FILESYSTEM.Path.exists(src).then(results => {
      if (results.error) {
        reject({ info: null, error: results.error });
        return;
      }

      if (!results.exists) {
        reject({ info: null, error: `Path does not exist: ${src}` });
        return;
      }

      let args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', src.trim()];
      FILESYSTEM.Execute.local('ffprobe', args).then(results => {
        if (results.stderr) {
          reject({ info: null, error: results.stderr });
          return;
        }
        resolve({ info: JSON.parse(results.stdout), error: null }); // returns { "streams": {...}, "formats": {...} }
      }).catch(fatalFail);
    }).catch(fatalFail);
  });
}

//------------------------------------
// EXPORTS

exports.codec_types = codec_types;
exports.is_video = is_video;
exports.is_audio = is_audio;
exports.duration_string = duration_string;
exports.duration_time_units = duration_time_units;
exports.duration_in_seconds = duration_in_seconds;
exports.info = info;