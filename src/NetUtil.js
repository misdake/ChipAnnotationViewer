define('NetUtil', [], function () {

    function get(url, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                callback(request.responseText);
            }
        };
        request.open("GET", url, true);
        request.send();
    }

    return {
        get: get,
    };

});