import fs from 'fs'; //const fs = require('fs');
import path from 'path'; // const path = require('path');
import url from 'url'; // const url = require('url');
import { permStr } from './permStr';
const sizeToString = require('./size-to-string');
const sortFiles = require('./sort-files');
const he = require('he');
const etag = require('../etag');
const sts = require('../sts-handlers');

// styles is window.styles
const supportedIcons = []; //const supportedIcons = styles.icons;
const css = {}; // const css = styles.css;

type s = string
type b = boolean
type path = string
const w1DirServ = (root: path, baseDir: path, pathname: path): path => path.normalize(
  path.join(
    root,
    path.relative(
      path.join('/', baseDir),
      pathname
    )
  )
);
let hidePermission: b;
interface w1htmlRowPm { parsed: url.UrlWithStringQuery, hidePermission: b, supportedIcons: [] }
const w1htmlRows = (pm: w1htmlRowPm) => (stats: fs.Stats[]) => w1sortStats(stats).map(w1htmlRow(pm)).join('\n')
const w1htmlRow = (pm: w1htmlRowPm) => (file: fs.Stats) => {
  // render a row given a [name, stat] tuple
  const isDir = file[1].isDirectory && file[1].isDirectory();
  let href = `${pm.parsed.pathname.replace(/\/$/, '')}/${encodeURIComponent(file[0])}`;

  // append trailing slash and query for dir entry
  if (isDir) {
    href += `/${he.encode((pm.parsed.search) ? pm.parsed.search : '')}`;
  }

  const displayName: s = he.encode(file[0]) + ((isDir) ? '/' : '');
  const ext = file[0].split('.').pop();
  const classForNonDir = supportedIcons[ext] ? ext : '_page';
  const iconClass = `icon-${isDir ? '_blank' : classForNonDir}`;


  // TODO: use stylessheets?
  let html = `${'<tr>' +
    '<td><i class="icon '}${iconClass}"></i></td>`;
  if (!pm.hidePermission) {
    html += `<td class="perms"><code>(${permStr(file[1])})</code></td>`;
  }
  return html;
}

const failed = false;
const w1sortStats = (a: fs.Stats[]) => [] as fs.Stats[]
const w1ReadDir = async () => 1
const w1Html = (reqHost:s, parsed: url.UrlWithStringQuery, pathname: s, supportedIcons: [], humanReadable: b, si, hidePermission: b) =>
  async (renderFiles: fs.Stats[], lolwuts: fs.Stats[], dirs: fs.Stats[]) => {
    let html = `${[
      '<!doctype html>',
      '<html>',
      '  <head>',
      '    <meta charset="utf-8">',
      '    <meta name="viewport" content="width=device-width">',
      `    <title>Index of ${he.encode(pathname)}</title>`,
      `    <style type="text/css">${css}</style>`,
      '  </head>',
      '  <body>',
      `<h1>Index of ${he.encode(pathname)}</h1>`,
    ].join('\n')}\n`;

    html += '<table>\n';
    const pm: w1htmlRowPm = { hidePermission, parsed, supportedIcons }
    const dirHtml = w1htmlRows(pm)(dirs);
    const fileHtml = w1htmlRows(pm)(renderFiles)
    const lolwutHtml = w1htmlRows(pm)(lolwuts)
    html += dirHtml + fileHtml + lolwutHtml
    const failed = false;

    html += '</table>\n';
    html += `<br><address>Node.js
      ${process.version}
      / <a href="https://github.com/jfhbrook/node-ecstatic">ecstatic</a> ` +
      `server running @
      ${he.encode(reqHost || '')}
      </address>\n` +
      '</body></html>'
    return html
  };

