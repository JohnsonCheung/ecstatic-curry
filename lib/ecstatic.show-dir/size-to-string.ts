'use strict';

// given a file's stat, return the size of it in string
// humanReadable: (boolean) whether to result is human readable
// si: (boolean) whether to use si (1k = 1000), otherwise 1k = 1024
// adopted from http://stackoverflow.com/a/14919494/665507
import fs from 'fs';
type b = boolean
module.exports = function sizeToString(stat:fs.Stats, humanReadable:b, si:b) {
  if (stat.isDirectory && stat.isDirectory()) {
    return '';
  }

  let bytes = stat.size;
  const threshold = si ? 1000 : 1024;

  if (!humanReadable || bytes < threshold) {
    return `${bytes}B`;
  }

  const units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  let u = -1;
  do {
    bytes /= threshold;
    u += 1;
  } while (bytes >= threshold);
  let b = Number.parseFloat(bytes.toFixed(1));
  let c = isNaN(b) ? b.toString() : '??'
  return b + units[u];
};
