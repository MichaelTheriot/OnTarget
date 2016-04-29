window.onload = function () {
  var ta = new TargetArea(150, 6, 3);
  ta._svg.setAttribute('id', 'target');
  var aside = document.createElement('aside');
  aside.appendChild(ta._svg);
  var body = document.querySelector('body');
  body.insertBefore(aside, body.firstChild);
  var record = document.querySelector('#data tbody');
  function pad(n, value) {
    for(var s = String(value); s.length < n; s = '0' + s);
    return s;
  }
  var impactGroup = ta._svg.querySelector('g[data-group="impacts"]');
  var selected = null;
  var selectedRow = null;
  function selectImpact(event) {
    event.preventDefault();
    if(selected) {
      selected.removeAttribute('class');
      selectedRow.removeAttribute('class');
    }
    var id = event.target.hasAttribute('data-id')
             ? event.target.getAttribute('data-id')
             : event.target.parentNode.getAttribute('data-id');
    var newSelected = impactGroup.querySelector('[data-id="' + id + '"]');
    if(newSelected !== selected) {
      selected = newSelected;
      selected.setAttribute('class', 'selected');
      selectedRow = record.querySelector('[data-id="' + id + '"]');
      selectedRow.setAttribute('class', 'selected');
      impactGroup.setAttribute('class', 'selected');
      if(event.target.nodeName === 'circle') {
        selectedRow.scrollIntoView();
      }
    } else {
      selected = null;
      selectedRow = null;
      impactGroup.removeAttribute('class');
    }
  }
  var impacts = [];
  function addImpact(x, y, time) {
    impacts.push([x, y, time]);
    var row = document.createElement('tr');
    var nC = document.createElement('td');
    var xC = document.createElement('td');
    var yC = document.createElement('td');
    var tC = document.createElement('td');
    var date = new Date(time);
    row.setAttribute('data-id', impacts.length);
    nC.textContent = impacts.length;
    xC.textContent = x.toFixed(2);
    xC.setAttribute('data-x', x);
    yC.textContent = y.toFixed(2);
    yC.setAttribute('data-y', y);
    tC.textContent = pad(2, date.getHours()) + ':' + pad(2, date.getMinutes()) + ':' + pad(2, date.getSeconds());
    row.appendChild(nC);
    row.appendChild(xC);
    row.appendChild(yC);
    row.appendChild(tC);
    record.appendChild(row);
    var e = ta.addImpact(x, y, time);
    e.addEventListener('click', selectImpact);
    row.addEventListener('click', selectImpact);
  }
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  var ws = new WebSocket('ws://localhost:5001');
  var buffer = '';
  ws.onmessage = function (event) {
    console.log(event.data);
    buffer += event.data;
    parseBuffer();
  }
  function parseBuffer() {
    if(buffer.indexOf('\n') > -1) {
      let chunks = buffer.split('\n');
      let cap = chunks.length - !chunks[chunks.length - 1].endsWith('\n');
      let i;
      for(i = 0; i < cap; i++) {
        addImpact(...chunks[i].split(',').map(Number));
      }
      buffer = chunks[i] || '';
    }
  }

  /*function go() {
    var r = getRandomInt(0, 70);
    var ang = getRandomInt(0, 360);
    var x = Math.cos(Math.PI * ang / 180) * r;
    var y = Math.sin(Math.PI * ang / 180) * r;
    addImpact(x, y, Date.now());
  }
  for(var i = 0; i < 100; i++) {
    setTimeout(go, 1000 + i * 20);
  }*/
  var dlLink = document.createElement('a');
  var exportBtn = document.createElement('button');
  exportBtn.setAttribute('class', 'button');
  exportBtn.textContent = 'Export to CSV';
  exportBtn.addEventListener('click', function () {
    var d = new Date();
    var stamp = d.getFullYear() + pad(2, d.getMonth() + 1) + pad(2, d.getDate());
    dlLink.href = encodeURI('data:text/csv;charset=utf-8,' + impacts.join('\n') + '\n');
    dlLink.download = 'impacts-' + stamp + '.csv';
    dlLink.click();
  });
  document.querySelector('main').appendChild(exportBtn);
  var isFormatted = (() => {
    var coord = '-?\\d+(\\.\\d+)?(e-?\\d+)?';
    var milli = '\\d+(\\.\\d+)?';
    var row = coord + ',' + coord + ',' + milli;
    var regexp = new RegExp('^\\s*' + row + '(\\s+' + row + ')*\\s*$');
    return RegExp.prototype.test.bind(regexp);
  })();
  var uploadBtn = document.createElement('label');
  uploadBtn.setAttribute('class', 'button');
  uploadBtn.textContent = 'Upload CSV';
  var inputFile = document.createElement('input');
  inputFile.setAttribute('type', 'file');
  inputFile.setAttribute('accept', '.csv');
  inputFile.addEventListener('change', (event) => {
    var files = event.target.files;
    var reader = new FileReader();
    reader.onload = (event) => {
      if(!isFormatted(event.target.result)) {
        alert('File not formatted correctly');
      } else {
        impacts = [];
        while(record.firstChild) {
          record.removeChild(record.firstChild);
        }
        ta.clear();
        event.target.result
          .split(/[\n\r]+/)
          .filter(row => row.trim() !== '')
          .forEach(row => addImpact(...row.split(',').map(Number)));
      }
    };
    reader.readAsText(files[0]);
  });
  uploadBtn.appendChild(inputFile);
  document.querySelector('main').appendChild(uploadBtn);
};
