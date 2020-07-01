import fs from 'fs';
'use strict';

export function permStr(stat:fs.Stats) {
  const isDir = stat.isDirectory();
  if (!isDir || !stat.mode) {
    return '???!!!???';
  }

  const dir = isDir ? 'd' : '-';
  const mode = stat.mode.toString(8);

  return dir + mode.slice(-3).split('').map(n => [
    '---',
    '--x',
    '-w-',
    '-wx',
    'r--',
    'r-x',
    'rw-',
    'rwx',
  ][parseInt(n, 10)]).join('');
};

