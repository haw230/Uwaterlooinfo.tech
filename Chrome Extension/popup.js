function ajaxRequestSubject(subject, number) {
	$.ajax({
		type: "GET",
		url: `https://api.uwaterloo.ca/v2/courses/${subject}/${number}.json`,
		dataType: "json",
		data: {key: "043f31a8bada20f13b879fea1e64af16"},
		success: function(result) {
			clearCourseInfo();

			if (jQuery.isEmptyObject(result.data)) {
				console.log("Invalid course code");
				$("#error").html("Invalid course code");
			}
			else {
				updateCourseInfo(result.data);
				ajaxRequestSchedule(subject, number);
			}
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}

function ajaxRequestSchedule(subject, number) {
	$.ajax({
		type: "GET",
		url: `https://api.uwaterloo.ca/v2/courses/${subject}/${number}/schedule.json`,
		dataType: "json",
		data: {key: "043f31a8bada20f13b879fea1e64af16"},
		success: function(result) {

			if (jQuery.isEmptyObject(result.data)) {

			}
			else {
				//console.log(result.data);
				parseSchedule(result.data);
			}
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}

function parseSchedule(data) {
	let sections = data.length;
	let schedule = [];

	for (let i = 0; i < sections; i++) {

		let classes = data[i].classes.length;
		let time = [];
		for (let j = 0; j < classes; j++) {
			let dates = data[i].classes[j].date;
			let location = data[i].classes[j].location;
			time.push([dates.start_time, dates.end_time, dates.weekdays, location.building, location.room]);
		}

		let json =
		{"section": data[i].section, "instructor": data[i].classes[0].instructors, "date": time,
		"capacity": data[i].enrollment_capacity, "enrollment": data[i].enrollment_total};
		console.log(json);
	}
}

$(document).ready(function() {

	$("#searchButton").bind("click", function() {
		searchCourse();
	});

	$(document).on('keypress',function(e) {
		if (e.which == 13) {
			searchCourse();
		}
	});
})

function searchCourse() {
	if (typeof $("#searchBox").val() !== undefined) {
		let input = $("#searchBox").val().replace(/ /g, '');

		if (input.length > 0) {
			let index = firstNumberIndex(input);
			let course = [input.substring(0, index), input.substring(index)];
			ajaxRequestSubject(course[0], course[1]);
		}
		else {
			ajaxRequestSubject("default", "default");
		}
	}
}

function firstNumberIndex(string) {
	let length = string.length;
	for (let i = 0; i < length; i++) {
		if (string.charAt(i) > 0 && string.charAt(i) < 10) {
			return i;
		}
	}
}

function updateCourseInfo(json) {
	//alert(json.title);
	$("#title").html(`<span>Course:</span> ${json.subject} ${json.catalog_number}: ${json.title}`);
	$("#description").html(`<span>Description:</span> ${json.description}`);
	$("#antirequisites").html(`<span>Antirequisites:</span> ${json.antirequisites}`);
	$("#corequisites").html(`<span>Corequisites:</span> ${json.corequisites}`);
	$("#prerequisites").html(`<span>Prerequisites:</span> ${json.prerequisites}`);
	$("#links").html(
		`<span>Links:</span> <a href=${json.url} target="_blank">UWCalender</a>
		<a href=https://uwflow.com/course/${json.subject.toLowerCase()}${json.catalog_number} target="_blank">UWflow</a>`);
}

function clearCourseInfo() {
	$("#error").html("");
	$("#title").html("");
	$("#description").html("");
	$("#antirequisites").html("");
	$("#corequisites").html("");
	$("#prerequisites").html("");
	$("#links").html("");
}
