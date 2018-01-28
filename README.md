# Description
A collection of asynchronous commands related to ffprobe.

# Install
```
npm install ffprobe-async
```

# Functions

## codec_types(src)
* src: ```string```
* returns: ```Promise```
	* types: ```array```
	* error: ```string```

NOTE: types will have strings 'video', or 'audio' or both.

## is_video(src)
* src: ```string```
* returns: ```Promise```
	* isVideo: ```boolean```
	* error: ```string```

## is_audio(src)
* src: ```string```
* returns: ```Promise```
	* isAudio: ```boolean```
	* error: ```string```

## duration_string(src)
* src: ```string```
* returns: ```Promise```
	* string: ```string (H:M:S)```
	* error: ```string```

## duration_time_units(src)
* src: ```string```
* returns: ```Promise```
	* units: ```object```
    * hours: ```float```
    * minutes: ```float```
    * seconds: ```float```
	* error: ```string```

## duration_in_seconds(src)
* src: ```string```
* returns: ```Promise```
	* seconds: ```float```
	* error: ```string```

## info(src)
* src: ```string```
* returns: ```Promise```
	* info: ```object```
    * stream: ```array```
    * format: ```object```
	* error: ```string```
  
NOTE: 'stream' can contain multiple objects that vary in the number of properties they contain, and 'format' is a single object with an overall description of 'src'. ( i.e. 'stream':[{p1,...,pX}, {q1,...qY}], 'format': {k1:v1, k2:v2} ).