function ajaxRequestSubject(subject, number, terms) {
	$.ajax({
		type: "GET",
		url: `https://api.uwaterloo.ca/v2/courses/${subject}/${number}.json`,
		dataType: "json",
		data: {key: "043f31a8bada20f13b879fea1e64af16"},
		success: function(result) {
			clearCourseInfo();;

			if (jQuery.isEmptyObject(result.data)) {
				console.log("Invalid course code");
				$("#error").html("Invalid course code");
			}
			else {
				let restCall1 = `https://api.uwaterloo.ca/v2/terms/${terms[0][0]}/${subject}/${number}/schedule.json`;
				let restCall2 = `https://api.uwaterloo.ca/v2/terms/${terms[1][0]}/${subject}/${number}/schedule.json`;

				$.when(
					ajaxCall(restCall1, parseSchedule),
				).then(function() {
					return ajaxCall(restCall2, parseSchedule);
				}).done(function() {
					$("#scheduleTable div").each(function(index) {
						$(this).prepend(`<p>${terms[index][1]}</p>`);
					});
				});
				updateCourseInfo(result.data);
			}
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}


function ajaxCall(url, onSuccess) {
	return $.ajax({
		type: "GET",
		url: url,
		dataType: "json",
		data: {key: "043f31a8bada20f13b879fea1e64af16"},
		success: function(result) {
			onSuccess(result.data);
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}


function currentTerm(data) {
	let terms = concatJsonObjectContent(data.listings)
	let current = data.current_term;
	let next = data.next_term;
	searchCourse([[current, termName(terms, current)], [next, termName(terms, next)]]);
}


function concatJsonObjectContent(obj) {
	let list = [];
	Object.keys(obj).forEach(function(key) {
		list = list.concat(obj[key]);
	});
	return list;
}


function termName(array, term) {
	let name = "";
	array.forEach(function(obj) {
		if (obj.id == term) {
			name = obj.name;
		}
	});
	return name;
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
			time.push([dates.start_time, dates.end_time, dates.weekdays, `${location.building} ${location.room}`]);
		}

		let instructors = [];

		for (let j = 0; j < classes; j++) {
			let name = data[i].classes[j].instructors[0];

			if (name === undefined) {
				instructors.push("N/A");
			}
			else {
				let lastFirst = name.split(",");
				instructors.push(`${lastFirst[1]} ${lastFirst[0]}`);
			}

		}

		let json =
		{"section": data[i].section, "class": data[i].class_number, "campus": data[i].campus,
		"enrollment": `${data[i].enrollment_total}/${data[i].enrollment_capacity}`, "date": time, 
		"instructors": instructors};
		schedule.push(json);
	}
	renderSchedule(schedule);
}


function renderSchedule(schedule) {
	let columns = schedule.length;

	let table = `<div><table>`;
	table += 
	`<tr>
		<th>Section</th>
		<th>Class</th>
		<th>Campus</th>
		<th>Enrolled</th>
		<th>Time</th>
		<th>Days</th>
		<th>Location</th>
		<th>Instructor(s)</th>
	</tr>`;

	for (let i = 0; i < columns; i++) {
		table +=
		`<tr>
		<td>${nullCheck(schedule[i].section)}</td>
		<td>${nullCheck(schedule[i].class)}</td>
		<td>${nullCheck(schedule[i].campus)}</td>
		<td>${nullCheck(schedule[i].enrollment)}</td>
		<td>${nullCheck(schedule[i].date[0][0])} - ${nullCheck(schedule[i].date[0][1])}`

		let classes = schedule[i].date.length;
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][0])} - ${nullCheck(schedule[i].date[j][1])}`;
		}
		table += `</td>`;

		table += `<td>${nullCheck(schedule[i].date[0][2])}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][2])}`;
		}
		table += `</td>`;

		table += `<td>${nullCheck(schedule[i].date[0][3])}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][3])}`;
		}
		table += `</td>`;

		table += `<td>${nullCheck(schedule[i].instructors[0])}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].instructors[j])}`;
		}
		table += `</td>`;
	}
	table += `</table></div>`;
	$("#scheduleTable").append(table);
}


function nullCheck(string) {
	string = `${string}`

	if (string.includes("null")) {
		return "N/A";
	}
	else {
		return string;
	}
}


$(document).ready(function() {

	$("#searchButton").bind("click", function() {
		ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
	});

	$(document).on('keypress',function(e) {
		if (e.which == 13) {
			ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		}
	});
})


function searchCourse(term) {
	if ($("#searchBox").val() !== undefined) {
		let input = $("#searchBox").val().replace(/ /g, '');

		if (input.length > 0) {
			let index = firstNumberIndex(input);
			let course = [input.substring(0, index), input.substring(index)];
			ajaxRequestSubject(course[0], course[1], term);
		}
		else {
			ajaxRequestSubject("default", "default", term);
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
		<a href=https://uwflow.com/course/${json.subject.toLowerCase()}${json.catalog_number.toLowerCase()} target="_blank">UWflow</a>`);
}


function clearCourseInfo() {
	$("#error").html("");
	$("#title").html("");
	$("#description").html("");
	$("#antirequisites").html("");
	$("#corequisites").html("");
	$("#prerequisites").html("");
	$("#links").html("");
	$("#scheduleTable").html("");
}
