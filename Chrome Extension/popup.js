function ajaxRequestSubject(subject, number, terms) {
	$.ajax({
		type: "GET",
		url: `https://api.uwaterloo.ca/v2/courses/${subject}/${number}.json`,
		dataType: "json",
		data: {key: apiKey},
		success: function(result) {

			if (jQuery.isEmptyObject(result.data)) {
				delLoader();
				console.log("Invalid course code");
				$("#error").css("display", "block");
				updateAutoComplete();
			}
			else {
				$("#courseInfo").css("display", "none");
				let restCall1 = `https://api.uwaterloo.ca/v2/terms/${terms[0][0]}/${subject}/${number}/schedule.json`;
				let restCall2 = `https://api.uwaterloo.ca/v2/terms/${terms[1][0]}/${subject}/${number}/schedule.json`;
				let restCall3 = `https://api.uwaterloo.ca/v2/courses/${subject}/${number}/examschedule.json`;

				$.when(
					ajaxCall(restCall1, parseCourseSchedule),
				).then(function() {
					return ajaxCall(restCall2, parseCourseSchedule);
				}).then(function() {
					return ajaxCall(restCall3, parseExamSchedule);
				}).done(function() {
					delLoader();
					$("#scheduleTable div").each(function(index) {
						$(this).prepend(`<p>${terms[index][1]}</p>`);
					});
					updateCourseInfo(result.data);
					$("#courseInfo").css("display", "block");
					updateAutoComplete();
				});
			}
		},
		error: function(xhr, status, error) {
			console.log("error");
  			let err = JSON.parse(xhr.responseText);
  			console.log(err.Message);
		},
	});
}


function ajaxCall(url, onSuccess = (x) => x) {
	return $.ajax({
		type: "GET",
		url: url,
		dataType: "json",
		data: {key: apiKey},
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


function parseCourseSchedule(data) {
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
	renderCourseSchedule(schedule);
}


function sectionType(section) {
	let name = section.split(" ");
	return name[0];
}


function renderCourseSchedule(schedule) {
	let columns = schedule.length;

	let table = `<div><table>`;
	table += 
	`<tr class="table-caption">
		<th>Section</th>
		<th>Class</th>
		<th>Campus</th>
		<th>Enrolled</th>
		<th>Time</th>
		<th>Day(s)</th>
		<th>Location</th>
		<th>Instructor(s)</th>
	</tr>`;

	for (let i = 0; i < columns; i++) {
		table +=
		`<tr>
		<td class="${sectionType(schedule[i].section)}">${nullCheck(schedule[i].section, "N/A")}</td>
		<td>${nullCheck(schedule[i].class, "N/A")}</td>
		<td>${nullCheck(schedule[i].campus, "N/A")}</td>
		<td>${nullCheck(schedule[i].enrollment, "N/A")}</td>
		<td>${nullCheck(schedule[i].date[0][0], "N/A")} - ${nullCheck(schedule[i].date[0][1], "N/A")}`

		let classes = schedule[i].date.length;
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][1], "N/A")} - ${nullCheck(schedule[i].date[j][0], "N/A")}`;
		}
		table += `</td>`;

		table += `<td>${nullCheck(schedule[i].date[0][2], "N/A")}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][2], "N/A")}`;
		}
		table += `</td>`;

		table += `<td>${nullCheck(schedule[i].date[0][3], "N/A")}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].date[j][3], "N/A")}`;
		}
		table += `</td>`;

		table += `<td>${nullCheck(schedule[i].instructors[0], "N/A")}`
		for (let j = 1; j < classes; j++) {
			table += `</br>${nullCheck(schedule[i].instructors[j], "N/A")}`;
		}
		table += `</td>`;
	}
	table += `</table></div>`;
	$("#scheduleTable").append(table);
}


function parseExamSchedule(data) {
	if (!jQuery.isEmptyObject(data) && !data.sections[0].section.includes("Online")) {
		let time = JSON.parse(JSON.stringify(data.sections[0]));

		let sections = time.section;
		let length = data.sections.length;

		for (let i = 1; i < length; i++) {
			if (!data.sections[i].section.includes("Online")) {
				sections += `, ${data.sections[i].section}`
			}
		}
		time.section = sections;
		time.date = formatDate(time.date);
		renderExamSchedule(time);
	}
}


function renderExamSchedule(data) {
	let table = `<p>Final Exam</p><div><table>`;
	table += 
	`<tr class="table-caption">
		<th>Section(s)</th>
		<th>Date</th>
		<th>Time</th>
		<th>Location</th>
	</tr>`;
	table +=
	`<tr>
		<td class="EXAM">${data.section}</td>
		<td>${data.date} (${data.day})</td>
		<td>${data.start_time} - ${data.end_time}</td>
		<td>${data.location}</td>
	</tr></table></div>`
	$("#examTable").append(table);
}


function formatDate(date) {
	let dateArray = date.split("-");
	let month = dateArray[1];
	let day = dateArray[2];
	return `${getMonth(month)} ${getDay(day)}`
}


function getDay(day) {
	let lastChar = day[day.length - 1];
	day = parseInt(day);
	switch(day) {
		case 1:
			return `${day}st`;
		case 2:
			return `${day}nd`;
		case 3:
			return `${day}rd`;
		default:
			return `${day}th`;
	}
}


function getMonth(month) {
	switch(parseInt(month)) {
		case 1:
			return "Jan";
		case 2:
			return "Feb";
		case 3:
			return "Mar";
		case 4:
			return "Apr";
		case 5:
			return "May";
		case 6:
			return "June";
		case 7:
			return "July";
		case 8:
			return "Aug";
		case 9:
			return "Sept";
		case 10:
			return "Oct";
		case 11:
			return "Nov";
		case 12:
			return "Dec";
		default:
			return null;
	}
}


function nullCheck(string, returnValue) {
	string = `${string}`

	if (string.includes("null")) {
		return returnValue;
	}
	else {
		return string;
	}
}


$(document).ready(function() {

	$("#searchButton").click(function() {
		if ($("#searchBox").val() !== undefined) {
			clearCourseInfo();
			addLoader();
			ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		}
	});

	$("#searchBox").focus(function() {
		let value = $(this).val();
		if (value !== undefined) {
			autoComplete(value);
		}
	});

	$("#autocomplete").on("click", ".suggestion", function() {
		clearCourseInfo();
		addLoader();
		let value = $(this).attr("id");
		$("#searchBox").val(value);
		ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		$("#autocomplete").css("display", "none");
	});

	$(document).on('keypress',function(e) {
		let value = $("#searchBox").val();
		if (e.which == 13 && value !== undefined) {
			clearCourseInfo();
			addLoader();
			ajaxCall(`https://api.uwaterloo.ca/v2/terms/list.json`, currentTerm);
		}
	});

	$("#searchBox").on("input", function() {
		let value = $(this).val();
		if (value !== undefined) {
			autoComplete(value);
		}
	});

	$(document).click(function(e) { 
	    var $target = $(e.target);
	    if(!$target.closest('#searchBox').length && !$target.hasClass('#searchBox') && 
	       !$target.closest('#autocomplete').length && !$target.hasClass('#autocomplete')) {
	    	$("#autocomplete").css("display", "none");
	    }
	});

})