var mkAsynFun = (cbFun, aa) => [cbFun, aa]
const middleware = async opts => {
  // opts are parsed by opts.js, defaults already applied
  const cache = opts.cache;
  const root = path.resolve(opts.root);
  const baseDir = opts.baseDir;
  const humanReadable = opts.humanReadable;
  const hidePermissions = opts.hidePermissions;
  const handleError = opts.handleError;
  const showDotfiles = opts.showDotfiles;
  const si = opts.si;
  const weakEtags = opts.weakEtags;
  return middleware

  async function middleware(req, res, next) {
    // Figure out the path for the file from the given url
    const parsed = url.parse(req.url);
    const pathname = decodeURIComponent(parsed.pathname);
    const dirServ = w1DirServ(root, baseDir, pathname)

    fs.stat(dirServ, (statErr, stat) => {
      if (statErr) {
        sts[500](res, next, { error: statErr, handleError });
        return;
      }

      // files are the listing of dir
      fs.readdir(dirServ, (readErr, _files) => {
        let files = _files;

        if (readErr) {
          sts[500](res, next, { error: readErr, handleError });
          return;
        }

        // Optionally exclude dotfiles from directory listing.
        if (!showDotfiles) {
          files = files.filter(filename => filename.slice(0, 1) !== '.');
        }

        res.setHeader('content-type', 'text/html');
        res.setHeader('etag', etag(stat, weakEtags));
        res.setHeader('last-modified', (new Date(stat.mtime)).toUTCString());
        res.setHeader('cache-control', cache);

        async function render(dirs, renderFiles, lolwuts) {
          // each entry in the array is a [name, stat] tuple

          let html = `${[
            '<!doctype html>',
            '<html>',
            '  <head>',
            '    <meta charset="utf-8">',
            '    <meta name="viewport" content="width=device-width">',
            `    <title>Index of ${he.encode(pathname)}</title>`,
            `    <style type="text/css">${css}</style>`,
            '  </head>',
            '  <body>',
            `<h1>Index of ${he.encode(pathname)}</h1>`,
          ].join('\n')}\n`;

          html += '<table>';

          const failed = false;
          const writeRow = (file) => {
            // render a row given a [name, stat] tuple
            const isDir = file[1].isDirectory && file[1].isDirectory();
            let href = `${parsed.pathname.replace(/\/$/, '')}/${encodeURIComponent(file[0])}`;

            // append trailing slash and query for dir entry
            if (isDir) {
              href += `/${he.encode((parsed.search) ? parsed.search : '')}`;
            }

            const displayName = he.encode(file[0]) + ((isDir) ? '/' : '');
            const ext = file[0].split('.').pop();
            const classForNonDir = supportedIcons[ext] ? ext : '_page';
            const iconClass = `icon-${isDir ? '_blank' : classForNonDir}`;

            // TODO: use stylessheets?
            html += `${'<tr>' +
              '<td><i class="icon '}${iconClass}"></i></td>`;
            if (!hidePermissions) {
              html += `<td class="perms"><code>(${permStr(file[1])})</code></td>`;
            }
            html +=
              `<td class="file-size"><code>${sizeToString(file[1], humanReadable, si)}</code></td>` +
              `<td class="display-name"><a href="${href}">${displayName}</a></td>` +
              '</tr>\n';
          };

          dirs.sort((a, b) => a[0].toString().localeCompare(b[0].toString())).forEach(writeRow);
          renderFiles.sort((a, b) => a.toString().localeCompare(b.toString())).forEach(writeRow);
          lolwuts.sort((a, b) => a[0].toString().localeCompare(b[0].toString())).forEach(writeRow);

          html += '</table>\n';
          html += `<br><address>Node.js
            ${process.version}
            / <a href="https://github.com/jfhbrook/node-ecstatic">ecstatic</a> ` +
            `server running @
            ${he.encode(req.headers.host || '')}
            </address>\n` +
            '</body></html>'
            ;

          if (!failed) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          }
        }

        sortFiles(dirServ, files, (lolwuts, dirs, sortedFiles) => {
          // It's possible to get stat errors for all sorts of reasons here.
          // Unfortunately, our two choices are to either bail completely,
          // or just truck along as though everything's cool. In this case,
          // I decided to just tack them on as "??!?" items along with dirs
          // and files.
          //
          // Whatever.

          // if it makes sense to, add a .. link
          if (path.resolve(dirServ, '..').slice(0, root.length) === root) {
            fs.stat(path.join(dirServ, '..'), (err, s) => {
              if (err) {
                sts[500](res, next, { error: err, handleError });
                return;
              }
              dirs.unshift(['..', s]);
              render(dirs, sortedFiles, lolwuts);
            });
          } else {
            render(dirs, sortedFiles, lolwuts);
          }
        });
      });
    });
  };
};

module.exports = middleware
if (module.id == ".") require(__dirname + "/test/" + __filename).test