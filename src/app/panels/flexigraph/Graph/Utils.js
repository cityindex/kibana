function formatLeadingZeroes(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function format2digits(val) {
    if (val < 10)
        return '0' + val;
    else
        return val;
}

function dateFormat(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    var h = date.getHours();
    var mn = date.getMinutes();
    var s = date.getSeconds();
    var f = date.getMilliseconds();
    return '' + y + '-' + format2digits(m) + '-' + format2digits(d) + ' ' +
        format2digits(h) + ':' + format2digits(mn) + ':' + format2digits(s) + '.' + formatLeadingZeroes(f, 3);
}

function binarySearch(items, compareNeedle) {
    if (items.length == 0)
        return 0;

    var start = 0, end = items.length - 1, mid;

    var startComparison = compareNeedle(items[start]);
    var endComparison = compareNeedle(items[end]);

    if (startComparison == 0)
        return start;
    if (endComparison == 0)
        return end;

    if (startComparison > 0)
        return ~0;
    if (endComparison < 0)
        return ~items.length;

    while (end - start > 1) {
        mid = Math.floor((start + end) / 2);
        var midComparison = compareNeedle(items[mid]);

        if (midComparison < 0)
            start = mid;
        else if (midComparison > 0)
            end = mid;
        else
            return mid;
    }

    return ~end;
};

function last(vals) {
    return vals[vals.length - 1];
}

function listAdd(vals, val) {
    return vals[vals.length] = val;
}

function addSeconds(date, timeSpanSeconds) {
    var mseconds = date.valueOf();
    var res = new Date(mseconds + timeSpanSeconds * 1000);
    return res;
}

function diffSeconds(date1, date2) {
    var res = (date1.valueOf() - date2.valueOf()) / 1000;
    return res;
}

function getEventLocation(event) {
    return {
        X: event.clientX,
        Y: event.clientY,
    };
}

// vals must be pre-sorted ascending
function CalculateQuantile(vals, q) {
    if (q < 0 || q > 100)
        throw "Invalid args";

    var splitter = CalculateQuantileIndex(vals, q);

    var rounded = Math.floor(splitter);
    if (splitter === rounded)
        return vals[rounded];

    var prevIndex = Math.floor(splitter);
    var nextIndex = Math.ceil(splitter);

    var prev = vals[prevIndex];
    var next = vals[nextIndex];
    if (prev > next)
        throw "Internal error: invalid input data";

    var res = prev + (next - prev) * (splitter - prevIndex); // use linear interpolation
    ValidateSplitterValue(vals, res, q);
    return res;
}

function CalculateQuantileIndex(vals, q) {
    var res = (vals.length - 1) * q;
    return res;
}

function ValidateSplitterValue(vals, splitterValue, splittingCoefficient) {
    var smallerCount = 0, biggerCount = 0;
    var prevVal = null;

    for (var i = 0; i < vals.length; i++) {
        var val = vals[i];
        if (prevVal != null) {
            if (prevVal > val)
                throw "Validation error";
        }
        prevVal = val;

        if (val < splitterValue)
            smallerCount++;
        if (val > splitterValue)
            biggerCount++;
    }

    if (smallerCount > Math.ceil(vals.length * splittingCoefficient))
        throw "Validation error";
    if (biggerCount > Math.ceil(vals.length * (1 - splittingCoefficient)))
        throw "Validation error";
}
