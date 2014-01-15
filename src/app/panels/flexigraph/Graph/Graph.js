function FlexiGraph() {
    var _ticks = [];
    var _isDataLoaded = false;
    var _canvas;
    var _mainDiv;
    var _startTimeControl;
    var _endTimeControl;
    var _startTime = {};
    var _endTime = {};
    var _priceBoundsInitDone = false;
    var _minPrice = NaN;
    var _maxPrice = NaN;
    var _priceScale = NaN;
    var _timeScale = NaN;
    var _defaultPeriodSeconds = 60 * 60;
    var _isDragging = false;
    var _draggingPrevPoint = {};
    var _scaleChangeFactor = 1.1;
    var _timeBoundsInitDone = false;

    var _styleBright = '#00ff00';
    var _styleMedium = '#00aa00';
    var _styleDark = '#005500';

    this.init = function(idPrefix)
    {
         _mainDiv = document.getElementById(idPrefix + 'MainDiv');
         _startTimeControl = document.getElementById(idPrefix + 'StartTime');
         _endTimeControl = document.getElementById(idPrefix + 'EndTime');
        _canvas = document.getElementById(idPrefix + "Canvas");

        window.addEventListener('resize', onResize, false);

        _canvas.addEventListener("mousedown", onMouseDown, true);
        window.addEventListener("mouseup", onMouseUp, false);
        window.addEventListener('mousemove', onMouseMove, false);

        // Firefox
        _canvas.addEventListener('DOMMouseScroll', onWheel, false);
        // IE9, Chrome, Safari, Opera
        _canvas.addEventListener("mousewheel", onWheel, false);

        onResize();
    }

    this.update = function(data)
    {
        _ticks = [];

        _.each(data, function(item) {
            var val = item._source.Value;
            if (!val)
                return;
            var timeStr = item._source['@timestamp'];

            var itemData = {
                Time: convertDateTime(timeStr),
                Price: val,
            };

            _ticks[_ticks.length] = itemData;
        });

        _isDataLoaded = true;
        onResize();
    }

    function convertDateTime(dateTime) {
        var tmp = dateTime.split("T");
        var date = tmp[0].split("-");
        var timeStr = tmp[1];
        timeStr = timeStr.substring(0, timeStr.length - 1);
        var time = timeStr.split(":");

        var secondsFractional = parseFloat(time[2]);
        var seconds = Math.floor(secondsFractional);
        var milliSeconds = 1000 * (secondsFractional - seconds);
        var res = new Date(Date.UTC(date[0], date[1] - 1, date[2], time[0], time[1], seconds, milliSeconds));
        return res;
    }

    function log(text) {
    }

    function startProfiling() {
        return new Date().getTime();
    }

    function endProfiling(start) {
        var end = new Date().getTime();
        var time = end.valueOf() - start.valueOf();
        log('mseconds: ' + time);
    }

    function onResize() {
        // TODO
        //_mainDiv.width = _mainDiv.parentNode.width;
        //_mainDiv.height = _mainDiv.parentNode.height;
        _canvas.width = _mainDiv.clientWidth;
        paint();
    }

    function onMouseDown(event) {
        _isDragging = true;
        _draggingPrevPoint = getEventLocation(event);
        document.body.style.cursor = 'pointer';
    }

    function onMouseUp(event) {
        _isDragging = false;
        document.body.style.cursor = 'default';
    }

    function onMouseMove(pos) {
        if (!_isDataLoaded)
            return;

        ensureInitTimeBounds();

        if (_isDragging) {
            var offset = _draggingPrevPoint.X - pos.clientX;
            var timeChange = getTimeOffset(offset);
            _startTime = addSeconds(_startTime, timeChange);
            _endTime = addSeconds(_endTime, timeChange);

            _draggingPrevPoint = getEventLocation(pos);

            _priceBoundsInitDone = false;

            updateParamsView();
            paint();
        }
    }

    function onWheel(e) {
        var delta = e.wheelDelta;
        if (!delta)
            delta = -e.detail; // Firefox
        var factor = (delta > 0) ? _scaleChangeFactor : (1 / _scaleChangeFactor);

        var point = getEventLocation(e);
        var curTime = getTime(point.X);

        var startSeconds = diffSeconds(_startTime, curTime);
        var endSeconds = diffSeconds(_endTime, curTime);

        _startTime = addSeconds(curTime, startSeconds / factor);
        _endTime = addSeconds(curTime, endSeconds / factor);

        scaleTime(factor);

        _priceBoundsInitDone = false;

        updateParamsView();
        paint();
    }

    function scaleTime(scaleFactor) {
        _timeScale *= scaleFactor;
    }

    function findItemIndex(time) {
        var comparer = function (val) {
            if (val.Time < time)
                return -1;
            if (val.Time > time)
                return 1;
            return 0;
        };
        var res = binarySearch(_ticks, comparer);
        if (res < 0)
            res = ~res;
        return res;
    }

    function updatePriceBounds(start) {
        var min = Number.MAX_VALUE;
        var max = Number.MIN_VALUE;

        for (var i = start; i < _ticks.length; i++) {
            var item = _ticks[i];
            if (item.Time >= _endTime)
                break;

            min = Math.min(min, item.Price);
            max = Math.max(max, item.Price);
        }

        _minPrice = min;
        _maxPrice = max;

        _priceScale = (_canvas.height - 1) / (_maxPrice - _minPrice);

        _priceBoundsInitDone = true;

        updateParamsView();
    }

    function getOffsetY(price) {
        var y = _canvas.height - Math.floor((price - _minPrice) * _priceScale);
        return y;
    }

    function updateTimeScale() {
        _timeScale = (_canvas.width - 1) / diffSeconds(_endTime, _startTime);
    }

    function initTimeBounds() {
        if (!_isDataLoaded)
            return;

        _endTime = last(_ticks).Time;
        _startTime = addSeconds(_endTime, -_defaultPeriodSeconds);

        updateTimeScale();

        _timeBoundsInitDone = true;
    }

    function ensureInitTimeBounds() {
        if (_timeBoundsInitDone)
            return;
        initTimeBounds();
    }

    function getOffsetX(time) {
        var seconds = diffSeconds(time, _startTime);
        var x = Math.floor(seconds * _timeScale);
        return x;
    }

    function getTimeOffset(x) {
        var seconds = x / _timeScale;
        return seconds;
    }

    function getTime(x) {
        var res = addSeconds(_startTime, getTimeOffset(x));
        return res;
    }

    function updateParamsView() {
        _startTimeControl.innerHTML = _startTime.toUTCString();
        _endTimeControl.innerHTML = _endTime.toUTCString();
    }

    function drawLine(context, x1, y1, x2, y2, style) {
        context.beginPath();
        context.moveTo(x1 + 0.5, y1);
        context.lineTo(x2 + 0.5, y2);

        context.strokeStyle = style;
        context.lineWidth = 1;
        context.stroke();
    }

    function drawStripeMark(context, x, yList) {
        yList.sort(function (a, b) { return a - b; });

        var min = yList[0];
        var lowerQuartile = CalculateQuantile(yList, 0.25);
        var median = CalculateQuantile(yList, 0.5);
        var upperQuartile = CalculateQuantile(yList, 0.75);
        var max = last(yList);

        drawLine(context, x, min, x, lowerQuartile, _styleDark);
        drawLine(context, x, lowerQuartile + 1, x, median, _styleMedium);
        drawLine(context, x, median, x, median + 1, _styleBright);
        drawLine(context, x, median + 1, x, upperQuartile, _styleMedium);
        drawLine(context, x, upperQuartile + 1, x, max, _styleDark);
    }

    function paint() {
        if (!_isDataLoaded)
            return;

        var start = startProfiling();

        ensureInitTimeBounds();

        var context = _canvas.getContext('2d');
        context.clearRect(0, 0, _canvas.width, _canvas.height);

        var startItem = findItemIndex(_startTime);

        if (startItem >= _ticks.length)
            return;

        if (!_priceBoundsInitDone)
            updatePriceBounds(startItem);

        var yList = [];
        var xPrev = -1;

        for (var i = startItem; i < _ticks.length; i++) {
            var item = _ticks[i];
            if (item.Time > _endTime)
                break;

            var x = getOffsetX(item.Time);
            var y = getOffsetY(item.Price);

            if (xPrev == -1) {
                xPrev = x;
                listAdd(yList, y);
                continue;
            }

            if (x == xPrev) {
                listAdd(yList, y);
            }
            else {
                if (yList.length < 10) {
                    for (var yi = 0; yi < yList.length; yi++) {
                        var yCur = yList[yi];
                        drawLine(context, xPrev, yCur, xPrev, yCur + 1, _styleBright);
                    }
                }
                else {
                    drawStripeMark(context, xPrev, yList);
                }

                yList = [];
                listAdd(yList, y);
                xPrev = x;
            }
        }

        endProfiling(start);
    }
}