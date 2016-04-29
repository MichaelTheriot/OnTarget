var proto = Object.create(SVGSVGElement.prototype);

proto.createdCallBack = function () {
  console.log(this);
};

proto.attributeChangedCallback = function (name, oldVal, newVal) {
  console.log(arguments);
};

var TargetArea = document.registerElement('target-area', {
  prototype: proto,
  extends: 'svg'
});