function addLoader() {
	$(".loader").css("display", "block");
}


function delLoader() {
	$(".loader").css("display", "none");
}


function searchCourse(term) {
	let input = $("#searchBox").val().replace(/ /g, '').replace(/[^\w\s]/gi, '');

	if (input.length > 0 && !(/^\d+$/.test(input))) {
		let index = firstNumberIndex(input);
		let course = [input.substring(0, index), input.substring(index)];
		ajaxRequestSubject(course[0], course[1], term);
	}
	else {
		ajaxRequestSubject("default", "default", term);
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
	$("#title").html(`<span>Course:</span> ${json.subject} ${json.catalog_number}: ${json.title}`);
	$("#description").html(`<span>Description:</span> ${nullCheck(json.description, "None")}`);
	$("#antirequisites").html(`<span>Antirequisites:</span> ${nullCheck(json.antirequisites, "None")}`);
	$("#corequisites").html(`<span>Corequisites:</span> ${nullCheck(json.corequisites, "None")}`);
	$("#prerequisites").html(`<span>Prerequisites:</span> ${nullCheck(json.prerequisites, "None")}`);
	$("#links").html(
		`<span>Links:</span> <a href=${json.url} target="_blank">UWCalender</a>
		<a href=https://uwflow.com/course/${json.subject.toLowerCase()}${json.catalog_number.toLowerCase()} target="_blank">UWflow</a>`);
	$("#notes").html(
		`<span>Note:</span> All data is retrivied using the University of Waterloo's
		<a href='https://github.com/uwaterloo/api-documentation#accessing-the-api' target="_blank">Open Data API</a>.`);
}


function clearCourseInfo() {
	$("#error").css("display", "none");
	$("#courseInfo").css("display", "none");
	$("#title").html("");
	$("#description").html("");
	$("#antirequisites").html("");
	$("#corequisites").html("");
	$("#prerequisites").html("");
	$("#links").html("");
	$("#scheduleTable").html("");
	$("#examTable").html("");
	$("#notes").html("");
}


function autoComplete(search) {
	if ($("#searchBox").is(":focus")) {
		$("#autocomplete").html("");
		$("#autocomplete").css("display", "block");
		search = search.replace(/ /g, "");
		if (search !== "") {
			search = search.toLowerCase();
			let possibleTerms = courses.filter(x => (includesFirst(search, x.toLowerCase())));
			let length = possibleTerms.length;
			let html = "";

			let windowHeight = $(window).height();
			let bottom = $("#search-field")[0].getBoundingClientRect().bottom + $(window)['scrollTop']();;

			for (let i = 0; i < length; i++) {
				let j = possibleTerms[i].indexOf(" ");
				let data = [possibleTerms[i].slice(0, j), possibleTerms[i].slice(j)];
				html +=
				`<div class="suggestion" id="${data[0]}"><div>${data[0]}</div><div>${data[1]}</div></div>`;
			}
			setMaxHeight();
			$("#autocomplete").html(html);
		}
	}
}


function setMaxHeight() {
	let windowHeight = $(window).height();
	let bottom = $("#search-field")[0].getBoundingClientRect().bottom + $(window)['scrollTop']();
	$("#autocomplete").css("max-height", windowHeight - bottom - 10);
}


function updateAutoComplete() {
	let value = $("#searchBox").val();
	if (value !== undefined) {
		autoComplete(value);
	}
}


function includesFirst(compare, string) {
	let compareLength = compare.length;

	if (string.substring(0, compareLength) === compare) {
		return true;
	}
	else {
		return false;
	}
}


function retriveAllCourses() {
	jQuery.get('courses.txt', function(data) {
    	courses = data.split("\n");
	});
}


function retriveApiKey() {
	jQuery.get('apikey.txt', function(data) {
		apiKey = data;
	});
}


// global variables
var courses;
var apiKey;

window.onload = function() {
  retriveAllCourses();
  retriveApiKey();
}
