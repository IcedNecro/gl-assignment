var handlers = {};

function parseStartDate(month) {
	return d3.time.format('%Y-%m-%dT00:00:00')(new Date(2016, month, 1));
}

function parseEndDate(month) {
	var day = (new Date(2015, month, 0)).getDate();

	return d3.time.format('%Y-%m-%dT23:59:59')(new Date(2016, month, day));
}

handlers.dateFrom = function(event) {
	var monthFrom = event.target.value;
	var anotherInput = document.getElementById('date-to');
	var monthTo = anotherInput.value;

	if(monthTo<monthFrom) {
		monthTo = monthFrom;
		anotherInput.value = monthTo;
	}

	var dateTo = parseEndDate(monthTo);
	var dateFrom = parseStartDate(monthFrom);

	var query = 'start_date='+dateFrom+'&end_date='+dateTo;

	graphApi.getData(query, function(err,data) {
		console.log(JSON.parse(data.response));
	});
}


handlers.dateTo = function(event) {
	var monthTo = event.target.value;
	var anotherInput = document.getElementById('date-from');
	var monthFrom = anotherInput.value;

	if(monthTo<monthFrom) {
		monthFrom = monthTo;
		anotherInput.value = monthTo;
	}

	var dateTo = parseEndDate(monthTo);
	var dateFrom = parseStartDate(monthFrom);

	var query = 'start_date='+dateFrom+'&end_date='+dateTo;

	graphApi.getData(query, function(err,data) {
		console.log(JSON.parse(data.response));
	});
}