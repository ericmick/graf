(function () {
    window.update = function (src) {
        var scripts = document.getElementsByTagName('script');
        for (var script, i = 0; i < scripts.length && (script = scripts[i] || 1); i++) {
            if (script.src.match(new RegExp(src,'i'))) {
                var time = new Date().getTime();
                var match = script.src.match(/[?&]time=\d+/);
                if (match) {
                    src = script.src.replace(match[0], match[0].replace(/\d+/, time));
                }
                else if (script.src.match(/\?/)) {
                    src += '&time=' + time;
                }
                else {
                    src += '?time=' + time;
                }
                var newScript = document.createElement('script');
                newScript.src = src;
                var parent = script.parentNode;
                parent.removeChild(script);
                parent.appendChild(newScript);
                return src;
            }
        }
    };
})();